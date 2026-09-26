"""
Проверка HMAC для backend_api_base в сообщениях Kafka (requests, prompt_jobs).
Должен совпадать с radar-art__backend/app/services/backend_proxy_hmac.py
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import os
from posixpath import normpath
from typing import Any, Dict, Tuple
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def normalize_backend_api_base(url: str) -> str:
    """
    Базовый URL API для proxy: origin + опциональный path-префикс (например /api за reverse proxy).
    Host в нижнем регистре; явный порт (кроме 80/443); path без завершающего слэша; query/fragment игнорируются.
    """
    raw = (url or "").strip()
    if not raw:
        raise ValueError("backend_api_base пустой")
    if "://" not in raw:
        raw = f"http://{raw}"
    p = urlparse(raw)
    if p.scheme.lower() not in ("http", "https"):
        raise ValueError("backend_api_base: допустимы только http/https")
    host = p.hostname
    if not host:
        raise ValueError("backend_api_base: нет хоста")
    scheme = p.scheme.lower()
    port = p.port
    if port is None:
        netloc = host.lower()
    else:
        if (scheme == "http" and port == 80) or (scheme == "https" and port == 443):
            netloc = host.lower()
        else:
            netloc = f"{host.lower()}:{port}"
    origin = f"{scheme}://{netloc}"
    path = p.path or ""
    if path in ("", "/"):
        return origin
    normalized = normpath(path)
    if normalized.startswith("..") or "/../" in normalized or normalized.endswith("/.."):
        raise ValueError("backend_api_base: недопустимый path")
    if not normalized.startswith("/"):
        normalized = "/" + normalized
    normalized = normalized.rstrip("/")
    if not normalized:
        return origin
    return f"{origin}{normalized}"


def build_hmac_signing_message_v1(
    backend_api_base: str,
    task_id: Any,
    user_id: Any,
    generation_id: Any,
) -> str:
    norm = normalize_backend_api_base(backend_api_base)
    gid = "" if generation_id is None else str(generation_id).strip()
    return (
        "v1\n"
        f"{norm}\n"
        f"{task_id}\n"
        f"{user_id}\n"
        f"{gid}"
    )


def sign_backend_request_hmac(
    backend_api_base: str,
    task_id: Any,
    user_id: Any,
    generation_id: Any,
    secret: str,
) -> str:
    msg = build_hmac_signing_message_v1(
        backend_api_base, task_id, user_id, generation_id
    )
    key = secret.encode("utf-8")
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).hexdigest()


def get_secret_from_env() -> str:
    return (os.getenv("BACKEND_PROXY_HMAC_SECRET") or "").strip()


def verify_backend_request_hmac(
    message: Dict[str, Any],
    secret: str,
) -> Tuple[bool, str]:
    """
    Проверяет HMAC для пары backend_api_base + backend_request_hmac.
    Возвращает (ok, normalized_base или пустая строка при ошибке).
    """
    raw_base = message.get("backend_api_base")
    sig = message.get("backend_request_hmac")
    if raw_base is None and sig is None:
        return False, ""
    if raw_base is None or sig is None:
        return False, ""
    if not isinstance(sig, str) or not sig.strip():
        return False, ""
    try:
        norm = normalize_backend_api_base(str(raw_base))
    except ValueError as e:
        logger.warning("normalize backend_api_base: %s", e)
        return False, ""
    expected = hmac.new(
        secret.encode("utf-8"),
        build_hmac_signing_message_v1(
            str(raw_base),
            message.get("task_id"),
            message.get("user_id"),
            message.get("generation_id"),
        ).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, sig.strip()):
        return False, ""
    return True, norm


def resolve_backend_api_base_for_request(
    message: Dict[str, Any],
    *,
    default_backend_url: str,
    hmac_secret: str,
    allow_legacy_unsigned: bool,
) -> str:
    """
    Возвращает нормализованный базовый URL API backend (origin + опциональный path, например /api).

    Порядок: (1) пара backend_api_base + backend_request_hmac в сообщении (подпись проверяется) —
    используется значение из Kafka; (2) иначе при allow_legacy_unsigned — default_backend_url
    (как правило settings.BACKEND_URL на proxy), с normalize_backend_api_base.
    """
    secret = (hmac_secret or "").strip()
    raw_base = message.get("backend_api_base")
    sig = message.get("backend_request_hmac")

    if raw_base is not None or sig is not None:
        if raw_base is None or sig is None:
            raise ValueError(
                "backend_api_base и backend_request_hmac должны быть оба заданы или оба отсутствовать"
            )
        if not secret:
            raise ValueError(
                "В сообщении указан backend_api_base/HMAC, но на proxy не задан BACKEND_PROXY_HMAC_SECRET"
            )
        ok, norm = verify_backend_request_hmac(message, secret)
        if not ok:
            raise ValueError("Неверная подпись backend_request_hmac или некорректный backend_api_base")
        return norm

    if allow_legacy_unsigned:
        return normalize_backend_api_base(default_backend_url)

    raise ValueError(
        "Сообщение без подписанного backend_api_base; включите BACKEND_PROXY_ALLOW_LEGACY_UNSIGNED "
        "или передавайте HMAC с backend"
    )
