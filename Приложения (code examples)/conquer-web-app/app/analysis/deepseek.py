import asyncio
import json
import logging
from typing import Any

from openai import APIStatusError, APITimeoutError, AsyncOpenAI, RateLimitError
from pydantic import ValidationError

from app.analysis.errors import AnalysisError, MissingApiKeyError
from app.analysis.prompts import JSON_REPAIR_PROMPT, SYSTEM_PROMPT, build_user_message
from app.analysis.schemas import AnalysisOutput
from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _get_client() -> AsyncOpenAI:
    settings = get_settings()
    if not settings.deepseek_api_key.strip():
        raise MissingApiKeyError("DEEPSEEK_API_KEY is not configured")
    return AsyncOpenAI(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
        timeout=settings.deepseek_timeout_seconds,
    )


def _parse_output(content: str) -> AnalysisOutput:
    data = json.loads(content)
    return AnalysisOutput.model_validate(data)


async def _chat_completion(
    client: AsyncOpenAI,
    messages: list[dict[str, str]],
) -> str:
    settings = get_settings()
    response = await client.chat.completions.create(
        model=settings.deepseek_model,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    content = response.choices[0].message.content
    if not content:
        raise AnalysisError("Empty response from DeepSeek")
    return content


async def _call_with_retries(
    client: AsyncOpenAI,
    messages: list[dict[str, str]],
) -> str:
    settings = get_settings()
    last_error: Exception | None = None
    for attempt in range(settings.deepseek_max_retries):
        try:
            return await _chat_completion(client, messages)
        except (APITimeoutError, RateLimitError, APIStatusError, asyncio.TimeoutError) as exc:
            last_error = exc
            if isinstance(exc, APIStatusError) and exc.status_code < 500 and exc.status_code != 429:
                raise AnalysisError(f"DeepSeek API error: {exc}") from exc
            delay = 2**attempt
            logger.warning(
                "DeepSeek attempt %s/%s failed: %s; retry in %ss",
                attempt + 1,
                settings.deepseek_max_retries,
                exc,
                delay,
            )
            await asyncio.sleep(delay)
        except Exception as exc:
            last_error = exc
            raise AnalysisError(f"DeepSeek request failed: {exc}") from exc
    raise AnalysisError(f"DeepSeek failed after retries: {last_error}") from last_error


async def analyze_site_data(data: dict[str, Any]) -> AnalysisOutput:
    settings = get_settings()
    client = _get_client()
    user_content = build_user_message(data, settings.analysis_max_text_chars)
    messages: list[dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    raw = await _call_with_retries(client, messages)
    try:
        return _parse_output(raw)
    except (json.JSONDecodeError, ValidationError) as first_exc:
        logger.warning("Invalid DeepSeek JSON, trying repair: %s", first_exc)
        repair_messages = [
            *messages,
            {"role": "assistant", "content": raw},
            {"role": "user", "content": JSON_REPAIR_PROMPT},
        ]
        try:
            repaired = await _chat_completion(client, repair_messages)
            return _parse_output(repaired)
        except (json.JSONDecodeError, ValidationError, AnalysisError) as repair_exc:
            raise AnalysisError(
                f"DeepSeek returned invalid JSON: {first_exc}"
            ) from repair_exc
