"""
Общие роуты (health check, root, kafka status, OpenAI thread/models для Assistants на proxy).
"""
import os
import logging

import openai
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from services.kafka_service import kafka_service
from services.openai_config import get_openai_settings
from services.openai_service import openai_service
from logging_config import setup_logging

router = APIRouter()
logger = setup_logging()
_log = logging.getLogger(__name__)


@router.delete("/api/v1/openai/thread/{task_id}")
async def delete_openai_thread_proxy(task_id: str):
    """Удалить Assistants thread (кэш/ OpenAI) для task_id."""
    if not openai_service.client:
        raise HTTPException(status_code=503, detail="OpenAI клиент не инициализирован")
    try:
        deleted = await openai_service.delete_thread(task_id)
        if deleted:
            return {
                "success": True,
                "message": f"Thread для task_id {task_id} успешно удален",
                "task_id": task_id,
                "chat_id": task_id,
            }
        return {
            "success": False,
            "message": f"Thread для task_id {task_id} не найден",
            "task_id": task_id,
            "chat_id": task_id,
        }
    except Exception as e:
        _log.error("delete_openai_thread_proxy: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/api/v1/models")
async def list_openai_models_proxy():
    """Список моделей OpenAI (chat-ориентированный фильтр)."""
    oa = get_openai_settings()
    if not openai_service.client:
        raise HTTPException(status_code=503, detail="OpenAI клиент не инициализирован")
    try:
        http_client = (
            httpx.Client(proxy=oa.openai_proxy, timeout=60.0)
            if oa.openai_proxy
            else httpx.Client(timeout=60.0)
        )
        client = openai.OpenAI(api_key=oa.api_key, http_client=http_client)
        models = client.models.list()
        chat_models = [
            {
                "id": model.id,
                "created": model.created,
                "owned_by": model.owned_by,
            }
            for model in models.data
            if "gpt" in model.id.lower()
            or "o1" in model.id.lower()
            or "o3" in model.id.lower()
        ]
        chat_models.sort(key=lambda x: x["created"], reverse=True)
        return {"models": chat_models, "total": len(chat_models)}
    except Exception as e:
        _log.error("list_openai_models_proxy: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/")
async def root():
    """Главная страница - редирект на веб-интерфейс"""
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "status": "ok",
        "service": "RADAR Backend Proxy",
        "version": "1.0.0",
        "web_interface": "/static/index.html",
    }


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@router.get("/api/v1/kafka/status")
async def kafka_status():
    """Проверка статуса Kafka consumer"""
    try:
        is_initialized = kafka_service.requests_consumer is not None and kafka_service.producer is not None
        is_running = kafka_service.requests_is_running

        return {
            "kafka_initialized": is_initialized,
            "consumer_running": is_running,
            "bootstrap_servers": kafka_service.bootstrap_servers,
            "topic_requests": kafka_service.topic_requests,
            "topic_requests_topics": kafka_service.topic_requests_list,
            "topic_prompt_jobs": kafka_service.topic_prompt_jobs,
            "topic_results": kafka_service.topic_results,
            "topic_results_topics": kafka_service.topic_results_list,
            "topic_responses": kafka_service.topic_results,
            "topic_dialogs": kafka_service.topic_dialogs,
            "consumer_group": kafka_service.consumer_group_id,
        }
    except Exception as e:
        return {
            "kafka_initialized": False,
            "consumer_running": False,
            "error": str(e),
        }
