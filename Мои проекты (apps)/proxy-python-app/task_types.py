"""
Строковые коды типа задачи (Kafka → proxy).

Значения TaskType и ALL_TASK_TYPES должны совпадать с radar-art__backend/app/task_types.py.
В proxy только строки: числовые task_type из старого Kafka не поддерживаются.
"""
from __future__ import annotations

import logging
from enum import StrEnum
from typing import FrozenSet, List, Optional

logger = logging.getLogger(__name__)


class TaskType(StrEnum):
    EDIT_IMAGE = "edit_image"
    VIDEO_PREVIEW = "video_preview"
    VIDEO_VIDEO = "video_video"
    REFERENCE_VIDEO = "reference_video"
    IMPROVE_QUALITY = "improve_quality"
    TEXT_IMAGE = "text_image"
    TEXT_VIDEO = "text_video"
    CHAT = "chat"


ALL_TASK_TYPES: FrozenSet[str] = frozenset(m.value for m in TaskType)

PROMPT_SPEC_TASK_TYPES: FrozenSet[str] = frozenset(
    {
        TaskType.EDIT_IMAGE,
        TaskType.VIDEO_PREVIEW,
        TaskType.VIDEO_VIDEO,
        TaskType.REFERENCE_VIDEO,
        TaskType.IMPROVE_QUALITY,
        TaskType.TEXT_IMAGE,
        TaskType.TEXT_VIDEO,
    }
)

# Синхронно с backend/app/task_types.py — improve_prompt=False: шаблонный EditSpec для prompt_service.build_simple_mode_spec
DETERMINISTIC_EDIT_SPEC_TASK_TYPES: FrozenSet[str] = frozenset(
    {
        TaskType.EDIT_IMAGE,
        TaskType.VIDEO_PREVIEW,
        TaskType.VIDEO_VIDEO,
        TaskType.REFERENCE_VIDEO,
        TaskType.TEXT_IMAGE,
        TaskType.TEXT_VIDEO,
    }
)

IMAGE_QC_TASK_TYPES: FrozenSet[str] = frozenset(
    {
        TaskType.EDIT_IMAGE,
        TaskType.IMPROVE_QUALITY,
    }
)


def effective_task_type_for_dispatch(
    task_type: str,
    images: Optional[List[str]],
    video: Optional[str],
) -> str:
    """
    Маршрутизация Atlas по фактическим входам (sync with backend resolve_content_factory_effective_task_type).
    """
    imgs = [x for x in (images or []) if isinstance(x, str) and x.strip()]
    if task_type == TaskType.TEXT_IMAGE and imgs:
        return TaskType.EDIT_IMAGE
    if task_type == TaskType.TEXT_VIDEO and imgs and not (video and str(video).strip()):
        return TaskType.VIDEO_PREVIEW
    return task_type


def normalize_task_type(raw: object, *, fallback: str = TaskType.EDIT_IMAGE) -> str:
    """Принимает только канонические строки (или TaskType). Иначе — fallback и предупреждение в лог."""
    if isinstance(raw, TaskType):
        return raw.value
    if isinstance(raw, str):
        s = raw.strip()
        if s in ALL_TASK_TYPES:
            return s
        logger.warning("task_type: неизвестная строка %r, подставляем %r", raw, fallback)
        return fallback
    if raw is not None and raw != "":
        logger.warning("task_type: ожидалась строка, получено %r, подставляем %r", raw, fallback)
    return fallback
