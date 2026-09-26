"""
OpenAI Responses API helpers for Radar Art chat (web search, attachments, streaming).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Dict, List, Literal, Optional

AttachmentRoute = Literal["image", "code_interpreter", "file_search", "input_file"]

logger = logging.getLogger(__name__)

CHAT_INSTRUCTIONS = (
    "You are a helpful AI assistant. "
    "Always respond in Russian only, including code comments and explanations. "
    "If the user writes in another language, still reply in Russian. "
    "Answer thoughtfully and concisely."
)

CHAT_ATTACHMENT_INSTRUCTIONS = (
    "For attached files: read and analyze them, then answer immediately with full results. "
    "PDF and Word files are already in the message as file attachments — read them directly; "
    "do not use code_interpreter or Python libraries to extract PDF text. "
    "Use code_interpreter only for spreadsheets and data files; use file_search for plain text. "
    "No placeholders or fake analysis. If unreadable, state it clearly."
)

CHAT_TITLE_INSTRUCTIONS = (
    "You generate short chat titles. "
    "Given the user's first message (and optional attachment names), "
    "output exactly one concise title in Russian: 3–8 words, no quotes, "
    "no trailing period, no markdown, max 60 characters."
)

DEFAULT_CHAT_TITLE = "Новый чат"
CHAT_TITLE_MAX_LEN = 255

TABLE_EXTENSIONS = frozenset({".xlsx", ".xls", ".csv", ".json", ".parquet"})
INPUT_FILE_DOC_EXTENSIONS = frozenset({".pdf", ".docx"})


def route_attachment_ext(ext: str, kind: str) -> AttachmentRoute:
    """Куда направить вложение: image, input_file, code_interpreter или file_search."""
    if kind == "image":
        return "image"
    normalized = (ext or "").lower()
    if not normalized.startswith("."):
        normalized = f".{normalized}" if normalized else ""
    if normalized in INPUT_FILE_DOC_EXTENSIONS:
        return "input_file"
    if kind == "table" or normalized in TABLE_EXTENSIONS:
        return "code_interpreter"
    return "file_search"


def build_chat_instructions(
    prepared: Optional[PreparedAttachments] = None,
    attachment_names: Optional[List[str]] = None,
) -> str:
    parts = [CHAT_INSTRUCTIONS]
    has_attachments = prepared and (
        prepared.image_file_ids
        or prepared.input_file_ids
        or prepared.code_interpreter_file_ids
        or prepared.file_search_file_ids
    )
    if has_attachments:
        parts.append(CHAT_ATTACHMENT_INSTRUCTIONS)
        names = [str(n).strip() for n in (attachment_names or []) if n and str(n).strip()]
        if names:
            parts.append(f"Files attached to this message: {', '.join(names)}.")
    return " ".join(parts)


def _resolve_tool_choice(
    *,
    enable_web_search: bool,
    previous_response_id: Optional[str],
    prepared: Optional[PreparedAttachments],
) -> Optional[Dict[str, str]]:
    """Приоритет на первом ходе: code_interpreter > file_search > auto (PDF/DOCX) > web_search."""
    if previous_response_id:
        return None
    if prepared and prepared.needs_code_interpreter:
        return {"type": "code_interpreter"}
    if prepared and prepared.needs_file_search:
        return {"type": "file_search"}
    if prepared and prepared.needs_input_files:
        return None
    if enable_web_search:
        return {"type": "web_search"}
    return None


def coerce_bool(value: Any) -> bool:
    """Kafka/form-friendly bool parsing (avoids bool('false') == True)."""
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def is_previous_response_id(stored_id: Optional[str]) -> bool:
    """Stored chat.thread_id for Responses API multi-turn."""
    return bool(stored_id and str(stored_id).startswith("resp_"))


def resolve_previous_response_id(stored_id: Optional[str]) -> Optional[str]:
    if is_previous_response_id(stored_id):
        return str(stored_id)
    if stored_id and str(stored_id).startswith("thread_"):
        logger.info("Chat: ignoring legacy Assistants thread_id=%s", stored_id)
    return None


@dataclass
class PreparedAttachments:
    image_file_ids: List[str] = field(default_factory=list)
    input_file_ids: List[str] = field(default_factory=list)
    code_interpreter_file_ids: List[str] = field(default_factory=list)
    file_search_file_ids: List[str] = field(default_factory=list)

    @property
    def needs_input_files(self) -> bool:
        return bool(self.input_file_ids)

    @property
    def needs_code_interpreter(self) -> bool:
        return bool(self.code_interpreter_file_ids)

    @property
    def needs_file_search(self) -> bool:
        return bool(self.file_search_file_ids)


def build_chat_tools(
    *,
    enable_web_search: bool,
    prepared: PreparedAttachments,
    vector_store_id: Optional[str] = None,
    continue_code_interpreter: bool = False,
) -> List[Dict[str, Any]]:
    tools: List[Dict[str, Any]] = []
    if enable_web_search:
        tools.append({"type": "web_search"})
    if prepared.needs_code_interpreter:
        tools.append(
            {
                "type": "code_interpreter",
                "container": {
                    "type": "auto",
                    "file_ids": list(prepared.code_interpreter_file_ids),
                },
            }
        )
    elif continue_code_interpreter:
        tools.append(
            {
                "type": "code_interpreter",
                "container": {"type": "auto"},
            }
        )
    if prepared.needs_file_search and vector_store_id:
        tools.append(
            {"type": "file_search", "vector_store_ids": [vector_store_id]}
        )
    return tools


def build_response_request_kwargs(
    *,
    model: str,
    user_input: Any,
    tools: List[Dict[str, Any]],
    enable_web_search: bool,
    previous_response_id: Optional[str] = None,
    prepared: Optional[PreparedAttachments] = None,
    attachment_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Build kwargs for Responses API create/stream (testable, no client call)."""
    request_kwargs: Dict[str, Any] = {
        "model": model,
        "input": user_input,
        "instructions": build_chat_instructions(prepared, attachment_names),
        "store": True,
    }
    if tools:
        request_kwargs["tools"] = tools
    tool_choice = _resolve_tool_choice(
        enable_web_search=enable_web_search,
        previous_response_id=previous_response_id,
        prepared=prepared,
    )
    if tool_choice:
        request_kwargs["tool_choice"] = tool_choice
    if previous_response_id:
        request_kwargs["previous_response_id"] = previous_response_id
    return request_kwargs


