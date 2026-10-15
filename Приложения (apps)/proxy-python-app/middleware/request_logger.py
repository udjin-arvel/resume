"""Middleware для логирования всех запросов (особенно OPTIONS)"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from logging_config import setup_logging

logger = setup_logging()


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """Логирует все запросы, особенно OPTIONS и запросы от Kafka сервера"""
    
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        method = request.method
        path = request.url.path
        client_host = request.client.host if request.client else "unknown"
        
        # Определяем, является ли запрос от Kafka сервера
        is_kafka_request = (
            client_host in ["89.191.225.165", "155.212.247.87"] or
            "89.191.225.165" in str(request.headers.get("x-forwarded-for", "")) or
            "155.212.247.87" in str(request.headers.get("x-forwarded-for", ""))
        )
        
        # Логируем ВСЕ OPTIONS запросы
        if method == "OPTIONS":
            all_headers = {k: v for k, v in request.headers.items()}
            logger.warning(f"=== OPTIONS REQUEST ===")
            logger.warning(f"Path: {path}")
            logger.warning(f"Origin: {origin}")
            logger.warning(f"Client: {client_host}")
            logger.warning(f"All headers: {all_headers}")
        
        # Логируем POST-запросы от Kafka сервера (любые пути)
        if is_kafka_request and method == "POST":
            logger.info(f"=== KAFKA REQUEST ===")
            logger.info(f"Path: {path}")
            logger.info(f"Client: {client_host}")
            logger.info(f"Headers: {dict(request.headers)}")
        
        try:
            response = await call_next(request)
            
            if method == "OPTIONS":
                response_headers = {k: v for k, v in response.headers.items()}
                logger.warning(f"OPTIONS response status: {response.status_code}")
                logger.warning(f"Response headers: {response_headers}")
            
            # Логируем ответы для Kafka запросов
            if is_kafka_request and method == "POST":
                logger.info(f"=== KAFKA RESPONSE ===")
                logger.info(f"Status: {response.status_code}")
            
            return response
        except Exception as e:
            if method == "OPTIONS":
                logger.error(f"Error in OPTIONS request: {e}")
            if is_kafka_request:
                logger.error(f"Error in Kafka request: {e}")
            raise

