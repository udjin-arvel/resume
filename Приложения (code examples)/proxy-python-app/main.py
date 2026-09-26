from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager

from config import settings
from logging_config import setup_logging
from models.responses import ErrorResponse
from services.atlasai_service import atlasai_service
from services.kafka_service import kafka_service
from services.openai_service import openai_service

# Импорт роутеров
from routers import common, auth

# Импорт middleware
from middleware import SwaggerRestrictionMiddleware, RequestLoggerMiddleware

# Настройка логирования
logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Инициализация при запуске приложения"""
    logger.info("Инициализация приложения...")
    # Инициализация сервисов
    await atlasai_service.initialize()
    try:
        await openai_service.initialize()
        logger.info("OpenAI (Assistants) инициализирован на proxy")
    except Exception as e:
        logger.warning("OpenAI init: %s", e, exc_info=True)
    
    # Инициализация Kafka сервиса
    try:
        kafka_service.initialize()
        kafka_service.start_requests_consumer()
        kafka_service.start_prompt_jobs_consumer()
        logger.info("Kafka: requests + prompt_jobs consumers")
    except Exception as e:
        logger.error(f"Ошибка инициализации Kafka сервиса: {e}")
        logger.warning("Приложение продолжит работу без Kafka интеграции")
    
    logger.info("Приложение готово к работе")
    yield
    # Очистка при остановке
    logger.info("Остановка приложения...")
    await kafka_service.shutdown_graceful()
    try:
        await openai_service.cleanup()
    except Exception as e:
        logger.warning("OpenAI cleanup: %s", e)
    await atlasai_service.cleanup()
    logger.info("Приложение остановлено")


app = FastAPI(
    title="RADAR Backend Proxy",
    description="Backend для работы с AI моделями",
    version="1.0.0",
    lifespan=lifespan
)

# Логирование CORS настроек при старте
cors_origins = settings.CORS_ORIGINS
logger.info(f"Настроенные CORS origins: {cors_origins}")

# Middleware для логирования всех запросов (особенно OPTIONS)
# В FastAPI middleware выполняются в обратном порядке добавления
# Поэтому добавляем логирование ПОСЛЕ CORS, чтобы оно выполнялось ПЕРВЫМ

# CORS middleware - добавляем ПЕРВЫМ (выполнится ПОСЛЕДНИМ)
logger.info(f"Настройка CORS с {len(cors_origins)} разрешенными origins")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Добавляем ограничение доступа к Swagger ПОСЛЕ CORS (выполнится перед логированием)
app.add_middleware(SwaggerRestrictionMiddleware)

# Добавляем логирование ПОСЛЕ CORS (выполнится ПЕРВЫМ)
app.add_middleware(RequestLoggerMiddleware)

# Подключение роутеров
app.include_router(common.router)
app.include_router(auth.router)

# Глобальный обработчик исключений
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Глобальный обработчик исключений"""
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal Server Error",
            detail=str(exc)
        ).dict()
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
