"""
Сервис для работы с Atlas Cloud AI API
"""
import httpx
import base64
import asyncio
import logging
import os
import random
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Dict, Any, Optional, List, Tuple

import json
import re

import openai

from config import settings
from atlas_model_configs import (
    ATLAS_MODEL_CONFIGS,
    AtlasModelConfig,
    normalize_merged_ratio_fields,
)
from services.atlas_error_messages import _ATLAS_PROVIDER_ERRORS_RU
from services.backend_proxy_hmac import normalize_backend_api_base
from task_types import IMAGE_QC_TASK_TYPES, TaskType

logger = logging.getLogger(__name__)

# GET /model/prediction/{id}: без keep-alive + retry при обрыве соединения.
_ATLAS_POLL_KEEPALIVE_LIMITS = httpx.Limits(max_keepalive_connections=0, max_connections=100)
_ATLAS_POLL_GET_RETRIES = 3
_ATLAS_POLL_TRANSPORT_ERRORS = (
    httpx.RemoteProtocolError,
    httpx.ConnectError,
    httpx.ReadError,
    httpx.ConnectTimeout,
    httpx.ReadTimeout,
    httpx.WriteTimeout,
    httpx.PoolTimeout,
)

_ATLAS_POLL_CONNECT_TIMEOUT_RU = (
    "Не удалось подключиться к сервису генерации при проверке статуса. "
    "Подождите немного и попробуйте снова."
)
_ATLAS_POLL_READ_TIMEOUT_RU = (
    "Сервис генерации долго не отвечал при проверке статуса. "
    "Подождите немного и попробуйте снова."
)
_ATLAS_HTTP_TIMEOUT_RU = (
    "Превышено время ожидания ответа сервиса генерации. Попробуйте позже."
)
_ATLAS_REF_IMG_INVALID_PREFIX_RU = "Некорректное референс-изображение: "

_ATLAS_FALLBACK_USER_MESSAGE_RU = (
    "Возникла ошибка во время генерации. Попробуйте позже или обратитесь в поддержку."
)

# Сообщения по HTTP-коду, когда тело ответа пустое или без известного текста Atlas.
_ATLAS_HTTP_STATUS_USER_MESSAGE_RU: Dict[int, str] = {
    502: (
        "Сервис генерации вернул ошибку шлюза (502). Подождите немного и попробуйте снова."
    ),
    503: (
        "Сервис генерации временно недоступен. Подождите немного и попробуйте снова; "
        "если ошибка повторяется — обратитесь в поддержку."
    ),
    504: (
        "Сервис генерации не ответил вовремя (504). Подождите немного и попробуйте снова."
    ),
}

# POST / опрос: 429, 502, 503, 504 — повтор с backoff (см. ATLAS_POST_MAX_429_RETRIES).
_ATLAS_TRANSIENT_HTTP_STATUSES = frozenset({429, 502, 503, 504})

_TASK_FAILED_ATLAS_PREFIX_RU = "Задача завершилась ошибкой: "

# OpenAI QC: таймаут/обрыв соединения — не отменяем уже готовый результат Atlas.
_QC_OPENAI_TRANSIENT_EXC_TYPES: Tuple[type, ...] = (
    openai.APITimeoutError,
    openai.APIConnectionError,
)


def localize_atlas_provider_message(msg: str) -> str:
    """Заменяет известные англоязычные сообщения Atlas на русские; иначе возвращает исходную строку."""
    if not msg or not isinstance(msg, str):
        return msg
    low = msg.lower()
    for en, ru in _ATLAS_PROVIDER_ERRORS_RU:
        if en.lower() in low:
            return ru
    return msg


def _looks_like_httpx_status_error_message(msg: str) -> bool:
    """Типичная строка httpx.HTTPStatusError — не показываем пользователю."""
    return " for url '" in msg and (
        "Server error '" in msg
        or "Client error '" in msg
        or "Redirect response" in msg
        or "Informational response" in msg
    )


def _user_facing_atlas_upstream_text(text: str) -> str:
    """
    Текст из ответа Atlas (тело HTTP / вложенное сообщение): только известная карта или общий fallback.
    Сырой английский провайдера без совпадения в карте не отдаём клиенту.
    """
    if not text or not isinstance(text, str):
        return _ATLAS_FALLBACK_USER_MESSAGE_RU
    localized = localize_atlas_provider_message(text)
    if localized != text:
        return localized
    return _ATLAS_FALLBACK_USER_MESSAGE_RU


def _user_facing_exception_text_for_client(text: str) -> str:
    """
    Текст из str(exc): скрыть httpx, применить карту Atlas; иначе короткие русские сообщения нашего кода.
    """
    if not text or not isinstance(text, str):
        return _ATLAS_FALLBACK_USER_MESSAGE_RU
    if _looks_like_httpx_status_error_message(text):
        return _ATLAS_FALLBACK_USER_MESSAGE_RU
    if text.startswith(_TASK_FAILED_ATLAS_PREFIX_RU):
        suffix = text[len(_TASK_FAILED_ATLAS_PREFIX_RU) :].strip()
        return _user_facing_atlas_upstream_text(suffix) if suffix else _ATLAS_FALLBACK_USER_MESSAGE_RU
    localized = localize_atlas_provider_message(text)
    if localized != text:
        return localized
    # ValueError и др. с уже человекочитаемым русским текстом из proxy
    if len(text) <= 400 and any("\u0400" <= c <= "\u04ff" for c in text):
        return text
    return _ATLAS_FALLBACK_USER_MESSAGE_RU


def _user_message_for_atlas_http_status(status_code: int, extracted: Optional[str]) -> str:
    """Сообщение для клиента по HTTP-коду Atlas и опциональному тексту из тела."""
    if extracted:
        localized = localize_atlas_provider_message(extracted)
        if localized != extracted:
            return localized
        if status_code not in _ATLAS_HTTP_STATUS_USER_MESSAGE_RU:
            return _user_facing_atlas_upstream_text(extracted)
    return _ATLAS_HTTP_STATUS_USER_MESSAGE_RU.get(status_code, _ATLAS_FALLBACK_USER_MESSAGE_RU)


def _error_message_for_atlas_exception(exc: BaseException) -> str:
    """Текст ошибки для клиента (Kafka): по возможности из тела ответа Atlas, с локализацией."""
    if isinstance(exc, httpx.ConnectTimeout):
        return _ATLAS_POLL_CONNECT_TIMEOUT_RU
    if isinstance(exc, httpx.ReadTimeout):
        return _ATLAS_POLL_READ_TIMEOUT_RU
    if isinstance(exc, (httpx.WriteTimeout, httpx.PoolTimeout)):
        return _ATLAS_HTTP_TIMEOUT_RU
    if isinstance(exc, httpx.TimeoutException):
        return _ATLAS_HTTP_TIMEOUT_RU
    if isinstance(exc, _QC_OPENAI_TRANSIENT_EXC_TYPES):
        localized = localize_atlas_provider_message("Request timed out")
        if localized != "Request timed out":
            return localized
        return _ATLAS_FALLBACK_USER_MESSAGE_RU
    if isinstance(exc, httpx.HTTPStatusError):
        resp = getattr(exc, "response", None)
        if resp is not None:
            if resp.status_code == 402:
                extracted = _extract_atlas_user_error_message(resp)
                if extracted:
                    return _user_facing_atlas_upstream_text(extracted)
                return (
                    "Сервис генерации вернул ошибку оплаты (402 Payment Required). "
                    "Попробуйте позже или обратитесь в поддержку."
                )
            extracted = _extract_atlas_user_error_message(resp)
            if resp.status_code in _ATLAS_HTTP_STATUS_USER_MESSAGE_RU:
                return _user_message_for_atlas_http_status(resp.status_code, extracted)
            if extracted:
                return _user_facing_atlas_upstream_text(extracted)
            return _ATLAS_FALLBACK_USER_MESSAGE_RU
    return _user_facing_exception_text_for_client(str(exc))


_RAW_HTTP_BODY_MAX_LEN = 8000


def _raw_message_for_atlas_exception(exc: BaseException) -> str:
    """
    Исходный текст ошибки провайдера / тела ответа — для task_errors и Pachca (без локализации).
    """
    if isinstance(exc, httpx.HTTPStatusError):
        resp = getattr(exc, "response", None)
        if resp is not None:
            extracted = _extract_atlas_user_error_message(resp)
            if extracted:
                return extracted
            raw = (resp.text or "").strip()
            if raw:
                if len(raw) > _RAW_HTTP_BODY_MAX_LEN:
                    return raw[: _RAW_HTTP_BODY_MAX_LEN - 3] + "..."
                return raw
        return str(exc)
    text = str(exc)
    if text.startswith(_TASK_FAILED_ATLAS_PREFIX_RU):
        suffix = text[len(_TASK_FAILED_ATLAS_PREFIX_RU) :].strip()
        return suffix if suffix else text
    return text


