"""
Очередь prompt_jobs на proxy: OpenAI Assistants → Kafka topic requests (atlas_ready).
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from config import settings
from services.backend_proxy_hmac import (
    get_secret_from_env,
    normalize_backend_api_base,
    resolve_backend_api_base_for_request,
    sign_backend_request_hmac,
)
from services.openai_config import get_openai_settings
from services.openai_service import openai_service
from task_types import TaskType, normalize_task_type

logger = logging.getLogger(__name__)


def _coerce_generation_id(raw: Any) -> Optional[str]:
    if raw is None or str(raw).strip() == "":
        return None
    try:
        return str(int(raw))
    except (TypeError, ValueError):
        return None


def _resolved_backend_base(data: Dict[str, Any]) -> str:
    """Проверенный HMAC backend_api_base из сообщения или BACKEND_URL при legacy."""
    return resolve_backend_api_base_for_request(
        data,
        default_backend_url=settings.BACKEND_URL,
        hmac_secret=settings.BACKEND_PROXY_HMAC_SECRET,
        allow_legacy_unsigned=settings.BACKEND_PROXY_ALLOW_LEGACY_UNSIGNED,
    )


def _fallback_backend_base_for_errors() -> str:
    """Только для уведомлений об ошибке, если resolve не прошёл."""
    return normalize_backend_api_base(settings.BACKEND_URL)


def _iso_now() -> str:
    return datetime.now().isoformat()


async def run_proxy_prompt_job(data: Dict[str, Any]) -> None:
    """generate_prompt → producer в topic requests (atlas_ready) или results (ошибка)."""
    oa = get_openai_settings()
    if not oa.api_key and not oa.mock_openai:
        logger.error("OPENAI_API_KEY пуст; prompt job пропущен (task_id=%s)", data.get("task_id"))
        from services.kafka_service import kafka_service

        err = {
            "task_id": str(data.get("task_id", "")),
            "user_id": str(data.get("user_id", "")),
            "thread_id": str(data.get("thread_id", "") or ""),
            "prompt": data.get("message", "") or "",
            "error": "OpenAI не настроен (OPENAI_API_KEY)",
        }
        eg = _coerce_generation_id(data.get("generation_id"))
        if eg is not None:
            err["generation_id"] = int(eg)
        try:
            base = _resolved_backend_base(data)
        except ValueError as e:
            logger.warning("prompt_jobs: resolve backend base (OpenAI off): %s", e)
            base = _fallback_backend_base_for_errors()
        await kafka_service.send_gpt_result(err, backend_base=base)
        return

    try:
        await _run_proxy_prompt_impl(data)
    except Exception as e:
        logger.exception("run_proxy_prompt_job: %s", e)
        from services.kafka_service import kafka_service

        err = {
            "task_id": str(data.get("task_id", "")),
            "user_id": str(data.get("user_id", "")),
            "thread_id": str(data.get("thread_id", "") or ""),
            "prompt": data.get("message", "") or "",
            "error": str(e),
        }
        eg = _coerce_generation_id(data.get("generation_id"))
        if eg is not None:
            err["generation_id"] = int(eg)
        try:
            base = _resolved_backend_base(data)
        except ValueError:
            logger.warning(
                "prompt_jobs: resolve backend base failed for error notify; using BACKEND_URL fallback"
            )
            base = _fallback_backend_base_for_errors()
        await kafka_service.send_gpt_result(err, backend_base=base, notify_backend_error=True)


async def _run_proxy_prompt_impl(data: Dict[str, Any]) -> None:
    from services.kafka_service import kafka_service

    task_id = str(data["task_id"])
    user_id = str(data["user_id"])
    thread_id = str(data.get("thread_id") or "") or None
    user_message = data.get("message", "") or ""
    task_type = normalize_task_type(data.get("task_type", TaskType.EDIT_IMAGE))
    images = data.get("images", [])
    is_edit = bool(data.get("is_edit", False))
    ai_model = data.get("ai_model", None)
    options = data.get("options")
    improve_prompt = data.get("improve_prompt", True)
    end_image = data.get("end_image")
    generation_id = _coerce_generation_id(data.get("generation_id"))
    skip_gpt = bool(data.get("skip_gpt", False))
    if isinstance(skip_gpt, str):
        skip_gpt = skip_gpt.lower() in ("1", "true", "yes")
    if task_type != TaskType.IMPROVE_QUALITY:
        skip_gpt = False

    backend_api_base = _resolved_backend_base(data)

    r = await openai_service.generate_prompt(
        task_id=task_id,
        user_id=user_id,
        message=user_message,
        task_type=task_type,
        images=images,
        is_edit=is_edit,
        thread_id=thread_id,
        ai_model=ai_model,
        options=options,
        improve_prompt=improve_prompt,
        end_image=end_image,
        generation_id=generation_id,
        skip_gpt=skip_gpt,
        backend_api_base=backend_api_base,
        gpt_instructions=data.get("gpt_instructions"),
    )

    gpt_fragment = (r.get("gpt_fragment") or r.get("prompt") or user_message) or ""
    final_prompt = (r.get("prompt") or user_message) or ""
    out_thread = str(r.get("thread_id") or thread_id or "")

    merged_options = r.get("options", None)
    if merged_options is None:
        merged_options = options

    payload: Dict[str, Any] = {
        "user_id": data["user_id"],
        # "telegram_id": data["telegram_id"], #TODO: add telegram_id support later
        "thread_id": out_thread,
        "task_id": data["task_id"],
        "generation_id": data["generation_id"],
        "message": user_message,
        "task_type": task_type,
        "images": images,
        "ai_model": data.get("ai_model", None),
        "improve_prompt": improve_prompt,
        "options": merged_options,
        "timestamp": data.get("timestamp") or _iso_now(),
        "prompt": final_prompt.strip(),
        "gpt_fragment": gpt_fragment.strip() if gpt_fragment else "",
        "atlas_ready": True,
    }
    if data.get("is_edit") is not None:
        payload["is_edit"] = bool(data["is_edit"])
    if data.get("end_image"):
        payload["end_image"] = data["end_image"]
    if data.get("video"):
        payload["video"] = data["video"]
    if data.get("skip_gpt"):
        payload["skip_gpt"] = True
    elif task_type == TaskType.IMPROVE_QUALITY and not bool(
        improve_prompt if improve_prompt is not None else True
    ):
        payload["skip_gpt"] = True

    gpt_ms_raw = r.get("gpt_ms")
    timings: Dict[str, Any] = {}
    if gpt_ms_raw is not None:
        try:
            timings["gpt_ms"] = int(round(float(gpt_ms_raw)))
        except (TypeError, ValueError):
            pass
    if timings:
        payload["generation_timings"] = timings

    secret = get_secret_from_env()
    if secret:
        norm_base = normalize_backend_api_base(backend_api_base)
        payload["backend_api_base"] = norm_base
        payload["backend_request_hmac"] = sign_backend_request_hmac(
            norm_base,
            data["task_id"],
            data["user_id"],
            data["generation_id"],
            secret,
        )

    await kafka_service.send_atlas_ready_to_requests(payload, key=str(data["user_id"]))
