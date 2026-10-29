"""
Конфигурация моделей Atlas AI (fallback, если не удалось загрузить с backend).

Основной источник — GET {BACKEND}/api/config/models (legacy: …/ai_models), объединённый при старте:
записи с backend переопределяют локальные; id только здесь сохраняются при «урезанном» ответе prod.
"""
from dataclasses import dataclass
from typing import Dict, Any, List, Optional


_NANO_BANANA_2_ALLOWED_BODY_KEYS = [
    "prompt",
    "images",
    "aspect_ratio",
    "resolution",
    "output_format",
    "media_resolution",
    "enable_web_search",
    "enable_image_search",
]
_NANO_BANANA_2_VALUE_NORMALIZERS = {
    "aspect_ratio": "strip",
    "resolution": "lower",
    "output_format": "map_jpeg",
    "media_resolution": "lower",
}
_NANO_BANANA_PRO_ALLOWED_BODY_KEYS = [
    "prompt",
    "images",
    "aspect_ratio",
    "resolution",
    "output_format",
    "media_resolution",
    "enable_web_search",
]

_GPT_IMAGE_2_ALLOWED_BODY_KEYS = ["prompt", "size", "quality", "output_format"]
_GPT_IMAGE_2_VALUE_NORMALIZERS = {
    "quality": "lower",
    "output_format": "map_jpeg",
}
_GPT_IMAGE_2_EDIT_ALLOWED_BODY_KEYS = [
    "prompt",
    "images",
    "size",
    "quality",
    "output_format",
]
_GPT_IMAGE_2_EDIT_VALUE_NORMALIZERS = {
    "quality": "lower",
    "output_format": "map_jpeg",
}
_NANO_BANANA_2_TEXT_TO_IMAGE_ALLOWED_BODY_KEYS = [
    "prompt",
    "aspect_ratio",
    "resolution",
    "output_format",
    "media_resolution",
    "enable_web_search",
    "enable_image_search",
]
_VEO_LITE_T2V_ALLOWED_BODY_KEYS = [
    "prompt",
    "aspect_ratio",
    "duration",
    "resolution",
    "seed",
]


@dataclass
class AtlasModelConfig:
    """
    Описание схемы вызова Atlas AI для конкретной модели.

    Это наш «фабричный» слой: по имени модели понимаем:
    - какой endpoint вызывать (generateImage / generateVideo);
    - какой тип входа нужен (одна картинка, список картинок или none — только текст);
    - является ли результат видео;
    - какие дополнительные параметры нужно пробросить в body;
    - с каким расширением сохранять файл и под каким ключом отдавать URL в Kafka.
    """
    endpoint: str  # "generateImage" | "generateVideo"
    input_type: str  # "image" | "images" | "reference_images" | "none"
    # Имя поля для массива входных изображений в теле Atlas (для input_type=images/reference_images).
    # Если не задано, выбирается по input_type: images или reference_images.
    images_field: Optional[str] = None  # "images" | "reference_images"
    is_video: bool = False
    is_link_needed: bool = False
    extra_params: Dict[str, Any] = None
    file_ext: str = "png"
    result_url_key: str = "image_url"  # "image_url" | "video_url"
    tokens_per_request: Optional[int] = None  # для backend, proxy не использует
    last_frame_param: Optional[str] = None  # имя поля в теле Atlas: last_image | end_image
    # Лимит длины поля prompt в API (символов); None = без усечения на стороне proxy.
    max_prompt_chars: Optional[int] = None
    # Whitelist полей тела POST к Atlas; None = не prune-ить.
    allowed_body_keys: Optional[List[str]] = None
    # Поле → имя стратегии нормализации (strip, lower, map_jpeg).
    value_normalizers: Optional[Dict[str, str]] = None
    # Имя поля соотношения сторон в теле Atlas (aspect_ratio | ratio); "" — поля нет в схеме.
    ratio_param: Optional[str] = None

    def __post_init__(self):
        if self.extra_params is None:
            self.extra_params = {}


def normalize_merged_ratio_fields(config: AtlasModelConfig, merged: Dict[str, Any]) -> None:
    """
    Приводит aspect_ratio / ratio к одному ключу по ratio_param модели.
    Backend и Content Factory всегда шлют каноническое имя aspect_ratio в options.
    """
    rp = getattr(config, "ratio_param", None)
    if rp is None:
        target: Optional[str] = "aspect_ratio"
    else:
        s = str(rp).strip()
        target = None if s == "" else s

    ar = merged.pop("aspect_ratio", None)
    ratio = merged.pop("ratio", None)

    if ar not in (None, ""):
        val = ar
    elif ratio not in (None, ""):
        val = ratio
    else:
        val = None

    if target is None:
        return
    if val is not None:
        merged[target] = val


