from functools import lru_cache

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://conquer:conquer@db:5432/conquer"
    database_url_sync: str | None = Field(default=None)
    redis_url: str = "redis://redis:6379/0"
    secret_key: str = "change-me"
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    deepseek_max_retries: int = 3
    deepseek_timeout_seconds: float = 60
    analysis_max_text_chars: int = 12000
    debug: bool = True
    parser_timeout_ms: int = 30000
    parser_max_text_chars: int = 100000

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sync_database_url(self) -> str:
        if self.database_url_sync:
            return self.database_url_sync
        return self.database_url.replace("postgresql+asyncpg", "postgresql+psycopg2", 1)


@lru_cache
def get_settings() -> Settings:
    return Settings()
