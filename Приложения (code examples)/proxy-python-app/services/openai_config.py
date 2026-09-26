"""
Переменные окружения OpenAI (перенесены с proxy; Assistants/threads).
"""
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class OpenAISettings:
    api_key: str
    default_model: str
    chat_model: str
    chat_title_model: str
    default_max_tokens: int
    default_temperature: float
    openai_proxy: str
    mock_openai: bool
    openai_fallback_simple_on_assistants_error: bool
    is_prompt_log_enable: str


def get_openai_settings() -> OpenAISettings:
    default_model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    return OpenAISettings(
        api_key=os.getenv("OPENAI_API_KEY", ""),
        default_model=default_model,
        chat_model=os.getenv("OPENAI_CHAT_MODEL", default_model if default_model != "gpt-3.5-turbo" else "gpt-4.1"),
        chat_title_model=os.getenv("OPENAI_CHAT_TITLE_MODEL", "gpt-4o-mini"),
        default_max_tokens=int(os.getenv("OPENAI_MAX_TOKENS", "1000")),
        default_temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.7")),
        openai_proxy=os.getenv("OPENAI_PROXY", ""),
        mock_openai=os.getenv("MOCK_OPENAI", "False").lower() == "true",
        openai_fallback_simple_on_assistants_error=(
            os.getenv("OPENAI_FALLBACK_SIMPLE_ON_ASSISTANTS_ERROR", "true").lower() == "true"
        ),
        is_prompt_log_enable=os.getenv("IS_PROMPT_LOG_ENABLE", "0"),
    )