def build_user_input(
    user_message: str,
    prepared: PreparedAttachments,
) -> Any:
    """Responses API `input`: string or multimodal user message."""
    parts: List[Dict[str, Any]] = []
    text = user_message.strip()
    if text:
        parts.append({"type": "input_text", "text": text})
    for file_id in prepared.image_file_ids:
        parts.append({"type": "input_image", "file_id": file_id})
    for file_id in prepared.input_file_ids:
        parts.append({"type": "input_file", "file_id": file_id})
    for file_id in prepared.code_interpreter_file_ids:
        parts.append({"type": "input_file", "file_id": file_id})

    if not parts:
        return " "
    if len(parts) == 1 and parts[0]["type"] == "input_text":
        return text or " "
    return [{"role": "user", "content": parts}]


def _event_type(event: Any) -> Optional[str]:
    return getattr(event, "type", None) or (
        event.get("type") if isinstance(event, dict) else None
    )


def _response_output_text_delta(event: Any) -> str:
    if _event_type(event) != "response.output_text.delta":
        return ""
    delta = getattr(event, "delta", None)
    if delta is None and isinstance(event, dict):
        delta = event.get("delta")
    if delta is None:
        return ""
    if isinstance(delta, str):
        return delta
    return getattr(delta, "text", None) or getattr(delta, "value", None) or ""


def _response_output_text_done(event: Any) -> str:
    """Full assistant text from response.output_text.done (common after web search)."""
    if _event_type(event) != "response.output_text.done":
        return ""
    text = getattr(event, "text", None)
    if text is None and isinstance(event, dict):
        text = event.get("text")
    return str(text) if text else ""


