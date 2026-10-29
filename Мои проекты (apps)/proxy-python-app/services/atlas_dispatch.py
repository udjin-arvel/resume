"""
Вызов Atlas по task_type после того, как backend сформировал final_prompt (Kafka atlas_ready).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from services.atlasai_service import TaskData, atlasai_service
from task_types import TaskType, effective_task_type_for_dispatch

logger = logging.getLogger(__name__)


def task_data_from_kafka(
    message: Dict[str, Any],
    *,
    gpt_fragment: str,
    resolved_backend_base: str,
) -> TaskData:
    """
    TaskData: prompt = gpt_fragment (EditSpec JSON); final_prompt — для API Atlas в методах.
    resolved_backend_base — тот же результат, что и resolve_backend_api_base_for_request для этого
    сообщения (из Kafka + HMAC при наличии, иначе нормализованный default с proxy), не сырой message.
    """
    return TaskData(
        task_id=str(message.get("task_id", "")),
        user_id=str(message.get("user_id", "")),
        thread_id=str(message.get("thread_id", "") or ""),
        task_type=str(message.get("task_type", "")),
        prompt=gpt_fragment,
        generation_id=(
            str(int(message.get("generation_id")))
            if message.get("generation_id") is not None and str(message.get("generation_id")).strip() != ""
            else None
        ),
        improve_prompt=message.get("improve_prompt", True),
        backend_api_base=resolved_backend_base,
        generation_timings=message.get("generation_timings")
        if isinstance(message.get("generation_timings"), dict)
        else None,
        edit_type=str(message.get("edit_type") or "").strip() or None,
    )


async def dispatch_to_atlas(
    task_type: str,
    final_prompt: str,
    task_data: TaskData,
    images: Optional[List[str]],
    options: Optional[Dict[str, Any]],
    end_image: Optional[str],
    ai_model: Optional[str],
    video: Optional[str] = None,
) -> None:
    """Вызов Atlas по task_type (как ex-openai_service._dispatch_to_atlas)."""
    fp = final_prompt.strip()

    effective = effective_task_type_for_dispatch(task_type, images, video)
    if effective != task_type:
        n_imgs = len([x for x in (images or []) if isinstance(x, str) and x.strip()])
        logger.info(
            "Atlas dispatch: task_type %s -> %s (n_images=%s)",
            task_type,
            effective,
            n_imgs,
        )
        task_type = effective

    if task_type == TaskType.TEXT_VIDEO:
        effective_model = atlasai_service._resolve_model("text_video", ai_model)
        await atlasai_service.generate_with_model(
            model=effective_model,
            prompt=fp,
            task_data=task_data,
            images=None,
            options=options,
            end_image=None,
        )
        return
    if task_type == TaskType.TEXT_IMAGE:
        effective_model = atlasai_service._resolve_model("text_image", ai_model)
        await atlasai_service.generate_with_model(
            model=effective_model,
            prompt=fp,
            task_data=task_data,
            images=None,
            options=options,
        )
        return
    if task_type == TaskType.VIDEO_PREVIEW:
        await atlasai_service.generate_video_from_image(
            prompt=fp,
            images=images,
            task_data=task_data,
            model=ai_model,
            options=options,
            end_image=end_image,
        )
        return
    if task_type == TaskType.REFERENCE_VIDEO:
        await atlasai_service.generate_reference_video(
            prompt=fp,
            images=images,
            task_data=task_data,
            model=ai_model,
            options=options,
        )
        return
    if task_type == TaskType.VIDEO_VIDEO:
        await atlasai_service.generate_video_from_video(
            prompt=fp,
            video=video,
            images=images,
            task_data=task_data,
            model=ai_model,
            options=options,
        )
        return
    if task_type == TaskType.IMPROVE_QUALITY:
        await atlasai_service.improve_image_quality(
            prompt=fp,
            images=images,
            task_data=task_data,
            model=ai_model,
            options=options,
        )
        return
    if task_type == TaskType.EDIT_IMAGE:
        await atlasai_service.edit_image(
            prompt=fp,
            images=images,
            task_data=task_data,
            model=ai_model,
            options=options,
        )
        return
    logger.warning("Неизвестный task_type для Atlas: %s", task_type)