def _extract_atlas_user_error_message(response: httpx.Response) -> Optional[str]:
    """
    Краткое сообщение провайдера из тела ответа при HTTP-ошибке опроса статуса
    (Atlas иногда отдаёт 500 с вложенным JSON, где реальная причина — например лимит prompt).
    """
    raw = response.text or ""
    if not raw:
        return None
    m = re.search(r"prompt: size must be between \d+ and \d+", raw)
    if m:
        return m.group(0)
    try:
        payload = json.loads(raw)
    except Exception:
        return None
    data = payload.get("data")
    if isinstance(data, dict) and data.get("status") == "failed":
        err = data.get("error")
        if isinstance(err, str) and err:
            m = re.search(r"prompt: size must be between \d+ and \d+", err)
            if m:
                return m.group(0)
            if len(err) < 600 and not err.startswith("unexpected http"):
                return err
    msg = payload.get("message")
    if isinstance(msg, str) and msg and len(msg) < 800:
        return msg
    return None


def _atlas_transient_backoff_sleep_sec(
    response: httpx.Response,
    *,
    default_sec: float,
    min_sec: float,
    max_sec: float,
    jitter_ratio: float,
) -> float:
    """Пауза перед повтором POST/GET при 429/502/503/504."""
    sleep_s = default_sec
    if response.status_code == 429:
        ra = _retry_after_seconds(response)
        if ra is not None:
            sleep_s = ra
    sleep_s = max(min_sec, min(max_sec, sleep_s))
    if jitter_ratio > 0:
        sleep_s *= 1.0 + random.uniform(-jitter_ratio, jitter_ratio)
    return max(0.05, sleep_s)


def _retry_after_seconds(response: httpx.Response) -> Optional[float]:
    """Retry-After в секундах: целое число или HTTP-date."""
    raw = response.headers.get("Retry-After")
    if not raw:
        return None
    raw = raw.strip()
    try:
        return float(int(raw))
    except ValueError:
        pass
    try:
        dt = parsedate_to_datetime(raw)
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        return max(0.0, (dt - now).total_seconds())
    except Exception:
        return None


@dataclass
class TaskData:
    """
    Данные задачи для передачи в Atlas AI сервис.
    
    Содержит метаданные задачи и промпт-фрагмент от GPT (не полный промпт).
    Полный промпт (final_prompt) передается отдельно в методы edit_image, generate_video_from_image, improve_image_quality.
    """
    task_id: str
    user_id: str
    thread_id: str
    task_type: str
    prompt: str  # Только gpt_fragment, не полный промпт
    generation_id: Optional[str] = None  # ID черновика Generation в backend (Kafka → process_gpt_result)
    improve_prompt: Optional[bool] = None  # для биллинга видео в Kafka (complex vs simple промпт)
    backend_api_base: Optional[str] = None  # нормализованный base из resolve_backend_api_base (Kafka + HMAC или default)
    generation_timings: Optional[Dict[str, Any]] = None  # префикс из Kafka requests (например gpt_ms)
    edit_type: Optional[str] = None  # generate_image: clear | mask | infographics | default

    def resolved_backend_base(self) -> str:
        if self.backend_api_base is not None and str(self.backend_api_base).strip():
            return str(self.backend_api_base).rstrip("/")
        try:
            return normalize_backend_api_base(settings.BACKEND_URL)
        except ValueError:
            return settings.BACKEND_URL.rstrip("/")


_TIMING_KEYS = ("gpt_ms", "atlas_provider_ms", "result_download_ms")


def _merge_generation_timings(
    task_data: TaskData,
    local_ms: Dict[str, Any],
) -> Dict[str, int]:
    """Префикс из Kafka requests + локальные замеры Atlas; local перекрывает совпадающие ключи."""
    out: Dict[str, int] = {}
    prec = task_data.generation_timings
    if isinstance(prec, dict):
        for k in _TIMING_KEYS:
            if k not in prec:
                continue
            try:
                out[k] = int(round(float(prec[k])))
            except (TypeError, ValueError):
                pass
    for k, v in local_ms.items():
        if k not in _TIMING_KEYS or v is None:
            continue
        try:
            out[k] = int(round(float(v)))
        except (TypeError, ValueError):
            pass
    return out


def _atlas_cloud_model_id(model: str) -> str:
    """Идентификатор модели в теле запроса Atlas Cloud: часть до «#» (суффикс только для ключей в наших конфигах)."""
    if not model:
        return model
    return model.split("#", 1)[0]


def _apply_value_normalizer(key: str, body: Dict[str, Any], strategy: str) -> None:
    if key not in body:
        return
    val = body[key]
    if strategy == "strip":
        if not isinstance(val, str):
            body.pop(key, None)
            return
        t = val.strip()
        if t:
            body[key] = t
        else:
            body.pop(key, None)
    elif strategy == "lower":
        if not isinstance(val, str):
            body.pop(key, None)
            return
        if key == "resolution":
            r = val.strip().lower()
            if r in ("1k", "2k", "4k"):
                body[key] = r
            else:
                body.pop(key, None)
        elif key == "media_resolution":
            m = val.strip().lower()
            if m in ("default", "low", "medium", "high"):
                body[key] = m
            else:
                body.pop(key, None)
        else:
            body[key] = val.strip().lower()
    elif strategy == "map_jpeg":
        if not isinstance(val, str):
            body.pop(key, None)
            return
        o = val.strip().lower()
        if o == "jpg":
            body[key] = "jpeg"
        elif o in ("default", "png", "jpeg"):
            body[key] = o
        else:
            body.pop(key, None)


def _apply_strict_body_rules(config: AtlasModelConfig, body: Dict[str, Any]) -> None:
    """Если в конфиге задан allowed_body_keys — удаляем прочие ключи и нормализуем значения."""
    allowed = getattr(config, "allowed_body_keys", None) or []
    if not allowed:
        return
    allowed_set = set(allowed) | {"model"}
    it = config.input_type
    if it in body:
        allowed_set.add(it)
    lf = getattr(config, "last_frame_param", None)
    if lf and lf in body:
        allowed_set.add(lf)
    for k in list(body.keys()):
        if k not in allowed_set:
            body.pop(k, None)
    norm = getattr(config, "value_normalizers", None) or {}
    for field, strategy in norm.items():
        _apply_value_normalizer(field, body, strategy)


def _video_billing_kafka_fields(body: Dict[str, Any], task_data: TaskData) -> Dict[str, Any]:
    """Поля для списания токенов на backend (как в теле запроса Atlas после merge extra_params + options)."""
    sound_on = bool(body.get("generate_audio")) or bool(body.get("sound"))
    imp = task_data.improve_prompt
    improve = True if imp is None else bool(imp)
    return {"video_sound_enabled": sound_on, "video_improve_prompt": improve}


def _images_field_name(config: AtlasModelConfig) -> str:
    """
    Имя поля массива изображений в теле Atlas.
    Приоритет: явный config.images_field из backend /config/models (или local fallback),
    затем совместимость по input_type.
    """
    fld = getattr(config, "images_field", None)
    if isinstance(fld, str):
        v = fld.strip()
        if v in ("images", "reference_images"):
            return v
    return "reference_images" if config.input_type == "reference_images" else "images"


def _detect_image_signature(data: bytes) -> Optional[str]:
    """Определяет формат по magic bytes: jpeg|png|webp|gif или None."""
    if not data:
        return None
    if data.startswith(b"\xFF\xD8\xFF"):
        return "jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    if data.startswith(b"GIF87a") or data.startswith(b"GIF89a"):
        return "gif"
    return None


def _content_type_main(content_type: Optional[str]) -> str:
    if not content_type:
        return ""
    return str(content_type).split(";", 1)[0].strip().lower()


