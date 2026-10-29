"""
Обработка задач типа CHAT через OpenAI Responses API (streaming).

Поток:
1. Подготовить input (текст + вложения) и tools (web_search, file_search, code_interpreter)
2. Стримить ответ: каждый text delta → POST /task/chat/stream/chunk на backend
3. По завершении → POST /task/chat/stream/done (сохраняет ChatMessage в БД, thread_id = response.id)
4. Отправить итоговый Kafka-результат
"""
from __future__ import annotations

import asyncio
import io
import logging
import os
import time
from typing import Any, Dict, List, Optional

import httpx

from services.openai_chat import (
    DEFAULT_CHAT_TITLE,
    PreparedAttachments,
    build_user_input,
    coerce_bool,
    resolve_previous_response_id,
    route_attachment_ext,
)

logger = logging.getLogger(__name__)


def _file_ext(filename: str, storage_path: str) -> str:
    for name in (filename, storage_path.rsplit("/", 1)[-1] if storage_path else ""):
        if name and "." in name:
            return f".{name.rsplit('.', 1)[-1].lower()}"
    return ""


class ChatService:
    """OpenAI Responses chat handler with token-level streaming to backend."""

    # ─── HTTP helpers (backend calls) ─────────────────────────────────────────

    @staticmethod
    async def _post(
        http: httpx.AsyncClient,
        backend_base: str,
        path: str,
        payload: dict,
        timeout: float = 5.0,
    ) -> None:
        url = f"{backend_base.rstrip('/')}{path}"
        try:
            resp = await http.post(url, json=payload, timeout=timeout)
            if resp.status_code >= 400:
                logger.warning(
                    "ChatService POST %s HTTP %s: %s",
                    url,
                    resp.status_code,
                    (resp.text or "")[:300],
                )
        except Exception as exc:
            logger.warning("ChatService POST %s failed: %s", url, exc)

    async def _update_chat_thread(
        self, backend_base: str, chat_id: int, thread_id: str
    ) -> None:
        async with httpx.AsyncClient() as http:
            await self._post(
                http,
                backend_base,
                "/task/chat/update-thread",
                {"chat_id": chat_id, "thread_id": thread_id},
                timeout=5.0,
            )

    async def _update_chat_title(
        self, backend_base: str, chat_id: int, title: str
    ) -> None:
        if not title or title == DEFAULT_CHAT_TITLE:
            return
        async with httpx.AsyncClient() as http:
            await self._post(
                http,
                backend_base,
                "/task/chat/update-title",
                {"chat_id": chat_id, "title": title},
                timeout=10.0,
            )

    async def _generate_and_apply_chat_title(
        self,
        *,
        backend_base: str,
        chat_id: int,
        user_message: str,
        attachments: List[dict],
    ) -> None:
        from services.openai_service import openai_service

        if not openai_service.client:
            return
        names = [
            str(a.get("original_filename") or "").strip()
            for a in attachments
            if a.get("original_filename")
        ]
        try:
            title = await openai_service.generate_chat_title(
                user_message=user_message,
                attachment_names=names or None,
            )
            await self._update_chat_title(backend_base, chat_id, title)
            logger.info(
                "ChatService: auto title chat_id=%s title=%r",
                chat_id,
                title[:80] if title else title,
            )
        except Exception as exc:
            logger.warning(
                "ChatService: auto title failed chat_id=%s: %s",
                chat_id,
                exc,
            )

    # ─── File attachment helpers ──────────────────────────────────────────────

    @staticmethod
    async def _download_file(file_url: str) -> bytes:
        async with httpx.AsyncClient(timeout=30.0) as http:
            resp = await http.get(file_url)
            resp.raise_for_status()
            return resp.content

    @staticmethod
    async def _upload_to_openai(client: Any, file_bytes: bytes, filename: str, mime_type: str) -> str:
        resp = await client.files.create(
            file=(filename, io.BytesIO(file_bytes), mime_type),
            purpose="assistants",
        )
        return resp.id

    async def _wait_vector_store_files_ready(
        self,
        client: Any,
        vector_store_id: str,
        vs_file_ids: List[str],
        *,
        timeout_sec: float,
        poll_interval_sec: float,
    ) -> None:
        if not vs_file_ids:
            return
        vs_api = getattr(client, "vector_stores", None) or client.beta.vector_stores
        vs_files = getattr(vs_api, "files", None) or client.beta.vector_stores.files
        pending = set(vs_file_ids)
        deadline = time.monotonic() + timeout_sec

        while pending and time.monotonic() < deadline:
            finished: List[str] = []
            for vf_id in list(pending):
                try:
                    row = await vs_files.retrieve(
                        vector_store_id=vector_store_id,
                        file_id=vf_id,
                    )
                    status = getattr(row, "status", None)
                    if status is None and isinstance(row, dict):
                        status = row.get("status")
                    if status == "completed":
                        finished.append(vf_id)
                    elif status in ("failed", "cancelled"):
                        logger.warning(
                            "ChatService: vector store file %s status=%s",
                            vf_id,
                            status,
                        )
                        finished.append(vf_id)
                except Exception as exc:
                    logger.warning(
                        "ChatService: vector store file poll %s failed: %s",
                        vf_id,
                        exc,
                    )
            for vf_id in finished:
                pending.discard(vf_id)
            if pending:
                await asyncio.sleep(poll_interval_sec)

        if pending:
            logger.warning(
                "ChatService: vector store files not ready before timeout: %s",
                sorted(pending),
            )

    async def _create_file_search_vector_store(
        self, client: Any, file_ids: List[str]
    ) -> str:
        vs_api = getattr(client, "vector_stores", None) or client.beta.vector_stores
        vs = await vs_api.create()
        vs_files = getattr(vs_api, "files", None) or client.beta.vector_stores.files
        vs_file_ids: List[str] = []
        for file_id in file_ids:
            row = await vs_files.create(vector_store_id=vs.id, file_id=file_id)
            vf_id = getattr(row, "id", None)
            if vf_id is None and isinstance(row, dict):
                vf_id = row.get("id")
            if vf_id:
                vs_file_ids.append(str(vf_id))

        timeout_sec = float(os.getenv("CHAT_VECTOR_STORE_POLL_TIMEOUT_SEC", "60"))
        poll_interval_sec = float(
            os.getenv("CHAT_VECTOR_STORE_POLL_INTERVAL_SEC", "1.5")
        )
        await self._wait_vector_store_files_ready(
            client,
            vs.id,
            vs_file_ids,
            timeout_sec=timeout_sec,
            poll_interval_sec=poll_interval_sec,
        )
        return vs.id

    async def _prepare_attachments(
        self,
        client: Any,
        attachments: List[dict],
        *,
        backend_base: str,
        user_id: str,
    ) -> PreparedAttachments:
        prepared = PreparedAttachments()
        bb = backend_base.rstrip("/")

        for att in attachments:
            file_url = att.get("file_url")
            kind = att.get("kind", "document")
            original_filename = att.get("original_filename", "file")
            mime_type = att.get("mime_type", "application/octet-stream")
            storage_path = att.get("storage_path") or ""
            ext = _file_ext(original_filename, storage_path)
            route = route_attachment_ext(ext, kind)

            download_urls: List[str] = []
            if file_url:
                download_urls.append(file_url)
            if storage_path and bb and user_id:
                built = f"{bb}/storage/{user_id}/{storage_path}"
                if built not in download_urls:
                    download_urls.append(built)

            if not download_urls:
                logger.warning("ChatService: attachment missing file_url/storage_path, skipping")
                continue

            file_bytes: Optional[bytes] = None
            last_exc: Optional[Exception] = None
            for url in download_urls:
                try:
                    file_bytes = await self._download_file(url)
                    break
                except Exception as exc:
                    last_exc = exc
            if file_bytes is None:
                logger.warning(
                    "ChatService: failed to download attachment %s (tried %s): %s",
                    original_filename,
                    download_urls,
                    last_exc,
                )
                continue

            try:
                file_id = await self._upload_to_openai(
                    client, file_bytes, original_filename, mime_type
                )
                logger.info(
                    "Uploaded attachment %s → OpenAI file_id=%s", original_filename, file_id
                )
            except Exception as exc:
                logger.warning(
                    "ChatService: failed to upload attachment %s: %s", original_filename, exc
                )
                continue

            if route == "image":
                prepared.image_file_ids.append(file_id)
                logger.info("ChatService: %s → image", original_filename)
            elif route == "input_file":
                prepared.input_file_ids.append(file_id)
                logger.info("ChatService: %s → input_file", original_filename)
            elif route == "code_interpreter":
                prepared.code_interpreter_file_ids.append(file_id)
                logger.info("ChatService: %s → code_interpreter", original_filename)
            else:
                prepared.file_search_file_ids.append(file_id)
                logger.info("ChatService: %s → file_search", original_filename)

        if attachments and not (
            prepared.image_file_ids
            or prepared.input_file_ids
            or prepared.code_interpreter_file_ids
            or prepared.file_search_file_ids
        ):
            logger.error(
                "ChatService: all %s attachment(s) failed to download/upload",
                len(attachments),
            )

        return prepared

    # ─── Main handler ─────────────────────────────────────────────────────────

    async def handle_chat_task(
        self, message: Dict[str, Any], *, backend_base: str
    ) -> None:
        from services.openai_service import openai_service
        from services.kafka_service import kafka_service

        task_id = str(message.get("task_id", ""))
        user_id = str(message.get("user_id", ""))
        chat_id_raw = message.get("chat_id")
        user_message = str(message.get("message", "")).strip()
        stored_conversation_id: Optional[str] = message.get("thread_id") or None
        if stored_conversation_id == "":
            stored_conversation_id = None
        attachments: List[dict] = message.get("attachments") or []
        enable_web_search = coerce_bool(message.get("enable_web_search", False))
        generate_title = coerce_bool(message.get("generate_title", False))

        bb = backend_base.rstrip("/")

        if not chat_id_raw:
            logger.error("ChatService: missing chat_id task_id=%s", task_id)
            return

        chat_id = int(chat_id_raw)

        try:
            async with httpx.AsyncClient(timeout=5.0) as http:
                await http.post(
                    f"{bb}/task/update",
                    json={"task_id": int(task_id), "status": "pending", "thread_id": None},
                )
        except Exception as exc:
            logger.debug("ChatService: /task/update pending failed: %s", exc)

        if not openai_service.client:
            err = "OpenAI client not initialized"
            logger.error("ChatService: %s", err)
            await self._signal_error(bb, task_id, user_id, chat_id, err)
            await kafka_service.send_gpt_result(
                {"task_id": task_id, "user_id": user_id, "chat_id": chat_id, "error": err},
                backend_base=bb,
                notify_backend_error=False,
            )
            return

        try:
            client = openai_service.client
            previous_response_id = resolve_previous_response_id(stored_conversation_id)

            prepared = PreparedAttachments()
            if attachments:
                prepared = await self._prepare_attachments(
                    client, attachments, backend_base=bb, user_id=user_id
                )

            vector_store_id: Optional[str] = None
            if prepared.needs_file_search:
                vector_store_id = await self._create_file_search_vector_store(
                    client, prepared.file_search_file_ids
                )

            continue_ci = bool(previous_response_id)
            tools = openai_service.build_chat_tools(
                enable_web_search=enable_web_search,
                prepared=prepared,
                vector_store_id=vector_store_id,
                continue_code_interpreter=continue_ci,
            )
            tool_types = [t.get("type") for t in tools if isinstance(t, dict)]
            prev_suffix = (
                str(previous_response_id)[-6:]
                if previous_response_id
                else None
            )
            logger.info(
                "ChatService: task_id=%s chat_id=%s enable_web_search=%s "
                "has_previous=%s prev_suffix=%s attachments_count=%s "
                "continue_ci=%s tool_types=%s",
                task_id,
                chat_id,
                enable_web_search,
                bool(previous_response_id),
                prev_suffix,
                len(attachments),
                continue_ci,
                tool_types,
            )
            user_input = build_user_input(user_message, prepared)
            attachment_names = [
                str(a.get("original_filename") or "").strip()
                for a in attachments
                if a.get("original_filename")
            ]

            full_text = ""
            response_id: Optional[str] = None
            t0 = time.perf_counter()

            async with httpx.AsyncClient() as http:
                async for delta, maybe_response_id in openai_service.stream_chat_response(
                    user_input=user_input,
                    tools=tools,
                    enable_web_search=enable_web_search,
                    previous_response_id=previous_response_id,
                    prepared=prepared,
                    attachment_names=attachment_names or None,
                ):
                    if maybe_response_id:
                        response_id = maybe_response_id
                    if not delta:
                        continue
                    full_text += delta
                    # Последовательная отправка: параллельные POST завершались вразнобой.
                    await self._post(
                        http,
                        bb,
                        "/task/chat/stream/chunk",
                        {
                            "task_id": int(task_id),
                            "user_id": int(user_id),
                            "chat_id": chat_id,
                            "chunk": delta,
                        },
                    )

                if response_id:
                    asyncio.create_task(
                        self._update_chat_thread(bb, chat_id, response_id)
                    )

                await self._post(
                    http,
                    bb,
                    "/task/chat/stream/done",
                    {
                        "task_id": int(task_id),
                        "user_id": int(user_id),
                        "chat_id": chat_id,
                        "content": full_text,
                        "thread_id": response_id or previous_response_id,
                    },
                    timeout=10.0,
                )

            gpt_ms = int((time.perf_counter() - t0) * 1000)
            logger.info(
                "ChatService: task_id=%s finished response_id=%s content_chars=%s",
                task_id,
                response_id,
                len(full_text),
            )

            await kafka_service.send_gpt_result(
                {
                    "task_id": task_id,
                    "user_id": user_id,
                    "chat_id": chat_id,
                    "chat_text": full_text,
                    "thread_id": response_id or previous_response_id or "",
                    "gpt_ms": gpt_ms,
                },
                backend_base=bb,
                notify_backend_error=False,
            )

            if generate_title:
                asyncio.create_task(
                    self._generate_and_apply_chat_title(
                        backend_base=bb,
                        chat_id=chat_id,
                        user_message=user_message,
                        attachments=attachments,
                    )
                )

        except Exception as exc:
            logger.error(
                "ChatService: error task_id=%s: %s", task_id, exc, exc_info=True
            )
            err_msg = f"Ошибка чата: {str(exc)[:300]}"
            await self._signal_error(bb, task_id, user_id, chat_id, err_msg)
            await kafka_service.send_gpt_result(
                {
                    "task_id": task_id,
                    "user_id": user_id,
                    "chat_id": chat_id,
                    "error": err_msg,
                },
                backend_base=bb,
                notify_backend_error=False,
            )

    async def _signal_error(
        self,
        backend_base: str,
        task_id: str,
        user_id: str,
        chat_id: int,
        error: str,
    ) -> None:
        async with httpx.AsyncClient() as http:
            await self._post(
                http,
                backend_base,
                "/task/chat/stream/done",
                {
                    "task_id": int(task_id),
                    "user_id": int(user_id),
                    "chat_id": chat_id,
                    "error": error,
                },
                timeout=5.0,
            )


chat_service = ChatService()