# Fallback: те же ключи, что в radar-art__backend/app/atlas_model_configs.py
ATLAS_MODEL_CONFIGS: Dict[str, AtlasModelConfig] = {
    "alibaba/qwen-image/edit-plus": AtlasModelConfig(
        endpoint="generateImage",
        input_type="images",
        is_video=False,
        file_ext="png",
        result_url_key="image_url",
    ),
    "bytedance/seedream-v5.0-lite/edit": AtlasModelConfig(
        endpoint="generateImage",
        input_type="images",
        is_video=False,
        file_ext="png",
        result_url_key="image_url",
    ),
    "bytedance/seedream-v4.5/edit": AtlasModelConfig(
        endpoint="generateImage",
        input_type="images",
        is_video=False,
        file_ext="png",
        result_url_key="image_url",
    ),
    "google/nano-banana-2/edit": AtlasModelConfig(
        endpoint="generateImage",
        input_type="images",
        is_video=False,
        file_ext="png",
        result_url_key="image_url",
        allowed_body_keys=list(_NANO_BANANA_2_ALLOWED_BODY_KEYS),
        value_normalizers=dict(_NANO_BANANA_2_VALUE_NORMALIZERS),
    ),
    "google/nano-banana-pro/edit": AtlasModelConfig(
        endpoint="generateImage",
        input_type="images",
        is_video=False,
        file_ext="png",
        result_url_key="image_url",
        allowed_body_keys=list(_NANO_BANANA_PRO_ALLOWED_BODY_KEYS),
        value_normalizers=dict(_NANO_BANANA_2_VALUE_NORMALIZERS),
    ),
    "google/nano-banana-2/edit#improve_quality": AtlasModelConfig(
        endpoint="generateImage",
        input_type="images",
        is_video=False,
        file_ext="png",
        result_url_key="image_url",
        allowed_body_keys=list(_NANO_BANANA_2_ALLOWED_BODY_KEYS),
        value_normalizers=dict(_NANO_BANANA_2_VALUE_NORMALIZERS),
    ),
    "openai/gpt-image-2/edit": AtlasModelConfig(
        endpoint="generateImage",
        input_type="images",
        is_video=False,
        file_ext="png",
        result_url_key="image_url",
        allowed_body_keys=list(_GPT_IMAGE_2_EDIT_ALLOWED_BODY_KEYS),
        value_normalizers=dict(_GPT_IMAGE_2_EDIT_VALUE_NORMALIZERS),
    ),
    "google/veo3.1/image-to-video": AtlasModelConfig(
        endpoint="generateVideo",
        input_type="image",
        is_video=True,
        is_link_needed=True,
        file_ext="mp4",
        result_url_key="video_url",
        extra_params={
            "duration": 4,
            "generate_audio": False,
            "resolution": "1080p",
            "seed": 1,
            "negative_prompt": (
                "blurry, distorted, fast movements, jerky motion, unnatural animation, "
                "extreme movements, cartoon style, stylized animation"
            ),
        },
        last_frame_param="last_image",
    ),
    "google/veo3.1-lite/image-to-video": AtlasModelConfig(
        endpoint="generateVideo",
        input_type="image",
        is_video=True,
        is_link_needed=True,
        file_ext="mp4",
        result_url_key="video_url",
        extra_params={
            "aspect_ratio": "16:9",
            "duration": 8,
            "resolution": "720p",
            "seed": 1,
        },
    ),
    "kwaivgi/kling-v3.0-pro/image-to-video": AtlasModelConfig(
        endpoint="generateVideo",
        input_type="image",
        is_video=True,
        is_link_needed=False,
        file_ext="mp4",
        result_url_key="video_url",
        extra_params={
            "cfg_scale": 0.5,
            "duration": 5,
            "sound": False,
            "negative_prompt": (
                "blurry, distorted, fast movements, jerky motion, unnatural animation, "
                "extreme movements, cartoon style, stylized animation"
            ),
        },
        last_frame_param="end_image",
        max_prompt_chars=2500,
    ),
    "kwaivgi/kling-v3.0-std/image-to-video": AtlasModelConfig(
        endpoint="generateVideo",
        input_type="image",
        is_video=True,
        is_link_needed=False,
        file_ext="mp4",
        result_url_key="video_url",
        extra_params={
            "cfg_scale": 0.5,
            "duration": 5,
            "sound": False,
            "negative_prompt": (
                "blurry, distorted, fast movements, jerky motion, unnatural animation, "
                "extreme movements, cartoon style, stylized animation"
            ),
        },
        last_frame_param="end_image",
        max_prompt_chars=2500,
    ),
    "google/veo3.1/reference-to-video": AtlasModelConfig(
        endpoint="generateVideo",
        input_type="images",
        images_field="reference_images",
        is_video=True,
        is_link_needed=True,
        file_ext="mp4",
        result_url_key="video_url",
        extra_params={
            "duration": 4,
            "generate_audio": False,
            "resolution": "1080p",
            "negative_prompt": (
                "blurry, distorted, fast movements, jerky motion, unnatural animation, "
                "extreme movements, cartoon style, stylized animation"
            ),
        },
    ),
    "kwaivgi/kling-video-o3-pro/reference-to-video": AtlasModelConfig(
        endpoint="generateVideo",
        input_type="images",
        is_video=True,
        is_link_needed=False,
        file_ext="mp4",
        result_url_key="video_url",
        extra_params={
            "duration": 5,
            "sound": False,
            "aspect_ratio": "16:9",
            "negative_prompt": (
                "blurry, distorted, fast movements, jerky motion, unnatural animation, "
                "extreme movements, cartoon style, stylized animation"
            ),
        },
        max_prompt_chars=2500,
    ),
    "kwaivgi/kling-video-o3-std/video-edit": AtlasModelConfig(
        endpoint="generateVideo",
        input_type="video_images",
        is_video=True,
        is_link_needed=True,
        file_ext="mp4",
        result_url_key="video_url",
        extra_params={
            "keep_original_sound": True,
            "negative_prompt": (
                "blurry, distorted, fast movements, jerky motion, unnatural animation, "
                "extreme movements, cartoon style, stylized animation"
            ),
        },
        max_prompt_chars=2500,
    ),
    "kwaivgi/kling-video-o3-pro/video-edit": AtlasModelConfig(
        endpoint="generateVideo",
        input_type="video_images",
        is_video=True,
        is_link_needed=True,
        file_ext="mp4",
        result_url_key="video_url",
        extra_params={
            "keep_original_sound": True,
            "negative_prompt": (
                "blurry, distorted, fast movements, jerky motion, unnatural animation, "
                "extreme movements, cartoon style, stylized animation"
            ),
        },
        max_prompt_chars=2500,
    ),
    "bytedance/seedance-2.0/reference-to-video": AtlasModelConfig(
        endpoint="generateVideo",
        input_type="reference_images",
        is_video=True,
        is_link_needed=True,
        file_ext="mp4",
        result_url_key="video_url",
        ratio_param="ratio",
        extra_params={
            "duration": 5,
            "resolution": "720p",
            "ratio": "adaptive",
            "generate_audio": True,
            "negative_prompt": (
                "blurry, distorted, fast movements, jerky motion, unnatural animation, "
                "extreme movements, cartoon style, stylized animation"
            ),
        },
    ),
    "openai/gpt-image-2/text-to-image": AtlasModelConfig(
        endpoint="generateImage",
        input_type="none",
        is_video=False,
        file_ext="png",
        result_url_key="image_url",
        allowed_body_keys=list(_GPT_IMAGE_2_ALLOWED_BODY_KEYS),
        value_normalizers=dict(_GPT_IMAGE_2_VALUE_NORMALIZERS),
    ),
    "google/nano-banana-2/text-to-image": AtlasModelConfig(
        endpoint="generateImage",
        input_type="none",
        is_video=False,
        file_ext="png",
        result_url_key="image_url",
        allowed_body_keys=list(_NANO_BANANA_2_TEXT_TO_IMAGE_ALLOWED_BODY_KEYS),
        value_normalizers=dict(_NANO_BANANA_2_VALUE_NORMALIZERS),
    ),
    "google/veo3.1-lite/text-to-video": AtlasModelConfig(
        endpoint="generateVideo",
        input_type="none",
        is_video=True,
        is_link_needed=False,
        file_ext="mp4",
        result_url_key="video_url",
        extra_params={
            "aspect_ratio": "16:9",
            "duration": 8,
            "resolution": "720p",
            "seed": -1,
        },
        max_prompt_chars=2500,
        allowed_body_keys=list(_VEO_LITE_T2V_ALLOWED_BODY_KEYS),
    ),
}


def improve_options_include_default_negative_prompt(ai_model: Optional[str]) -> bool:
    """Синхронно с radar-art__backend app/services/atlas_model_configs (dict-версия)."""
    if not ai_model or ai_model not in ATLAS_MODEL_CONFIGS:
        return True
    cfg = ATLAS_MODEL_CONFIGS[ai_model]
    return bool(getattr(cfg, "improve_options_include_negative_prompt", True))


def improve_options_merge_qwen_style_defaults(ai_model: Optional[str]) -> bool:
    if not ai_model:
        return True
    if ai_model not in ATLAS_MODEL_CONFIGS:
        return False
    cfg = ATLAS_MODEL_CONFIGS[ai_model]
    return bool(getattr(cfg, "improve_options_merge_qwen_style_defaults", False))
