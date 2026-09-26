"""
Модели запросов
"""
from pydantic import BaseModel, Field
from typing import Optional


class TextRequest(BaseModel):
    """Запрос на генерацию текста"""
    prompt: str = Field(..., description="Промпт для генерации текста", min_length=1, max_length=10000)
    model: Optional[str] = Field(None, description="Модель OpenAI (по умолчанию из конфига)")
    max_tokens: Optional[int] = Field(None, description="Максимальное количество токенов", ge=1, le=4000)
    temperature: Optional[float] = Field(None, description="Температура генерации", ge=0.0, le=2.0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "Напиши короткий рассказ о космосе",
                "model": "gpt-3.5-turbo",
                "max_tokens": 500,
                "temperature": 0.7
            }
        }


class VideoRequest(BaseModel):
    """Запрос на генерацию видео"""
    prompt: str = Field(..., description="Промпт для генерации видео", min_length=1, max_length=1000)
    duration: Optional[int] = Field(5, description="Длительность видео в секундах", ge=1, le=10)
    aspect_ratio: Optional[str] = Field("16:9", description="Соотношение сторон (16:9, 9:16, 1:1)")
    watermark: Optional[bool] = Field(False, description="Добавлять ли водяной знак")
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "A beautiful sunset over the ocean with waves crashing",
                "duration": 5,
                "aspect_ratio": "16:9",
                "watermark": False
            }
        }


class ImageRequest(BaseModel):
    """Запрос на обработку фото (image-to-video)"""
    image_url: str = Field(..., description="URL изображения для обработки", min_length=1)
    prompt: Optional[str] = Field(None, description="Опциональный промпт для генерации видео", max_length=1000)
    duration: Optional[int] = Field(4, description="Длительность видео в секундах", ge=4, le=8)
    aspect_ratio: Optional[str] = Field("1920:1080", description="Соотношение сторон")
    watermark: Optional[bool] = Field(False, description="Добавлять ли водяной знак")
    model: Optional[str] = Field("veo3.1_fast", description="Модель для генерации")
    
    class Config:
        json_schema_extra = {
            "example": {
                "image_url": "https://example.com/image.jpg",
                "prompt": "Animate this image with smooth motion",
                "duration": 4,
                "aspect_ratio": "1920:1080",
                "watermark": False,
                "model": "veo3.1_fast"
            }
        }

