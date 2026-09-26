"""
Конфигурация приложения
"""
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from typing import List
import logging
import os
from dotenv import load_dotenv

load_dotenv()

_config_log = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Настройки приложения"""
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8090"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS settings - обрабатываем как строку, чтобы избежать JSON парсинга
    CORS_ORIGINS_STR: str = "http://localhost:3000,http://localhost:8080"
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Преобразует строку CORS_ORIGINS в список"""
        cors_str = os.getenv("CORS_ORIGINS", self.CORS_ORIGINS_STR)
        
        # Заменяем старый сервер на новый
        cors_str = cors_str.replace("194.87.109.216:8090", "72.56.72.97:8090")
        cors_str = cors_str.replace("http://194.87.109.216:8090", "http://72.56.72.97:8090")
        cors_str = cors_str.replace("https://194.87.109.216:8090", "http://72.56.72.97:8090")  # Заменяем https на http
        cors_str = cors_str.replace("194.87.109.216", "72.56.72.97")  # Без порта тоже
        
        origins = [origin.strip() for origin in cors_str.split(",") if origin.strip()]
        
        # Добавляем новый сервер, если его еще нет
        new_server = "http://72.56.72.97:8090"
        if new_server not in origins:
            origins.append(new_server)
        
        # Добавляем IP адреса Kafka серверов без портов для гибкости
        kafka_ips = ["89.191.225.165", "155.212.247.87"]
        for ip in kafka_ips:
            # Добавляем варианты с http/https и без порта
            if f"http://{ip}" not in cors_str and f"https://{ip}" not in cors_str:
                origins.extend([f"http://{ip}", f"https://{ip}"])
        return origins
    
    # OpenAI: Assistants/threads (промпты) + QC vision в atlasai_service
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_QC_MODEL: str = os.getenv("OPENAI_QC_MODEL", "gpt-4o-mini")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", "1000"))
    OPENAI_TEMPERATURE: float = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
    OPENAI_PROXY: str = os.getenv("OPENAI_PROXY", "")
    MOCK_OPENAI: bool = os.getenv("MOCK_OPENAI", "False").lower() == "true"
    OPENAI_FALLBACK_SIMPLE_ON_ASSISTANTS_ERROR: bool = (
        os.getenv("OPENAI_FALLBACK_SIMPLE_ON_ASSISTANTS_ERROR", "true").lower() == "true"
    )
    IS_PROMPT_LOG_ENABLE: str = os.getenv("IS_PROMPT_LOG_ENABLE", "0")

    # Runway settings
    RUNWAY_API_KEY: str = os.getenv("RUNWAY_API_KEY", "")
    RUNWAY_API_URL: str = os.getenv(
        "RUNWAY_API_URL", 
        "https://dev.runwayml.com"
    )
    RUNWAY_TIMEOUT: int = int(os.getenv("RUNWAY_TIMEOUT", "300"))
    # Runway Proxy settings (для обхода региональных ограничений)
    # Формат: http://proxy:port или http://user:pass@proxy:port
    RUNWAY_PROXY: str = os.getenv("RUNWAY_PROXY", "")
    
    # Kling AI settings
    KLING_API_KEY: str = os.getenv("KLING_API_KEY", "")
    KLING_ACCESS_KEY: str = os.getenv("KLING_ACCESS_KEY", "")
    KLING_SECRET_KEY: str = os.getenv("KLING_SECRET_KEY", "")
    # Пробуем разные варианты базового URL для Kling AI
    # api.kling.ai не существует (NXDOMAIN), используем api.klingai.com
    KLING_API_URL: str = os.getenv("KLING_API_URL", "https://api.klingai.com")
    KLING_TIMEOUT: int = int(os.getenv("KLING_TIMEOUT", "300"))
    
    # Google AI settings
    GOOGLE_AI_API_KEY: str = os.getenv("GOOGLE_AI_API_KEY", "")
    # Google AI Proxy settings (для обхода региональных ограничений)
    # Формат: http://proxy:port или http://user:pass@proxy:port
    GOOGLE_AI_PROXY: str = os.getenv("GOOGLE_AI_PROXY", "")
    GOOGLE_CLOUD_PROJECT_ID: str = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "gen-lang-client-0357731958")
    
    # Veo 3.1 (Vertex AI) settings (для генерации видео из изображений)
    VEO_PROJECT_ID: str = os.getenv("VEO_PROJECT_ID", "")
    VEO_LOCATION: str = os.getenv("VEO_LOCATION", "us-central1")
    # Для Vertex AI может потребоваться OAuth2 токен вместо API ключа
    VEO_OAUTH_TOKEN: str = os.getenv("VEO_OAUTH_TOKEN", "")
    
    # BytePlus settings
    BYTEPLUS_API_KEY: str = os.getenv("BYTEPLUS_API_KEY", "")
    BYTEPLUS_BASE_URL: str = os.getenv("BYTEPLUS_BASE_URL", "https://ark.ap-southeast.bytepluses.com")
    BYTEPLUS_MODEL: str = os.getenv("BYTEPLUS_MODEL", "seedream-4-0-250828")
    BYTEPLUS_TIMEOUT: int = int(os.getenv("BYTEPLUS_TIMEOUT", "30"))
    BYTEPLUS_PROXY: str = os.getenv("BYTEPLUS_PROXY", "")
    
    # Atlas Cloud AI settings
    ATLAS_API_KEY: str = os.getenv("ATLAS_API_KEY", "")
    ATLAS_API_URL: str = os.getenv("ATLAS_API_URL", "https://api.atlascloud.ai/api/v1")
    ATLAS_TIMEOUT: int = int(os.getenv("ATLAS_TIMEOUT", "60"))
    # HTTP-таймаут POST старта generateVideo (сек.); изображения используют ATLAS_TIMEOUT.
    ATLAS_TIMEOUT_VIDEO: int = int(os.getenv("ATLAS_TIMEOUT_VIDEO", "500"))
    # Максимум успешных GET статуса (после ответов 429 и т.д.) для опроса картинок; см. также ATLAS_MAX_ATTEMPTS_VIDEO.
    ATLAS_MAX_ATTEMPTS: int = int(os.getenv("ATLAS_MAX_ATTEMPTS", "500"))
    ATLAS_MAX_ATTEMPTS_VIDEO: int = int(os.getenv("ATLAS_MAX_ATTEMPTS_VIDEO", "1200"))
    # Опрос GET /model/prediction/{id}: верхняя граница по времени (сек.). 0 = только лимит по числу попыток.
    ATLAS_POLL_MAX_WAIT_IMAGE_SEC: int = int(os.getenv("ATLAS_POLL_MAX_WAIT_IMAGE_SEC", "900"))
    # Для видео генерация Atlas часто занимает 10–25+ мин; при необходимости поднимите (например 3600).
    ATLAS_POLL_MAX_WAIT_VIDEO_SEC: int = int(os.getenv("ATLAS_POLL_MAX_WAIT_VIDEO_SEC", "1800"))
    # Интервалы опроса GET /model/prediction/{id}: c первого GET и до завершения.
    ATLAS_POLL_INTERVAL_IMAGE_SEC: float = float(os.getenv("ATLAS_POLL_INTERVAL_IMAGE_SEC", "3.0"))
    ATLAS_POLL_INTERVAL_VIDEO_SEC: float = float(os.getenv("ATLAS_POLL_INTERVAL_VIDEO_SEC", "4.0"))
    ATLAS_POLL_JITTER_RATIO: float = float(os.getenv("ATLAS_POLL_JITTER_RATIO", "0.15"))
    ATLAS_POLL_429_DEFAULT_SEC: float = float(os.getenv("ATLAS_POLL_429_DEFAULT_SEC", "5.0"))
    ATLAS_POLL_429_SLEEP_MIN_SEC: float = float(os.getenv("ATLAS_POLL_429_SLEEP_MIN_SEC", "1.0"))
    ATLAS_POLL_429_SLEEP_MAX_SEC: float = float(os.getenv("ATLAS_POLL_429_SLEEP_MAX_SEC", "120.0"))
    # Таймауты GET /model/prediction/{id} (connect / read, сек.); при обрыве — retry в atlasai_service.
    ATLAS_POLL_CONNECT_TIMEOUT_SEC: float = float(os.getenv("ATLAS_POLL_CONNECT_TIMEOUT_SEC", "60"))
    ATLAS_POLL_READ_TIMEOUT_SEC: float = float(os.getenv("ATLAS_POLL_READ_TIMEOUT_SEC", "60"))
    # Повтор POST при 429 (консервативно: каждый успешный POST может создать новую prediction).
    ATLAS_POST_MAX_429_RETRIES: int = int(os.getenv("ATLAS_POST_MAX_429_RETRIES", "2"))
    # GET готового файла по URL из ответа Atlas (часто Aliyun OSS, десятки МБ mp4 при слабом канале).
    # Раньше 120 с давало ReadTimeout при ~26+ МБ; read должен быть с запасом.
    ATLAS_RESULT_DOWNLOAD_TIMEOUT_VIDEO_SEC: int = int(
        os.getenv("ATLAS_RESULT_DOWNLOAD_TIMEOUT_VIDEO_SEC", "900")
    )
    ATLAS_RESULT_DOWNLOAD_TIMEOUT_IMAGE_SEC: int = int(
        os.getenv("ATLAS_RESULT_DOWNLOAD_TIMEOUT_IMAGE_SEC", "240")
    )
    # Предвалидация входных reference images по URL до POST в Atlas:
    # HEAD/GET, Content-Type и сигнатура первых байт (JPEG/PNG).
    ATLAS_REF_IMAGE_VALIDATION_ENABLED: bool = (
        os.getenv("ATLAS_REF_IMAGE_VALIDATION_ENABLED", "false").lower() == "true"
    )

    # Request settings
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "60"))
    MAX_REQUEST_SIZE: int = int(os.getenv("MAX_REQUEST_SIZE", "10485760"))  # 10MB
    
    # Backend URL для сохранения файлов
    # В docker-compose backend сервис называется `api` (см. radar-art__backend/docker-compose.yml),
    # поэтому дефолт должен резолвиться внутри общей сети (kafka-network).
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://api:8000")
    # Deprecated: generation results передаются через Kafka (result_source_url), не POST /storage/file.
    BACKEND_STORAGE_UPLOAD_TIMEOUT: int = int(os.getenv("BACKEND_STORAGE_UPLOAD_TIMEOUT", "600"))
    BACKEND_STORAGE_UPLOAD_SECRET: str = os.getenv("BACKEND_STORAGE_UPLOAD_SECRET", "")

    # Общий секрет с backend для HMAC полей backend_api_base в Kafka (requests)
    BACKEND_PROXY_HMAC_SECRET: str = os.getenv("BACKEND_PROXY_HMAC_SECRET", "")
    # True: сообщения без backend_api_base/hmac → использовать BACKEND_URL (как раньше)
    BACKEND_PROXY_ALLOW_LEGACY_UNSIGNED: bool = (
        os.getenv("BACKEND_PROXY_ALLOW_LEGACY_UNSIGNED", "true").lower() == "true"
    )

    # Simulation/Mock settings (для тестирования без реальных запросов)
    MOCK_ATLAS_AI: bool = os.getenv("MOCK_ATLAS_AI", "False").lower() == "true"

    # Kafka settings
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv(
        "KAFKA_BOOTSTRAP_SERVERS", "127.0.0.1:9092"
    )
    KAFKA_CONSUMER_GROUP_ID: str = os.getenv("KAFKA_CONSUMER_GROUP_ID", "radar_backend_proxy")
    # Имена топиков без префикса gpt_; приоритет KAFKA_TOPIC_* , fallback на KAFKA_TOPIC_GPT_*
    # requests: одно имя или несколько через запятую (proxy подписывается на все сразу)
    KAFKA_TOPIC_REQUESTS: str = (
        os.getenv("KAFKA_TOPIC_REQUESTS") or os.getenv("KAFKA_TOPIC_GPT_REQUESTS") or "requests"
    )
    # results: одно имя или несколько через запятую (producer дублирует сообщение в каждый топик)
    KAFKA_TOPIC_RESULTS: str = (
        os.getenv("KAFKA_TOPIC_RESULTS") or os.getenv("KAFKA_TOPIC_GPT_RESULTS") or "results"
    )
    KAFKA_TOPIC_DIALOGS: str = (
        os.getenv("KAFKA_TOPIC_DIALOGS") or os.getenv("KAFKA_TOPIC_GPT_DIALOGS") or "dialogs"
    )
    # Очередь «собери промпт через OpenAI Assistants» (backend producer → proxy consumer → topic requests)
    KAFKA_TOPIC_PROMPT_JOBS: str = (
        os.getenv("KAFKA_TOPIC_PROMPT_JOBS") or os.getenv("KAFKA_TOPIC_GPT_PROMPT_JOBS", "prompt_jobs")
    )
    KAFKA_CONSUMER_AUTO_OFFSET_RESET: str = os.getenv("KAFKA_CONSUMER_AUTO_OFFSET_RESET", "latest")
    KAFKA_ENABLE_AUTO_COMMIT: bool = os.getenv("KAFKA_ENABLE_AUTO_COMMIT", "True").lower() == "true"
    # Параллельная обработка сообщений из топика requests (семафор в proxy)
    KAFKA_REQUESTS_MAX_CONCURRENCY: int = Field(default=3)
    KAFKA_PROMPT_JOBS_MAX_CONCURRENCY: int = Field(default=3)
    # Ожидание завершения in-flight задач перед закрытием producer при shutdown
    KAFKA_SHUTDOWN_DRAIN_TIMEOUT_SEC: float = Field(default=600.0)

    @field_validator("KAFKA_REQUESTS_MAX_CONCURRENCY", mode="before")
    @classmethod
    def validate_requests_max_concurrency(cls, v):
        if v is None or v == "":
            return 3
        try:
            i = int(v)
        except (TypeError, ValueError):
            _config_log.warning("Invalid KAFKA_REQUESTS_MAX_CONCURRENCY=%r, using 3", v)
            return 3
        if i < 1:
            _config_log.warning("KAFKA_REQUESTS_MAX_CONCURRENCY=%s < 1, using 1", i)
            return 1
        return i

    @field_validator("KAFKA_PROMPT_JOBS_MAX_CONCURRENCY", mode="before")
    @classmethod
    def validate_prompt_jobs_max_concurrency(cls, v):
        if v is None or v == "":
            return 3
        try:
            i = int(v)
        except (TypeError, ValueError):
            _config_log.warning("Invalid KAFKA_PROMPT_JOBS_MAX_CONCURRENCY=%r, using 3", v)
            return 3
        if i < 1:
            _config_log.warning("KAFKA_PROMPT_JOBS_MAX_CONCURRENCY=%s < 1, using 1", i)
            return 1
        return i

    @field_validator("KAFKA_SHUTDOWN_DRAIN_TIMEOUT_SEC", mode="before")
    @classmethod
    def validate_shutdown_drain_timeout(cls, v):
        if v is None or v == "":
            return 600.0
        try:
            f = float(v)
        except (TypeError, ValueError):
            _config_log.warning("Invalid KAFKA_SHUTDOWN_DRAIN_TIMEOUT_SEC=%r, using 600.0", v)
            return 600.0
        if f < 1.0:
            _config_log.warning("KAFKA_SHUTDOWN_DRAIN_TIMEOUT_SEC=%s < 1, using 1.0", f)
            return 1.0
        return f

    class Config:
        env_file = ".env"
        case_sensitive = True
        # Игнорируем CORS_ORIGINS из переменных окружения, обрабатываем вручную
        extra = "ignore"


settings = Settings()
