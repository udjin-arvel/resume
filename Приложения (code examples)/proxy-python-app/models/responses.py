"""
Модели ответов
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class TextResponse(BaseModel):
    """Ответ с сгенерированным текстом"""
    text: str = Field(..., description="Сгенерированный текст")
    model: str = Field(..., description="Использованная модель")
    usage: Optional[Dict[str, Any]] = Field(None, description="Информация об использовании токенов")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "Это сгенерированный текст...",
                "model": "gpt-3.5-turbo",
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 50,
                    "total_tokens": 60
                }
            }
        }


class VideoResponse(BaseModel):
    """Ответ с информацией о генерации видео"""
    task_id: str = Field(..., description="ID задачи генерации")
    status: str = Field(..., description="Статус задачи (pending, processing, completed, failed)")
    prompt: str = Field(..., description="Промпт, использованный для генерации")
    video_url: Optional[str] = Field(None, description="URL готового видео")
    error: Optional[str] = Field(None, description="Сообщение об ошибке, если есть")
    
    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "task_123456",
                "status": "processing",
                "prompt": "A beautiful sunset",
                "video_url": None,
                "error": None
            }
        }


class ImageResponse(BaseModel):
    """Ответ с информацией об обработке фото"""
    task_id: str = Field(..., description="ID задачи обработки")
    status: str = Field(..., description="Статус задачи (pending, processing, completed, failed)")
    image_url: str = Field(..., description="URL исходного изображения")
    video_url: Optional[str] = Field(None, description="URL готового видео (ссылка на обработанный запрос)")
    prompt: Optional[str] = Field(None, description="Промпт, использованный для обработки")
    error: Optional[str] = Field(None, description="Сообщение об ошибке, если есть")
    
    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "task_123456",
                "status": "processing",
                "image_url": "https://example.com/image.jpg",
                "video_url": None,
                "prompt": "Animate this image",
                "error": None
            }
        }


class ErrorResponse(BaseModel):
    """Модель ошибки"""
    error: str = Field(..., description="Тип ошибки")
    detail: str = Field(..., description="Детали ошибки")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Validation Error",
                "detail": "Invalid prompt provided"
            }
        }