def extract_output_text_from_response(response: Any) -> str:
    """Read final assistant text from a Responses API response object."""
    if response is None:
        return ""
    output_text = getattr(response, "output_text", None)
    if output_text is None and isinstance(response, dict):
        output_text = response.get("output_text")
    if output_text:
        return str(output_text)

    output = getattr(response, "output", None)
    if output is None and isinstance(response, dict):
        output = response.get("output") or []
    chunks: List[str] = []
    for item in output or []:
        item_type = getattr(item, "type", None) or (
            item.get("type") if isinstance(item, dict) else None
        )
        if item_type != "message":
            continue
        content = getattr(item, "content", None) or (
            item.get("content") if isinstance(item, dict) else None
        ) or []
        for part in content:
            part_type = getattr(part, "type", None) or (
                part.get("type") if isinstance(part, dict) else None
            )
            if part_type != "output_text":
                continue
            text = getattr(part, "text", None) or (
                part.get("text") if isinstance(part, dict) else None
            )
            if text:
                chunks.append(str(text))
    return "".join(chunks)


def _suffix_after_accumulated(accumulated: str, new_text: str) -> str:
    """Yield only the part of new_text not already streamed."""
    if not new_text:
        return ""
    if not accumulated:
        return new_text
    if new_text.startswith(accumulated):
        return new_text[len(accumulated) :]
    if accumulated.startswith(new_text):
        return ""
    return new_text


def _response_completed_id(event: Any) -> Optional[str]:
    if _event_type(event) != "response.completed":
        return None
    response = getattr(event, "response", None)
    if response is None and isinstance(event, dict):
        response = event.get("response")
    if response is None:
        return None
    rid = getattr(response, "id", None)
    if rid is None and isinstance(response, dict):
        rid = response.get("id")
    return rid


def _response_failed_message(event: Any) -> Optional[str]:
    ev_type = _event_type(event)
    if ev_type not in ("response.failed", "error"):
        return None
    if ev_type == "error":
        msg = getattr(event, "message", None)
        return str(msg) if msg else "OpenAI stream error"
    response = getattr(event, "response", None)
    if response is None:
        return "OpenAI response failed"
    err = getattr(response, "error", None)
    if err is None:
        return "OpenAI response failed"
    msg = getattr(err, "message", None)
    return str(msg) if msg else "OpenAI response failed"


async def _process_response_stream(
    stream: Any,
) -> AsyncIterator[tuple[str, Optional[str]]]:
    """Parse Responses API SSE events; yields text chunks then (\"\", response_id)."""
    accumulated = ""
    response_id: Optional[str] = None
    final_response: Any = None
    seen_event_types: set[str] = set()

    async for event in stream:
        ev_type = _event_type(event) or ""
        if ev_type and ev_type not in seen_event_types:
            seen_event_types.add(ev_type)
            logger.debug("Chat stream event: %s", ev_type)

        failed = _response_failed_message(event)
        if failed:
            raise RuntimeError(failed)

        delta = _response_output_text_delta(event)
        if delta:
            accumulated += delta
            yield delta, None

        done_text = _response_output_text_done(event)
        if done_text:
            suffix = _suffix_after_accumulated(accumulated, done_text)
            if suffix:
                accumulated = done_text if done_text.startswith(accumulated) else accumulated + suffix
                yield suffix, None

        completed_id = _response_completed_id(event)
        if completed_id:
            response_id = completed_id
            resp = getattr(event, "response", None)
            if resp is None and isinstance(event, dict):
                resp = event.get("response")
            if resp is not None:
                final_response = resp
                completed_text = extract_output_text_from_response(resp)
                suffix = _suffix_after_accumulated(accumulated, completed_text)
                if suffix:
                    accumulated = (
                        completed_text
                        if completed_text.startswith(accumulated)
                        else accumulated + suffix
                    )
                    yield suffix, None

    get_final = getattr(stream, "get_final_response", None)
    if callable(get_final):
        try:
            final_response = await get_final()
            if final_response is not None:
                response_id = response_id or getattr(final_response, "id", None)
        except Exception as exc:
            logger.warning("Chat stream: get_final_response failed: %s", exc)

    if final_response is not None:
        final_text = extract_output_text_from_response(final_response)
        suffix = _suffix_after_accumulated(accumulated, final_text)
        if suffix:
            accumulated = (
                final_text if final_text.startswith(accumulated) else accumulated + suffix
            )
            yield suffix, None
        if not response_id:
            response_id = getattr(final_response, "id", None)

    logger.info(
        "Chat stream finished response_id=%s streamed_chars=%s events=%s",
        response_id,
        len(accumulated),
        len(seen_event_types),
    )

    if response_id:
        yield "", response_id


