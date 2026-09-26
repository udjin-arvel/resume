"""Нормализация aspect_ratio → ratio (и обратно) по ratio_param модели."""
from atlas_model_configs import AtlasModelConfig, normalize_merged_ratio_fields


def test_seedance_maps_aspect_ratio_to_ratio():
    cfg = AtlasModelConfig(
        endpoint="generateVideo",
        input_type="reference_images",
        is_video=True,
        ratio_param="ratio",
        extra_params={"duration": 5, "ratio": "adaptive"},
    )
    merged = {"duration": 5, "ratio": "adaptive", "aspect_ratio": "16:9"}
    normalize_merged_ratio_fields(cfg, merged)
    assert "aspect_ratio" not in merged
    assert merged["ratio"] == "16:9"


def test_seedance_keeps_default_ratio_without_user_override():
    cfg = AtlasModelConfig(
        endpoint="generateVideo",
        input_type="reference_images",
        is_video=True,
        ratio_param="ratio",
        extra_params={"ratio": "adaptive"},
    )
    merged = {"ratio": "adaptive"}
    normalize_merged_ratio_fields(cfg, merged)
    assert merged == {"ratio": "adaptive"}


def test_veo_keeps_aspect_ratio():
    cfg = AtlasModelConfig(
        endpoint="generateVideo",
        input_type="none",
        is_video=True,
        ratio_param="aspect_ratio",
        extra_params={"aspect_ratio": "16:9"},
    )
    merged = {"aspect_ratio": "9:16", "duration": 8}
    normalize_merged_ratio_fields(cfg, merged)
    assert merged["aspect_ratio"] == "9:16"
    assert "ratio" not in merged


def test_no_ratio_field_strips_both():
    cfg = AtlasModelConfig(
        endpoint="generateImage",
        input_type="none",
        is_video=False,
        ratio_param="",
    )
    merged = {"aspect_ratio": "1:1", "size": "1024x1024"}
    normalize_merged_ratio_fields(cfg, merged)
    assert "aspect_ratio" not in merged
    assert "ratio" not in merged
    assert merged["size"] == "1024x1024"


def test_default_target_is_aspect_ratio_when_ratio_param_unset():
    cfg = AtlasModelConfig(
        endpoint="generateVideo",
        input_type="none",
        is_video=True,
        extra_params={"aspect_ratio": "16:9"},
    )
    merged = {"aspect_ratio": "1:1"}
    normalize_merged_ratio_fields(cfg, merged)
    assert merged["aspect_ratio"] == "1:1"