class AtlasAIService:
    """Сервис для работы с Atlas Cloud AI API для редактирования изображений и генерации видео"""
    
    def __init__(self):
        self.api_key = settings.ATLAS_API_KEY
        self.api_url = settings.ATLAS_API_URL
        self.timeout = settings.ATLAS_TIMEOUT
        self.timeout_video = settings.ATLAS_TIMEOUT_VIDEO
        self.max_attempts = settings.ATLAS_MAX_ATTEMPTS
        self.max_attempts_video = max(1, int(settings.ATLAS_MAX_ATTEMPTS_VIDEO))
        self.poll_max_wait_image_sec = settings.ATLAS_POLL_MAX_WAIT_IMAGE_SEC
        self.poll_max_wait_video_sec = settings.ATLAS_POLL_MAX_WAIT_VIDEO_SEC
        self.poll_interval_image_sec = max(0.1, float(settings.ATLAS_POLL_INTERVAL_IMAGE_SEC))
        self.poll_interval_video_sec = max(0.1, float(settings.ATLAS_POLL_INTERVAL_VIDEO_SEC))
        jr = settings.ATLAS_POLL_JITTER_RATIO
        self.poll_jitter_ratio = min(0.5, max(0.0, jr))
        self.poll_429_default_sec = settings.ATLAS_POLL_429_DEFAULT_SEC
        self.poll_429_sleep_min_sec = settings.ATLAS_POLL_429_SLEEP_MIN_SEC
        self.poll_429_sleep_max_sec = settings.ATLAS_POLL_429_SLEEP_MAX_SEC
        self.post_max_429_retries = max(0, settings.ATLAS_POST_MAX_429_RETRIES)
        self.result_download_timeout_video_sec = max(
            60, int(settings.ATLAS_RESULT_DOWNLOAD_TIMEOUT_VIDEO_SEC)
        )
        self.result_download_timeout_image_sec = max(
            60, int(settings.ATLAS_RESULT_DOWNLOAD_TIMEOUT_IMAGE_SEC)
        )
        poll_connect = max(10.0, float(settings.ATLAS_POLL_CONNECT_TIMEOUT_SEC))
        poll_read = max(10.0, float(settings.ATLAS_POLL_READ_TIMEOUT_SEC))
        self.poll_get_timeout = httpx.Timeout(
            connect=poll_connect,
            read=poll_read,
            write=30.0,
            pool=30.0,
        )
        self.ref_image_validation_enabled = bool(
            getattr(settings, "ATLAS_REF_IMAGE_VALIDATION_ENABLED", False)
        )
        self.client: Optional[httpx.AsyncClient] = None
        self.poll_client: Optional[httpx.AsyncClient] = None

        # Quality checks (QC) for strict marketplace constraints.
        # По умолчанию выключено (чтобы не замедлять выдачу).
        # Включение: env ATLAS_QC_ENABLE=1 (или IS_QC_ENABLE=1).
        self.qc_enabled: bool = os.environ.get("ATLAS_QC_ENABLE") == "1"
        # 0 disables retries; 1-2 is usually enough.
        self.qc_max_retries: int = int(getattr(settings, "ATLAS_QC_MAX_RETRIES", 2)) if self.qc_enabled else 0
        self._qc_openai_client: Optional[openai.AsyncOpenAI] = None
        # Универсальный fallback на другие модели при ошибке (по умолчанию выключен).
        # Включение: ATLAS_ERROR_FALLBACK_ENABLE=1
        self.error_fallback_enabled: bool = os.environ.get("ATLAS_ERROR_FALLBACK_ENABLE") == "True"
        # Максимум переключений на альтернативные модели в рамках одной задачи.
        # Пример: 2 => base model + до 2 fallback попыток.
        self.error_fallback_max_hops: int = int(os.environ.get("ATLAS_ERROR_FALLBACK_MAX_HOPS", "2"))
        # Опциональный приоритетный список моделей (CSV), например:
        # ATLAS_ERROR_FALLBACK_MODELS="modelA,modelB,modelC"
        self.error_fallback_models_csv: str = os.environ.get("ATLAS_ERROR_FALLBACK_MODELS", "")
        
        # Модели, которые используются для конкретных задач
        self.used_models: Dict[str, str] = {
            "edit": os.environ.get("ATLAS_MODEL_EDIT", "bytedance/seedream-v5.0-lite/edit"),
            "video": os.environ.get("ATLAS_MODEL_VIDEO", "google/veo3.1/image-to-video"),
            "improve": os.environ.get("ATLAS_MODEL_IMPROVE", "alibaba/qwen-image/edit-plus"),
            "text_image": os.environ.get(
                "ATLAS_MODEL_TEXT_IMAGE", "openai/gpt-image-2/text-to-image"
            ),
            "text_video": os.environ.get(
                "ATLAS_MODEL_TEXT_VIDEO", "google/veo3.1-lite/text-to-video"
            ),
            "reference_video": os.environ.get(
                "ATLAS_MODEL_REFERENCE_VIDEO", "google/veo3.1/reference-to-video"
            ),
            "video_video": os.environ.get(
                "ATLAS_MODEL_VIDEO_VIDEO", "kwaivgi/kling-video-o3-std/video-edit"
            ),
        }

        # Конфигурация моделей Atlas AI (загружается с backend при initialize)
        self.model_configs: Dict[str, AtlasModelConfig] = {}

    _HTTP_ERROR_BODY_MAX_LEN = 4000

    def _log_http_error_response(self, response: httpx.Response, context: str) -> None:
        """Логирует тело ответа при неуспешном HTTP (для отладки upstream)."""
        if response.is_success:
            return
        body = response.text or ""
        if len(body) > self._HTTP_ERROR_BODY_MAX_LEN:
            body = body[: self._HTTP_ERROR_BODY_MAX_LEN] + "..."
        logger.error(
            "[Atlas AI] HTTP %s для %s. Тело ответа: %s",
            response.status_code,
            context,
            body if body else "(пусто)",
        )

    def _raise_for_status_with_body(self, response: httpx.Response, context: str) -> None:
        """raise_for_status с логированием тела ответа при 4xx/5xx (upstream часто отдаёт detail в JSON)."""
        if not response.is_success:
            self._log_http_error_response(response, context)
        response.raise_for_status()

    def _atlas_storage_link_base(self, backend_base: Optional[str] = None) -> str:
        """
        База для URL в теле Atlas (reference_images, video).
        Приоритет: backend_base конкретной задачи (из Kafka/HMAC), fallback — settings.BACKEND_URL.
        """
        raw_base = backend_base if (backend_base and str(backend_base).strip()) else settings.BACKEND_URL
        try:
            return normalize_backend_api_base(raw_base)
        except ValueError:
            return str(raw_base).rstrip("/")

    def _storage_file_url(self, base: str, user_id: str, path: str) -> str:
        p = (path or "").strip()
        if p.startswith(("http://", "https://")):
            return p
        backend_url = base.rstrip("/")
        if p.startswith("/storage/"):
            return f"{backend_url}{p}"
        return f"{backend_url}/storage/{user_id}/{p}"

    def _atlas_json_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def _validate_reference_image_url(self, image_url: str) -> None:
        """
        Быстрая проверка референса до POST в Atlas:
        - HEAD: доступность и Content-Type
        - GET Range: сигнатура первых байт
        Разрешаем только JPEG/PNG.
        """
        if not self.client:
            await self.initialize()
        if not self.client:
            raise ValueError(
                f"{_ATLAS_REF_IMG_INVALID_PREFIX_RU}не удалось инициализировать HTTP-клиент."
            )

        validation_timeout_sec = 20.0
        signature_bytes_max = 64

        timeout = httpx.Timeout(
            connect=validation_timeout_sec,
            read=validation_timeout_sec,
            write=10.0,
            pool=10.0,
        )
        head_status: Optional[int] = None
        ct = ""
        try:
            head_resp = await self.client.head(image_url, timeout=timeout)
            head_status = head_resp.status_code
            ct = _content_type_main(head_resp.headers.get("Content-Type"))
        except Exception:
            # Некоторые storage/CDN не поддерживают HEAD; fallback на GET.
            pass

        # HEAD в инфраструктуре может быть отключён (405) или отдавать иные ответы,
        # тогда опираемся на GET + сигнатуру содержимого.
        if head_status is not None and head_status >= 400 and head_status != 405:
            logger.warning(
                "[Atlas AI] reference validation: HEAD %s for %s, fallback to GET",
                head_status,
                image_url,
            )
        if ct and not ct.startswith("image/"):
            logger.warning(
                "[Atlas AI] reference validation: HEAD Content-Type '%s' for %s, fallback to GET",
                ct,
                image_url,
            )

        max_b = signature_bytes_max
        get_resp = await self.client.get(
            image_url,
            headers={"Range": f"bytes=0-{max_b - 1}"},
            timeout=timeout,
        )
        if get_resp.status_code >= 400:
            raise ValueError(
                f"{_ATLAS_REF_IMG_INVALID_PREFIX_RU}URL недоступен (GET {get_resp.status_code}): {image_url}"
            )

        get_ct = _content_type_main(get_resp.headers.get("Content-Type"))
        if get_ct and not get_ct.startswith("image/"):
            raise ValueError(
                f"{_ATLAS_REF_IMG_INVALID_PREFIX_RU}неверный Content-Type '{get_ct}' (ожидается image/jpeg или image/png)."
            )

        sig = _detect_image_signature(get_resp.content[:max_b])
        if sig not in ("jpeg", "png"):
            sig_text = sig or "unknown"
            raise ValueError(
                f"{_ATLAS_REF_IMG_INVALID_PREFIX_RU}неподдерживаемый формат '{sig_text}' "
                f"(ожидается JPEG или PNG)."
            )
        if get_ct:
            allowed_ct = {"image/jpeg", "image/jpg", "image/png"}
            if get_ct not in allowed_ct:
                raise ValueError(
                    f"{_ATLAS_REF_IMG_INVALID_PREFIX_RU}Content-Type '{get_ct}' не соответствует "
                    f"допустимым форматам JPEG/PNG."
                )

    def _resolve_model(self, key: str, model: Optional[str]) -> str:
        return model if (model and model in self.model_configs) else self.used_models[key]

    def _merged_model_options(
        self,
        config: AtlasModelConfig,
        options: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        merged: Dict[str, Any] = dict(config.extra_params or {})
        if options and isinstance(options, dict):
            merged.update(options)
        normalize_merged_ratio_fields(config, merged)
        return merged

    def _video_duration_sec_for_kafka(self, merged: Dict[str, Any]) -> int:
        raw_duration = merged.get("duration", 5)
        try:
            return max(1, int(raw_duration))
        except (TypeError, ValueError):
            return 5

    def _fallback_model_candidates(
        self,
        *,
        current_model: str,
        config: AtlasModelConfig,
        attempted_models: set[str],
    ) -> List[str]:
        """
        Возвращает совместимые альтернативные модели для fallback:
        - тот же media type (video/image),
        - тот же input_type ("image"/"images"/"reference_images"/"none"),
        - исключая уже попробованные.
        """
        preferred = [
            m.strip()
            for m in (self.error_fallback_models_csv or "").split(",")
            if m.strip()
        ]
        ordered: List[str] = []
        for mid in preferred:
            cfg = self.model_configs.get(mid)
            if not cfg:
                continue
            if cfg.is_video != config.is_video:
                continue
            if cfg.input_type != config.input_type:
                continue
            if mid not in ordered:
                ordered.append(mid)

        for mid, cfg in self.model_configs.items():
            if cfg.is_video != config.is_video:
                continue
            if cfg.input_type != config.input_type:
                continue
            if mid not in ordered:
                ordered.append(mid)

        return [m for m in ordered if m not in attempted_models and m != current_model]

    def _is_retryable_for_model_fallback(self, exc: Exception) -> bool:
        """
        Какие ошибки можно пробовать лечить сменой модели.
        """
        if isinstance(exc, httpx.HTTPStatusError):
            code = exc.response.status_code if exc.response is not None else None
            # Auth/billing обычно не лечатся сменой модели.
            if code in (401, 402, 403):
                return False
            return True
        if isinstance(exc, asyncio.TimeoutError):
            return True
        if isinstance(exc, ValueError):
            # Наши валидационные ошибки до вызова провайдера менять моделью бессмысленно.
            txt = str(exc)
            if txt.startswith("Необходимо указать хотя бы одно входное изображение"):
                return False
            if txt.startswith("Не удалось загрузить изображение"):
                return False
            if txt.startswith("Неизвестная модель для Atlas AI"):
                return False
            return True
        # По умолчанию разрешаем (но fallback выключен флагом).
        return True

    def _build_kafka_base_payload(self, task_data: TaskData, model: str) -> Dict[str, Any]:
        payload = {
            "task_id": task_data.task_id,
            "user_id": task_data.user_id,
            "thread_id": task_data.thread_id,
            "task_type": task_data.task_type,
            "prompt": task_data.prompt,
            "ai_model": model,
        }
        if task_data.generation_id is not None:
            payload["generation_id"] = task_data.generation_id
        return payload

    def _build_kafka_success_payload(
        self,
        task_data: TaskData,
        model: str,
        result_data: Dict[str, Any],
        config: AtlasModelConfig,
        merged: Dict[str, Any],
        *,
        qc: Optional[Dict[str, Any]] = None,
        generation_timings: Optional[Dict[str, int]] = None,
    ) -> Dict[str, Any]:
        payload = {
            **self._build_kafka_base_payload(task_data, model),
            **result_data,
        }
        if config.is_video:
            payload["video_duration_sec"] = self._video_duration_sec_for_kafka(merged)
        payload.update(_video_billing_kafka_fields(merged, task_data))
        if qc:
            payload["qc"] = qc
            payload["qc_passed"] = bool(qc.get("pass", True)) if isinstance(qc, dict) else True
        if generation_timings:
            payload["generation_timings"] = generation_timings
        return payload

    async def load_model_configs_from_backend(self) -> bool:
        """
        Загружает конфиг моделей с backend. Возвращает True при успехе.
        При ошибке — False (используется fallback на локальный конфиг).

        При успехе: `self.model_configs = {**локальный ATLAS_MODEL_CONFIGS, **ответ backend}`.
        Для одинакового id конфиг с backend заменяет локальный.
        """
        base = settings.BACKEND_URL.rstrip("/")
        config_urls = (
            f"{base}/api/config/models",
            f"{base}/api/config/ai_models",
        )
        last_url = config_urls[0]
        for attempt in range(3):
            try:
                data = None
                async with httpx.AsyncClient(timeout=10.0) as client:
                    for config_url in config_urls:
                        last_url = config_url
                        resp = await client.get(config_url)
                        if resp.status_code == 404 and config_url != config_urls[-1]:
                            logger.warning(
                                "[Atlas AI] GET %s → 404, пробуем legacy %s",
                                config_url,
                                config_urls[-1],
                            )
                            continue
                        self._raise_for_status_with_body(resp, f"GET backend {config_url}")
                        data = resp.json()
                        break
                if data is None:
                    raise ValueError("Не удалось загрузить конфиг моделей с backend")
                # Поля AtlasModelConfig (size_options, aspect_ratio_options и т.д. — только для /models, proxy не использует)
                _config_fields = {
                    "endpoint",
                    "input_type",
                    "images_field",
                    "is_video",
                    "is_link_needed",
                    "extra_params",
                    "file_ext",
                    "result_url_key",
                    "tokens_per_request",
                    "last_frame_param",
                    "max_prompt_chars",
                    "allowed_body_keys",
                    "value_normalizers",
                    "ratio_param",
                }
                parsed: Dict[str, AtlasModelConfig] = {}
                for model_id, d in data.items():
                    if not isinstance(d, dict):
                        continue
                    kwargs = {k: v for k, v in d.items() if k in _config_fields}
                    parsed[model_id] = AtlasModelConfig(**kwargs)
                merged: Dict[str, AtlasModelConfig] = dict(ATLAS_MODEL_CONFIGS)
                merged.update(parsed)
                self.model_configs = merged
                logger.info(
                    "Atlas AI: с backend получено %s моделей; после слияния с локальным atlas_model_configs: %s",
                    len(parsed),
                    len(merged),
                )
                return True
            except Exception as e:
                logger.warning(
                    "Попытка %s/3 загрузки /api/config/models с backend (%s): %s",
                    attempt + 1,
                    last_url,
                    e,
                )
                if attempt < 2:
                    await asyncio.sleep(2)
        return False

    async def initialize(self):
        """Инициализация HTTP клиента и загрузка конфига моделей"""
        if not await self.load_model_configs_from_backend():
            self.model_configs = ATLAS_MODEL_CONFIGS
            logger.info("Используется локальный fallback конфиг Atlas AI")
        if not self.api_key:
            logger.warning("ATLAS_API_KEY не установлен")
            return
        try:
            client_timeout = max(float(self.timeout), float(self.timeout_video))
            self.client = httpx.AsyncClient(
                timeout=httpx.Timeout(client_timeout),
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
                follow_redirects=True,
            )
            self.poll_client = httpx.AsyncClient(
                timeout=self.poll_get_timeout,
                limits=_ATLAS_POLL_KEEPALIVE_LIMITS,
                follow_redirects=True,
            )
            logger.info("Atlas AI сервис инициализирован")
        except Exception as e:
            logger.error(f"Ошибка инициализации Atlas AI сервиса: {e}")
    
    async def cleanup(self):
        """Очистка ресурсов"""
        if self.client:
            await self.client.aclose()
            self.client = None
        if self.poll_client:
            await self.poll_client.aclose()
            self.poll_client = None
        if self._qc_openai_client:
            await self._qc_openai_client.close()
            self._qc_openai_client = None

    def _extract_json_object(self, text: str) -> Optional[str]:
        if not text:
            return None
        text = text.strip()
        if text.startswith("{") and text.endswith("}"):
            return text
        m = re.search(r"\{[\s\S]*\}", text)
        return m.group(0) if m else None

    async def _get_qc_openai_client(self) -> Optional[openai.AsyncOpenAI]:
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            return None
        if self._qc_openai_client:
            return self._qc_openai_client
        self._qc_openai_client = openai.AsyncOpenAI(
            api_key=api_key,
            timeout=30.0,
            max_retries=1,
        )
        return self._qc_openai_client

    async def _qc_compare_images(
        self,
        *,
        before_b64: str,
        after_bytes: bytes,
        task_type: str,
        prompt: str,
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Minimal QC via OpenAI vision:
        - detects whether existing text/logos likely changed
        - detects face/identity drift if a person is present
        Returns (passed, details).
        """
        client = await self._get_qc_openai_client()
        if not client:
            return True, {"skipped": True, "reason": "no_openai_api_key"}

        qc_model = getattr(settings, "OPENAI_QC_MODEL", None) or "gpt-4o-mini"
        after_b64 = base64.b64encode(after_bytes).decode("utf-8")

        system = (
            "You are a strict quality control system for marketplace image editing.\n"
            "Compare BEFORE (original/base) and AFTER (edited) images.\n"
            "Return ONLY a single JSON object, no extra text.\n"
            "Keys: pass (boolean), text_changed (boolean|\"unknown\"), identity_changed (boolean|\"unknown\"), "
            "text_content_changed (boolean|\"unknown\"), infographic_layout_changed (boolean|\"unknown\"), "
            "logo_redrawn (boolean|\"unknown\"), tonal_drift (boolean|\"unknown\"), "
            "white_background_washout (boolean|\"unknown\"), opacity_shift (boolean|\"unknown\"), "
            "reasons (array of strings).\n"
            "Rules:\n"
            "- Existing text/logos/labels/icons/infographics/QR/barcodes must remain unchanged and readable.\n"
            "- If a person/model is present, face/body identity must remain unchanged.\n"
            "- Ignore allowed changes if they do not violate these two rules.\n"
        )
        if task_type == TaskType.IMPROVE_QUALITY:
            system += (
                "Task-specific strict rules for improve_quality:\n"
                "- Fail if any existing text content changes (letters/words/language/paraphrase/retypeset).\n"
                "- Fail if any numerals/prices/units/SKU/article codes or punctuation change.\n"
                "- Fail if infographic layout changes (moved/resized/reordered labels/badges/icons/blocks).\n"
                "- Fail if logos/brand marks appear redrawn or replaced.\n"
                "- Fail if tonality drifts (washed-out contrast, lifted/faded whites, overexposure).\n"
                "- Fail if white background becomes milky/grayish/hazy or looks transparency-like.\n"
                "- Fail if global/background opacity perception shifts.\n"
                "When failing, set pass=false and set corresponding booleans."
            )
        user_text = (
            f"Task type: {task_type}\n"
            f"Prompt excerpt:\n{prompt[:400]}\n"
            "Check if existing text/logos changed and if identity changed.\n"
            "For improve_quality also check tonal drift, white background washout, and opacity shift.\n"
        )

        try:
            resp = await client.chat.completions.create(
                model=qc_model,
                temperature=0,
                messages=[
                    {"role": "system", "content": system},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_text},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/png;base64,{before_b64}"},
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/png;base64,{after_b64}"},
                            },
                        ],
                    },
                ],
            )
        except _QC_OPENAI_TRANSIENT_EXC_TYPES as e:
            logger.warning(
                "[QC] OpenAI недоступен или таймаут (%s): %s — QC пропущен, результат Atlas сохраняется",
                type(e).__name__,
                e,
            )
            return True, {
                "skipped": True,
                "reason": "qc_openai_timeout",
                "error": str(e)[:300],
            }

        content = (resp.choices[0].message.content or "").strip()
        json_text = self._extract_json_object(content)
        if not json_text:
            return True, {"skipped": True, "reason": "qc_invalid_format", "raw": content[:500]}

        try:
            data = json.loads(json_text)
        except Exception:
            return True, {"skipped": True, "reason": "qc_invalid_json", "raw": content[:500]}

        passed = bool(data.get("pass", True))
        if task_type == TaskType.IMPROVE_QUALITY:
            hard_fail_keys = (
                "text_changed",
                "text_content_changed",
                "infographic_layout_changed",
                "logo_redrawn",
                "tonal_drift",
                "white_background_washout",
                "opacity_shift",
            )
            if any(data.get(k) is True for k in hard_fail_keys):
                passed = False
        return passed, data

    async def _prepare_images(
        self,
        user_id: str,
        images: Optional[List[str]],
        input_type: str,
        is_link_needed: bool,
        backend_base: str,
    ) -> List[str]:
        """
        Готовит входные изображения в нужном формате:

        - Если is_link_needed=True: URL на GET /storage/… (BACKEND_URL), чтобы Atlas скачал картинку.
        - Если is_link_needed=False: base64 после загрузки с backend_base (backend_api_base / BACKEND_URL).

        Для input_type="image" используется только первое изображение.
        Для input_type="images" и "reference_images" используются все изображения.
        """
        if isinstance(images, str):
            images = [images]
        elif images is not None and not isinstance(images, list):
            try:
                images = list(images)
            except TypeError:
                images = [str(images)]

        images = [str(img).strip() for img in (images or []) if str(img).strip()]
        if not images:
            raise ValueError("Необходимо указать хотя бы одно входное изображение")

        result: List[str] = []
        use_links = is_link_needed
        url_base = self._atlas_storage_link_base(backend_base) if use_links else backend_base.rstrip("/")

        if input_type == "image":
            image_path = images[0]
            if use_links:
                result.append(self._storage_file_url(url_base, user_id, image_path))
            else:
                logger.info(f"Загрузка изображения: {image_path}")
                image_bytes = await self._load_image_from_backend(
                    user_id, image_path, backend_base=backend_base
                )
                if not image_bytes:
                    raise ValueError(f"Не удалось загрузить изображение {image_path}")
                result.append(base64.b64encode(image_bytes).decode("utf-8"))
                logger.info(f"Изображение загружено: {len(image_bytes)} байт")
        elif input_type in ("images", "reference_images"):
            if use_links:
                for image_path in images:
                    result.append(self._storage_file_url(url_base, user_id, image_path))
                if self.ref_image_validation_enabled:
                    for idx, image_url in enumerate(result, start=1):
                        await self._validate_reference_image_url(image_url)
                        logger.info(
                            "[Atlas AI] reference image %s/%s validated: %s",
                            idx,
                            len(result),
                            image_url,
                        )
            else:
                logger.info(f"Загрузка {len(images)} изображений")
                for image_path in images:
                    image_bytes = await self._load_image_from_backend(
                        user_id, image_path, backend_base=backend_base
                    )
                    if not image_bytes:
                        raise ValueError(f"Не удалось загрузить изображение {image_path}")
                    result.append(base64.b64encode(image_bytes).decode("utf-8"))
                    logger.info(f"Изображение загружено: {image_path}, размер: {len(image_bytes)} байт")
        else:
            raise ValueError(f"Неизвестный тип входных данных для модели: {input_type}")

        return result

    async def _prepare_single_path(
        self,
        user_id: str,
        media_path: str,
        *,
        is_link_needed: bool,
        backend_base: str,
    ) -> str:
        """Один входной файл (видео или изображение) — URL storage (BACKEND_URL) или base64."""
        if is_link_needed:
            return self._storage_file_url(self._atlas_storage_link_base(backend_base), user_id, media_path)
        logger.info(f"Загрузка медиа: {media_path}")
        media_bytes = await self._load_image_from_backend(
            user_id, media_path, backend_base=backend_base
        )
        if not media_bytes:
            raise ValueError(f"Не удалось загрузить файл {media_path}")
        return base64.b64encode(media_bytes).decode("utf-8")

    async def generate_with_model(
        self,
        model: str,
        prompt: str,  # final_prompt - полный промпт для API
        task_data: TaskData,
        images: Optional[List[str]] = None,
        options: Optional[Dict[str, Any]] = None,
        end_image: Optional[str] = None,
        video: Optional[str] = None,
        attempted_models: Optional[set[str]] = None,
    ) -> Dict[str, Any]:
        """
        Унифицированный метод генерации медиа через Atlas AI.

        Снаружи вы всегда передаёте только:
        - model: имя модели (ключ в self.model_configs; в тело Atlas уходит без суффикса после «#»);
        - prompt: финальный текстовый промпт (final_prompt);
        - task_data: данные задачи (task_id, user_id, thread_id, task_type, prompt - только gpt_fragment);
        - images: список путей к изображениям (одно или несколько).

        Под капотом по имени модели выбирается:
        - нужный endpoint;
        - схема тела запроса (image / images + дополнительные поля);
        - тип результата (картинка или видео) и расширение файла.
        """
        if not self.client:
            await self.initialize()

        if not self.client:
            raise ValueError("Atlas AI клиент не инициализирован")

        if model not in self.model_configs:
            raise ValueError(f"Неизвестная модель для Atlas AI: {model}")

        config = self.model_configs[model]
        attempted: set[str] = set(attempted_models or set())
        attempted.add(model)

        try:
            # Проверяем режим симуляции
            if settings.MOCK_ATLAS_AI:
                logger.info(f"[MOCK] Симуляция Atlas AI запроса для task_id={task_data.task_id}, model={model}")
                
                # Генерируем мок-результат
                mock_file_path = f"mock_{task_data.task_id}.{config.file_ext}"
                mock_file_url = f"/storage/{task_data.user_id}/{mock_file_path}"
                mock_storage_url = f"/storage/{task_data.user_id}/{mock_file_path}"
                bb = task_data.resolved_backend_base()
                result_data: Dict[str, Any] = {
                    "file_path": mock_file_path,
                    "file_url": f"{bb}{mock_file_url}",
                    config.result_url_key: mock_storage_url,
                }
                merged_options = self._merged_model_options(config, options)
                mock_timings = _merge_generation_timings(
                    task_data,
                    {
                        "atlas_provider_ms": 0,
                        "result_download_ms": 0,
                    },
                )
                kafka_payload = self._build_kafka_success_payload(
                    task_data,
                    model,
                    result_data,
                    config,
                    merged_options if config.is_video else {},
                    generation_timings=mock_timings or None,
                )

                from services.kafka_service import kafka_service
                await kafka_service.send_gpt_result(
                    kafka_payload, backend_base=task_data.resolved_backend_base()
                )
                
                logger.info(f"[MOCK] Результат отправлен в Kafka для task_id={task_data.task_id}")
                return kafka_payload
            
            # 1. Готовим входы; "none" — только текст; video_images — video + опционально images
            prepared_images: List[str] = []
            prepared_video: Optional[str] = None
            qc_before_b64: Optional[str] = None
            bb = task_data.resolved_backend_base()
            if config.input_type == "video_images":
                if not video or not str(video).strip():
                    raise ValueError("Необходимо указать исходное видео (video)")
                # Как video_preview (Veo): Atlas скачивает вход по публичному URL backend storage;
                # base64 для video-edit ломает price probe на стороне Atlas.
                use_video_links = True
                prepared_video = await self._prepare_single_path(
                    task_data.user_id,
                    str(video).strip(),
                    is_link_needed=use_video_links,
                    backend_base=bb,
                )
                logger.info(
                    "[Atlas AI] video_images: исходное видео как URL для Atlas: %s",
                    prepared_video,
                )
                if images and len(images) > 0:
                    prepared_images = await self._prepare_images(
                        user_id=task_data.user_id,
                        images=images,
                        input_type="images",
                        is_link_needed=use_video_links,
                        backend_base=bb,
                    )
            elif config.input_type != "none":
                prepared_images = await self._prepare_images(
                    user_id=task_data.user_id,
                    images=images,
                    input_type=config.input_type,
                    is_link_needed=config.is_link_needed,
                    backend_base=bb,
                )

                # Для QC берем "base" изображение (как правило image #1).
                # QC делаем только когда вход — base64 (не ссылки) и результат — картинка.
                if (not config.is_video) and (not config.is_link_needed) and prepared_images:
                    qc_before_b64 = prepared_images[0]

            last_qc: Dict[str, Any] = {}
            current_prompt = prompt

            total_tries = max(1, self.qc_max_retries + 1)
            for qc_try in range(total_tries):
                # 2. Формируем URL и body запроса
                url = f"{self.api_url}/model/{config.endpoint}"

                body: Dict[str, Any] = {
                    "model": model,
                    "prompt": current_prompt,  # final_prompt используется для API
                }

                if config.input_type == "image":
                    body["image"] = prepared_images[0]
                elif config.input_type == "images":
                    body[_images_field_name(config)] = prepared_images
                elif config.input_type == "reference_images":
                    body[_images_field_name(config)] = prepared_images
                elif config.input_type == "video_images":
                    body["video"] = prepared_video
                    if prepared_images:
                        body["images"] = prepared_images

                # Опции от пользователя переопределяют model extra_params.
                body.update(self._merged_model_options(config, options))
                body["model"] = _atlas_cloud_model_id(str(body.get("model", model)))

                lf_key = getattr(config, "last_frame_param", None)
                if lf_key and end_image:
                    prepared_end = await self._prepare_images(
                        user_id=task_data.user_id,
                        images=[end_image],
                        input_type="image",
                        is_link_needed=config.is_link_needed,
                        backend_base=bb,
                    )
                    if prepared_end:
                        body[lf_key] = prepared_end[0]

                _apply_strict_body_rules(config, body)
                if config.allowed_body_keys:
                    n_img = body.get("images")
                    n_img = len(n_img) if isinstance(n_img, list) else (1 if n_img else 0)
                    logger.info(
                        "[Atlas AI] strict body (model=%s): keys=%s, n_images=%s",
                        model,
                        sorted(k for k in body if k not in ("images", "image")),
                        n_img,
                    )

                mpc = getattr(config, "max_prompt_chars", None)
                if mpc is not None and isinstance(body.get("prompt"), str):
                    plen = len(body["prompt"])
                    if plen > mpc:
                        body["prompt"] = body["prompt"][: mpc - 3].rstrip() + "..."
                        logger.warning(
                            f"[Atlas AI] prompt усечён с {plen} до {len(body['prompt'])} символов "
                            f"(лимит модели {mpc})"
                        )

                logger.info(
                    f"[Atlas AI] Отправка запроса model='{body['model']}' "
                    f"(config_key={model}, endpoint='{config.endpoint}', task_type={task_data.task_type}, "
                    f"qc_try={qc_try+1}/{total_tries}, prompt='{current_prompt[:60]}...')"
                )

                atlas_t0 = time.perf_counter()
                post_timeout = float(self.timeout_video if config.is_video else self.timeout)
                response: Optional[httpx.Response] = None
                post_headers = self._atlas_json_headers()
                for post_try in range(self.post_max_429_retries + 1):
                    response = await self.client.post(
                        url,
                        json=body,
                        headers=post_headers,
                        timeout=post_timeout,
                    )
                    if (
                        response.status_code in _ATLAS_TRANSIENT_HTTP_STATUSES
                        and post_try < self.post_max_429_retries
                    ):
                        sleep_s = _atlas_transient_backoff_sleep_sec(
                            response,
                            default_sec=self.poll_429_default_sec,
                            min_sec=self.poll_429_sleep_min_sec,
                            max_sec=self.poll_429_sleep_max_sec,
                            jitter_ratio=self.poll_jitter_ratio,
                        )
                        logger.warning(
                            "[Atlas AI] POST %s при старте задачи, пауза %.1f с и повтор %s/%s",
                            response.status_code,
                            sleep_s,
                            post_try + 1,
                            self.post_max_429_retries,
                        )
                        await asyncio.sleep(sleep_s)
                        continue
                    break

                assert response is not None
                self._raise_for_status_with_body(response, f"POST Atlas model prediction {url}")
                response_data = response.json()

                prediction_id = response_data.get("data", {}).get("id")
                if not prediction_id:
                    raise ValueError(f"Не удалось получить prediction_id из ответа: {response_data}")

                logger.info(f"Получен prediction_id: {prediction_id}")

                # 3. Ожидание завершения задачи
                result_url = await self._wait_for_completion(
                    prediction_id,
                    is_video=config.is_video,
                )
                atlas_provider_ms = int((time.perf_counter() - atlas_t0) * 1000)
                logger.info(f"URL результата: {result_url}")

                skip_qc_clear = (task_data.edit_type or "").strip() == "clear"
                needs_qc_download = (
                    (not config.is_video)
                    and (not skip_qc_clear)
                    and qc_before_b64
                    and task_data.task_type in IMAGE_QC_TASK_TYPES
                )

                file_bytes: Optional[bytes] = None
                result_download_ms = 0
                if needs_qc_download:
                    logger.info("Скачивание результата для QC...")
                    read_sec = float(self.result_download_timeout_image_sec)
                    download_timeout = httpx.Timeout(
                        connect=45.0,
                        read=read_sec,
                        write=120.0,
                        pool=60.0,
                    )
                    dl_t0 = time.perf_counter()
                    file_response = await self.client.get(result_url, timeout=download_timeout)
                    self._raise_for_status_with_body(
                        file_response, f"GET result file {result_url[:200]}"
                    )
                    file_bytes = file_response.content
                    result_download_ms = int((time.perf_counter() - dl_t0) * 1000)
                    logger.info(
                        "[Atlas AI] Результат скачан для QC: %s байт; download_ms=%s",
                        len(file_bytes),
                        result_download_ms,
                    )

                generation_elapsed_s = (atlas_provider_ms + result_download_ms) / 1000.0
                logger.info(
                    "[Atlas AI] Генерация заняла: %.2f с "
                    "(atlas_ms=%s download_ms=%s, task_id=%s, model=%s, endpoint=%s, task_type=%s, qc_try=%s/%s, is_video=%s)",
                    generation_elapsed_s,
                    atlas_provider_ms,
                    result_download_ms,
                    task_data.task_id,
                    model,
                    config.endpoint,
                    task_data.task_type,
                    qc_try + 1,
                    total_tries,
                    config.is_video,
                )

                # 4.5 QC (только для изображений; clear возвращает маску, не сравниваем с исходником)
                qc_passed = True
                if needs_qc_download and file_bytes is not None:
                    logger.info(
                        "[QC] Проверка качества после успешной генерации Atlas "
                        "(task_id=%s, model=%s, bytes=%s)",
                        task_data.task_id,
                        model,
                        len(file_bytes),
                    )
                    qc_passed, last_qc = await self._qc_compare_images(
                        before_b64=qc_before_b64,
                        after_bytes=file_bytes,
                        task_type=task_data.task_type,
                        prompt=current_prompt,
                    )
                    logger.info(f"[QC] passed={qc_passed}, details={str(last_qc)[:300]}")

                if (not qc_passed) and (qc_try < total_tries - 1):
                    # Усиливаем запреты и пробуем ещё раз
                    tighten = (
                        "\n\nSTRICT RETRY CONSTRAINTS:\n"
                        "- Preserve ALL existing text/logos/labels/icons/infographics/QR/barcodes EXACTLY; do not warp, move, blur or redraw.\n"
                        "- If a person is present, preserve face/body identity EXACTLY; no morphing or beautification.\n"
                        "- Change ONLY what is explicitly requested; keep everything else identical.\n"
                    )
                    if task_data.task_type == TaskType.IMPROVE_QUALITY:
                        tighten += (
                            "- IMPROVE_QUALITY lock: readability-only enhancement. Do NOT rewrite/retype/translate existing text.\n"
                            "- Keep all digits/prices/units/SKU/article codes and punctuation EXACTLY unchanged.\n"
                            "- Keep infographic geometry/layout EXACTLY unchanged (no moved/resized/reordered labels, badges, icons, or blocks).\n"
                            "- Gentle face/skin deblur is OK only if it stays the same person with the same identity—no beautify or reshape.\n"
                            "- Keep tone/exposure and contrast stable: no overexposure, no lifted/faded whites, no washed-out look.\n"
                            "- Keep white background neutral and solid: no milky haze, no transparency-like whitening, no opacity shift.\n"
                        )
                    current_prompt = (prompt.strip() + tighten).strip()
                    continue

                # 5. Передаём URL результата в Kafka — скачивание и сохранение на backend
                result_data: Dict[str, Any] = {
                    "result_source_url": result_url,
                    "result_file_ext": config.file_ext,
                    "result_url_key": config.result_url_key,
                }
                merged_timings: Dict[str, int] = {"atlas_provider_ms": atlas_provider_ms}
                if result_download_ms:
                    merged_timings["result_download_ms"] = result_download_ms
                merged_timings = _merge_generation_timings(task_data, merged_timings)
                kafka_payload = self._build_kafka_success_payload(
                    task_data,
                    model,
                    result_data,
                    config,
                    body,
                    qc=last_qc if last_qc else None,
                    generation_timings=merged_timings or None,
                )

                from services.kafka_service import kafka_service
                await kafka_service.send_gpt_result(
                    kafka_payload, backend_base=task_data.resolved_backend_base()
                )

                logger.info(f"Результат отправлен в Kafka для task_id={task_data.task_id}")
                return kafka_payload

        except Exception as e:
            logger.error(
                "[Atlas AI] Ошибка генерации через модель '%s': %s",
                model,
                e,
            )

            # Универсальный fallback по ошибке (выключен по умолчанию).
            if self.error_fallback_enabled and self._is_retryable_for_model_fallback(e):
                hops_used = max(0, len(attempted) - 1)
                if hops_used < max(0, self.error_fallback_max_hops):
                    candidates = self._fallback_model_candidates(
                        current_model=model,
                        config=config,
                        attempted_models=attempted,
                    )
                    if candidates:
                        next_model = candidates[0]
                        logger.warning(
                            "[Atlas AI] Fallback enabled: retry with model '%s' after error on '%s' "
                            "(task_id=%s, hops=%s/%s, attempted=%s)",
                            next_model,
                            model,
                            task_data.task_id,
                            hops_used + 1,
                            self.error_fallback_max_hops,
                            sorted(attempted),
                        )
                        return await self.generate_with_model(
                            model=next_model,
                            prompt=prompt,
                            task_data=task_data,
                            images=images,
                            options=options,
                            end_image=end_image,
                            video=video,
                            attempted_models=attempted,
                        )

            user_err = _error_message_for_atlas_exception(e)
            raw_err = _raw_message_for_atlas_exception(e)
            error_payload = {
                **self._build_kafka_base_payload(task_data, model),
                "error": user_err,
                "error_upstream": raw_err,
            }
            err_timings = _merge_generation_timings(task_data, {})
            if err_timings:
                error_payload["generation_timings"] = err_timings
            if len(attempted) > 1:
                error_payload["attempted_models"] = sorted(attempted)
            if isinstance(e, httpx.HTTPStatusError) and e.response is not None:
                upstream_status = e.response.status_code
                error_payload["upstream_http_status"] = upstream_status
                if upstream_status == 402:
                    error_payload["error_code"] = "atlas_payment_required"
                elif upstream_status == 503:
                    error_payload["error_code"] = "atlas_service_unavailable"

            try:
                from services.kafka_service import kafka_service
                await kafka_service.send_gpt_result(
                    error_payload, backend_base=task_data.resolved_backend_base()
                )
            except Exception as err2:
                logger.error(f"Не удалось отправить ошибку в Kafka: {err2}")

            return error_payload
    
    async def _load_image_from_backend(
        self,
        user_id: str,
        image_path: str,
        *,
        backend_base: str,
    ) -> Optional[bytes]:
        """
        Загружает изображение из backend по пути
        
        Args:
            user_id: ID пользователя
            image_path: Относительный путь к изображению от storage_dir пользователя
        
        Returns:
            bytes: Данные изображения или None в случае ошибки
        """
        try:
            file_url = self._storage_file_url(backend_base, user_id, image_path)
            
            logger.debug(f"Загрузка изображения из backend: {file_url}")
            
            if not self.client:
                await self.initialize()
            
            # Загружаем файл
            response = await self.client.get(file_url, timeout=30.0)
            self._raise_for_status_with_body(response, f"GET image from backend {file_url[:200]}")
            
            return response.content
        except Exception as e:
            logger.error(f"Ошибка загрузки изображения {image_path} из backend: {e}")
            return None
    
    async def _poll_prediction_get(self, url: str, headers: Dict[str, str]) -> httpx.Response:
        if not self.poll_client:
            await self.initialize()
        if not self.poll_client:
            raise ValueError("Atlas AI poll-клиент не инициализирован")
        for n in range(_ATLAS_POLL_GET_RETRIES):
            try:
                return await self.poll_client.get(url, headers=headers, timeout=self.poll_get_timeout)
            except _ATLAS_POLL_TRANSPORT_ERRORS as e:
                if n + 1 >= _ATLAS_POLL_GET_RETRIES:
                    raise
                delay = 0.5 * (2**n)
                logger.warning("[Atlas AI] poll GET failed (%s/%s): %s; retry in %.1fs", n + 1, _ATLAS_POLL_GET_RETRIES, e, delay)
                await asyncio.sleep(delay)

    async def _wait_for_completion(self, prediction_id: str, is_video: bool = False) -> str:
        """
        Ожидает завершения обработки задачи Atlas.

        Схема опроса GET /model/prediction/{id}:
        - первый GET сразу (проверка старта / ранний failed|completed);
        - далее GET через фиксированный интервал ATLAS_POLL_INTERVAL_{IMAGE,VIDEO}_SEC.

        Лимиты: ATLAS_POLL_MAX_WAIT_{IMAGE,VIDEO}_SEC (потолок по времени, 0 = отключено),
        ATLAS_MAX_ATTEMPTS для изображений, ATLAS_MAX_ATTEMPTS_VIDEO для видео.
        Срабатывает то ограничение, которое наступает раньше.

        При is_video=True успех по статусам completed/succeeded. Возвращает URL первого элемента outputs.
        """
        get_url = f"{self.api_url}/model/prediction/{prediction_id}"
        headers = self._atlas_json_headers()

        attempt = 0
        wait_started = time.perf_counter()
        poll_max_wait_sec = self.poll_max_wait_video_sec if is_video else self.poll_max_wait_image_sec
        poll_max_attempts = self.max_attempts_video if is_video else self.max_attempts
        poll_interval_sec = self.poll_interval_video_sec if is_video else self.poll_interval_image_sec

        logger.info(
            "Ожидание завершения (видео=%s): GET сразу → опрос каждые %.1f с; "
            "лимит попыток=%s, лимит времени=%s сек",
            is_video,
            poll_interval_sec,
            poll_max_attempts,
            poll_max_wait_sec if poll_max_wait_sec > 0 else "0 (только по попыткам)",
        )

        while True:
            attempt += 1
            if attempt % 10 == 1 or logger.isEnabledFor(logging.DEBUG):
                logger.debug("Попытка %s: проверка статуса prediction_id=%s", attempt, prediction_id)

            status_response = await self._poll_prediction_get(get_url, headers)

            if not status_response.is_success:
                ctx = f"GET Atlas prediction status prediction_id={prediction_id}"
                self._log_http_error_response(status_response, ctx)
                user_msg = _extract_atlas_user_error_message(status_response)
                if user_msg:
                    raise ValueError(f"{_TASK_FAILED_ATLAS_PREFIX_RU}{user_msg}")
                status_response.raise_for_status()

            status_data = status_response.json()

            data = status_data.get("data", {})
            status = data.get("status")

            logger.debug("Статус: %s", status)

            if is_video:
                if status in ["completed", "succeeded"]:
                    logger.info("Задача выполнена успешно!")
                    outputs = data.get("outputs", [])
                    if not outputs:
                        raise ValueError("Результат не содержит файлов. Измените запрос и попробуйте снова.")
                    return outputs[0]
                if status == "failed":
                    error_msg = data.get("error", "Неизвестная ошибка")
                    if not isinstance(error_msg, str):
                        error_msg = str(error_msg)
                    raise ValueError(f"{_TASK_FAILED_ATLAS_PREFIX_RU}{error_msg}")
            else:
                if status == "completed":
                    logger.info("Задача выполнена успешно!")
                    outputs = data.get("outputs", [])
                    if not outputs:
                        raise ValueError("Результат не содержит файлов. Измените запрос и попробуйте снова.")
                    return outputs[0]
                if status == "failed":
                    error_msg = data.get("error", "Неизвестная ошибка")
                    if not isinstance(error_msg, str):
                        error_msg = str(error_msg)
                    raise ValueError(f"{_TASK_FAILED_ATLAS_PREFIX_RU}{error_msg}")

            elapsed_s = time.perf_counter() - wait_started
            if attempt > poll_max_attempts:
                raise ValueError(
                    "Превышено максимальное время ожидания результата генерации. Попробуйте позже."
                )
            if poll_max_wait_sec > 0 and elapsed_s >= float(poll_max_wait_sec):
                raise ValueError(
                    "Превышено максимальное время ожидания результата генерации. Попробуйте позже."
                )

            await asyncio.sleep(poll_interval_sec)
    
    async def edit_image(
        self,
        prompt: str,  # final_prompt - полный промпт для API
        images: Optional[List[str]],
        task_data: TaskData,
        model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Редактирование одного изображения (task_type edit_image).

        Теперь это thin-обёртка над универсальным методом generate_with_model:
        используем преднастроенную модель "luma/photon-modify".
        
        Args:
            prompt: Финальный промпт (final_prompt) для отправки в API
            images: Список путей к изображениям
            task_data: Данные задачи (task_id, user_id, thread_id, task_type, prompt - только gpt_fragment)
            model: Опциональная модель (если указана и есть в model_configs, используется вместо умолчания)
        """
        effective_model = self._resolve_model("edit", model)
        return await self.generate_with_model(
            model=effective_model,
            prompt=prompt,
            task_data=task_data,
            images=images,
            options=options,
        )

    async def generate_video_from_image(
        self,
        prompt: str,  # final_prompt - полный промпт для API
        images: Optional[List[str]],
        task_data: TaskData,
        model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        end_image: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Создание видео из изображения (task_type video_preview).

        Обёртка над generate_with_model с использованием соответствующей модели.
        
        Args:
            prompt: Финальный промпт (final_prompt) для отправки в API
            images: Список путей к изображениям
            task_data: Данные задачи (task_id, user_id, thread_id, task_type, prompt - только gpt_fragment)
            model: Опциональная модель (если указана и есть в model_configs, используется вместо умолчания)
        """
        effective_model = self._resolve_model("video", model)
        return await self.generate_with_model(
            model=effective_model,
            prompt=prompt,
            task_data=task_data,
            images=images,
            options=options,
            end_image=end_image,
        )

    async def generate_reference_video(
        self,
        prompt: str,
        images: Optional[List[str]],
        task_data: TaskData,
        model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Генерация видео по референс-изображениям (task_type reference_video).

        Обёртка над generate_with_model; модели reference-to-video (images / reference_images).
        """
        effective_model = self._resolve_model("reference_video", model)
        return await self.generate_with_model(
            model=effective_model,
            prompt=prompt,
            task_data=task_data,
            images=images,
            options=options,
            end_image=None,
        )

    async def generate_video_from_video(
        self,
        prompt: str,
        video: Optional[str],
        images: Optional[List[str]],
        task_data: TaskData,
        model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Редактирование видео (task_type video_video): исходный ролик + опциональные ref images.
        """
        effective_model = self._resolve_model("video_video", model)
        return await self.generate_with_model(
            model=effective_model,
            prompt=prompt,
            task_data=task_data,
            images=images,
            options=options,
            end_image=None,
            video=video,
        )

    def build_improve_quality_skip_gpt_fragment(self, user_message: str) -> str:
        """
        Детерминированный preserve-only EditSpec JSON для improve_quality при skip_gpt.
        Цель: мягко снять размытость/шум при жёстком сохранении текста и инфографики.
        """
        from atlas_spec_constants import EDIT_SPEC_VERSION, _DEFAULT_MUST_PRESERVE

        msg = (user_message or "").strip()

        summary = (
            "Gentle denoise and local clarity (faces/subjects) with identity lock; "
            "all text/infographics unchanged."
        )
        if msg:
            summary = f"{summary} Note: {msg[:120]}{'...' if len(msg) > 120 else ''}"

        primary_action = (
            "Gently reduce blur and noise on faces and main subjects while keeping the same identity; "
            "do not touch letterforms, layout, or numeric text; no new or removed elements."
        )

        spec: Dict[str, Any] = {
            "version": EDIT_SPEC_VERSION,
            "task": "improve_image_quality",
            "must_preserve": list(_DEFAULT_MUST_PRESERVE),
            "request_summary": summary,
            "actions": [primary_action],
            "quality": {"level": "standard"},
            "notes": "Preserve-only; no edits to content.",
        }
        return json.dumps(spec, ensure_ascii=False)

    async def improve_image_quality(
        self,
        prompt: str,  # final_prompt - полный промпт для API
        images: Optional[List[str]],
        task_data: TaskData,
        model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Улучшение качества одного изображения (task_type=7).

        Обёртка над generate_with_model с использованием соответствующей модели.
        
        Args:
            model: Опциональная модель (если указана и есть в model_configs, используется вместо умолчания)
        """
        effective_model = self._resolve_model("improve", model)
        api_options: Dict[str, Any] = dict(options) if options else {}
        api_options.pop("x_dpi", None)  # legacy clients / Kafka payloads

        is_qwen_edit = bool(effective_model and "qwen-image" in effective_model)
        is_nano_banana = bool(effective_model and "nano-banana" in effective_model)
        if is_qwen_edit:
            # Схема qwen-image/edit-plus не содержит output_format — не отправляем лишнее.
            api_options.pop("output_format", None)
            np = api_options.get("negative_prompt")
            if isinstance(np, str) and len(np) > 500:
                api_options["negative_prompt"] = np[:497] + "..."
        elif is_nano_banana:
            api_options.pop("negative_prompt", None)
            api_options.pop("prompt_extend", None)
            api_options.pop("num_images", None)
            api_options.pop("seed", None)
        else:
            api_options.setdefault("output_format", "png")

        atlas_prompt = prompt
        if is_qwen_edit and len(atlas_prompt) > 800:
            atlas_prompt = atlas_prompt[:797].rstrip() + "..."
            logger.warning("improve_image_quality: prompt truncated to 800 chars (Qwen edit-plus limit)")

        return await self.generate_with_model(
            model=effective_model,
            prompt=atlas_prompt,
            task_data=task_data,
            images=images,
            options=api_options if api_options else None,
        )


# Глобальный экземпляр
atlasai_service = AtlasAIService()