def build_chat_title_input(
    user_message: str,
    attachment_names: Optional[List[str]] = None,
) -> str:
    text = (user_message or "").strip()
    names = [n.strip() for n in (attachment_names or []) if n and str(n).strip()]
    if text:
        if names:
            return f"{text}\n\nВложения: {', '.join(names)}"
        return text
    if names:
        return f"Вложения: {', '.join(names)}"
    return " "


def normalize_chat_title(raw: Optional[str]) -> str:
    if not raw:
        return DEFAULT_CHAT_TITLE
    title = " ".join(str(raw).strip().split())
    for ch in ('"', "'", "«", "»", "`"):
        title = title.strip(ch)
    title = title.rstrip(".")
    if not title or len(title) < 2:
        return DEFAULT_CHAT_TITLE
    if len(title) > CHAT_TITLE_MAX_LEN:
        title = title[:CHAT_TITLE_MAX_LEN].rstrip()
    return title or DEFAULT_CHAT_TITLE


async def generate_chat_title(
    client: Any,
    *,
    user_message: str,
    attachment_names: Optional[List[str]] = None,
    model: str,
) -> str:
    """One-shot Responses API call for auto chat title."""
    if not hasattr(client, "responses"):
        raise RuntimeError(
            "OpenAI client has no Responses API; upgrade openai package to >=1.66"
        )
    user_input = build_chat_title_input(user_message, attachment_names)
    response = await client.responses.create(
        model=model,
        input=user_input,
        instructions=CHAT_TITLE_INSTRUCTIONS,
        store=False,
    )
    text = extract_output_text_from_response(response)
    return normalize_chat_title(text)


async def stream_chat_response(
    client: Any,
    *,
    model: str,
    user_input: Any,
    tools: List[Dict[str, Any]],
    enable_web_search: bool,
    previous_response_id: Optional[str] = None,
    prepared: Optional[PreparedAttachments] = None,
    attachment_names: Optional[List[str]] = None,
) -> AsyncIterator[tuple[str, Optional[str]]]:
    """
    Stream text deltas from Responses API.
    Yields (delta_text, None) per chunk; final yield ("", response_id).
    """
    if not hasattr(client, "responses"):
        raise RuntimeError(
            "OpenAI client has no Responses API; upgrade openai package to >=1.66"
        )

    request_kwargs = build_response_request_kwargs(
        model=model,
        user_input=user_input,
        tools=tools,
        enable_web_search=enable_web_search,
        previous_response_id=previous_response_id,
        prepared=prepared,
        attachment_names=attachment_names,
    )
    tool_types = [t.get("type") for t in tools if isinstance(t, dict)]
    logger.debug(
        "Chat Responses request model=%s has_previous=%s store=%s tool_types=%s tool_choice_set=%s",
        model,
        bool(previous_response_id),
        request_kwargs.get("store"),
        tool_types,
        "tool_choice" in request_kwargs,
    )

    stream_method = getattr(client.responses, "stream", None)
    if callable(stream_method):
        async with stream_method(**request_kwargs) as stream:
            async for item in _process_response_stream(stream):
                yield item
        return

    stream = await client.responses.create(**request_kwargs, stream=True)
    async for item in _process_response_stream(stream):
        yield item
