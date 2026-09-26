"""
Сервис для работы с OpenAI Thread API (backend: без Atlas; только промпт/чат).
"""
import json
import os
import openai
from typing import Dict, Any, Optional, List, Tuple
import logging
import httpx
import asyncio
import time

from task_types import TaskType, DETERMINISTIC_EDIT_SPEC_TASK_TYPES
from atlas_model_configs import (
    improve_options_include_default_negative_prompt,
    improve_options_merge_qwen_style_defaults,
)
from services.openai_config import OpenAISettings, get_openai_settings

logger = logging.getLogger(__name__)

from config import settings


def _default_backend_api_base() -> str:
    return (
        os.getenv("FASTAPI_BACKEND_URL")
        or os.getenv("BACKEND_URL")
        or settings.BACKEND_URL
        or "http://127.0.0.1:8000"
    ).rstrip("/")


class OpenAIService:
    """Сервис для работы с OpenAI Thread API"""
    
    def __init__(self):
        self._settings: OpenAISettings = get_openai_settings()
        self.api_key = self._settings.api_key
        self.default_model = self._settings.default_model
        self.chat_model = self._settings.chat_model
        self.chat_title_model = self._settings.chat_title_model
        self.default_max_tokens = self._settings.default_max_tokens
        self.default_temperature = self._settings.default_temperature
        self.client: Optional[openai.AsyncOpenAI] = None
        self.http_client: Optional[httpx.AsyncClient] = None
        self.backend_url = _default_backend_api_base()
        # Хранилище thread_id по task_id (fallback кеш, основной источник - backend)
        self._threads: Dict[str, str] = {}  # {task_id: thread_id}
        # Хранилище assistant_id (один для всех)
        self._assistant_id: Optional[str] = None
        # Lightweight "state memory": last successful EditSpec per task_id and task_type.
        # This helps prevent regressions across iterative edits (e.g., pose reverting).
        self._last_edit_spec: Dict[str, Dict[str, Dict[str, Any]]] = {}
    
    def _get_v2_headers(self) -> Dict[str, str]:
        """Возвращает заголовки для v2 Assistants API"""
        return {"OpenAI-Beta": "assistants=v2"}

    async def initialize(self):
        """Инициализация клиента OpenAI"""
        if not self.api_key:
            logger.warning("OPENAI_API_KEY не установлен")
            return
        
        try:
            USE_PROXY = False  # ← ИЗМЕНИТЬ НА True ПОСЛЕ ПЕРЕЗАПУСКА ПРОКСИ
            
            # Заголовок для v2 Assistants API
            headers = {
                "OpenAI-Beta": "assistants=v2"
            }
            
            if USE_PROXY and self._settings.openai_proxy:
                http_client = httpx.AsyncClient(
                    proxy=self._settings.openai_proxy,
                    timeout=httpx.Timeout(20.0),
                    trust_env=False,
                    headers=headers
                )
                op = self._settings.openai_proxy
                logger.info(f"Прокси настроен для OpenAI: {op.split('@')[-1] if '@' in op else op}")
            else:
                if USE_PROXY:
                    logger.warning("⚠️ ПРОКСИ ВРЕМЕННО ОТКЛЮЧЕН - используется прямое соединение к OpenAI")
                http_client = httpx.AsyncClient(
                    timeout=httpx.Timeout(30.0),
                    trust_env=False,
                    headers=headers
                )
            
            self.http_client = http_client
            
            self.client = openai.AsyncOpenAI(
                api_key=self.api_key,
                http_client=self.http_client,
                timeout=30.0,
                max_retries=1,
                default_headers=headers
            )
            
            logger.info(f"OpenAI клиент инициализирован {'(с прокси)' if self._settings.openai_proxy else ''}")
            
            # Создаем Assistant для работы с Thread API
            await self._ensure_assistant()
        except Exception as e:
            logger.error(f"Ошибка инициализации OpenAI: {e}")
    
    async def _ensure_assistant(self):
        """Создает Assistant для работы с Thread API, если его еще нет"""
        if not self.client:
            return
        
        v2_headers = self._get_v2_headers()
        
        if self._assistant_id:
            try:
                # Проверяем, что assistant все еще существует
                await self.client.beta.assistants.retrieve(
                    self._assistant_id,
                    extra_headers=v2_headers
                )
                return
            except Exception as e:
                logger.warning(f"Assistant {self._assistant_id} не найден, создаем новый: {e}")
                self._assistant_id = None
        
        try:
            assistant = await self.client.beta.assistants.create(
                name="ChatGPT Prompt Generator",
                instructions=(
                    "You are a helpful assistant for a marketplace media editing pipeline.\n"
                    "You generate STRICT JSON edit specifications (no prose, no markdown) that will be used to build final prompts.\n"
                    "Never output any text outside a single JSON object.\n"
                    "Top priorities: preserve existing text/logos/labels exactly; preserve identity; preserve product design unless explicitly requested."
                ),
                model=self.default_model,
                extra_headers=v2_headers
            )
            self._assistant_id = assistant.id
            logger.info(f"Создан Assistant {self._assistant_id}")
        except Exception as e:
            logger.error(f"Ошибка создания Assistant: {e}")
    
    async def _update_task_in_backend(
        self,
        task_id: str,
        thread_id: Optional[str],
        status: str = "pending",
        backend_api_base: Optional[str] = None,
    ) -> bool:
        """
        Обновляет задачу в backend через API /update
        
        Args:
            task_id: ID задачи
            thread_id: thread_id от OpenAI (опционально, None — только обновить статус)
            status: Статус задачи (по умолчанию "pending")
        
        Returns:
            True если успешно, False если ошибка
        """
        try:
            base = (backend_api_base or self.backend_url).rstrip("/")
            update_url = f"{base}/task/update"
            # Преобразуем task_id в int (может быть строкой)
            try:
                task_id_int = int(task_id)
            except (ValueError, TypeError):
                logger.error(f"Некорректный task_id: {task_id}, не может быть преобразован в int")
                return False
            
            payload = {
                "task_id": task_id_int,
                "status": status,
                "thread_id": thread_id
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(update_url, json=payload)
                if response.status_code == 200:
                    logger.info(f"Задача {task_id} обновлена в backend: thread_id={thread_id}, status={status}")
                    return True
                else:
                    logger.warning(f"Не удалось обновить задачу {task_id} в backend: статус {response.status_code}, ответ: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Ошибка при обновлении задачи {task_id} в backend: {e}", exc_info=True)
            return False
    
    def _update_task_in_backend_async(
        self,
        task_id: str,
        thread_id: Optional[str],
        status: str = "pending",
        backend_api_base: Optional[str] = None,
    ) -> None:
        """
        Асинхронно обновляет задачу в backend (fire-and-forget, не ждем завершения)
        
        Args:
            task_id: ID задачи
            thread_id: thread_id от OpenAI (опционально, None — только обновить статус)
            status: Статус задачи (по умолчанию "pending")
        """
        def handle_result(task: asyncio.Task) -> None:
            """Обработка результата фоновой задачи"""
            try:
                task.result()  # Проверяем, не было ли исключения
            except Exception as e:
                logger.error(f"Ошибка в фоновом обновлении задачи {task_id} в backend: {e}", exc_info=True)
        
        # Создаем задачу в фоне
        task = asyncio.create_task(
            self._update_task_in_backend(
                task_id, thread_id, status, backend_api_base=backend_api_base
            )
        )
        task.add_done_callback(handle_result)
    
    async def _send_error_to_kafka(
        self,
        task_id: str,
        user_id: str,
        message: str,
        error_message: str,
        backend_api_base: Optional[str] = None,
    ) -> None:
        """
        Публикует ошибку в топик results (Kafka).
        """
        from services.kafka_service import kafka_service

        thread_id = self._threads.get(task_id, "")
        error_response = {
            "task_id": task_id,
            "user_id": user_id,
            "thread_id": thread_id,
            "prompt": message,
            "error": error_message
        }
        bb = (backend_api_base or self.backend_url).rstrip("/")
        await kafka_service.send_gpt_result(error_response, backend_base=bb)
    
    async def cleanup(self):
        """Очистка ресурсов"""
        if self.client:
            await self.client.close()
        if self.http_client:
            await self.http_client.aclose()
        self._threads.clear()
    
    async def get_or_create_thread(
        self,
        task_id: str,
        thread_id: Optional[str] = None,
        backend_api_base: Optional[str] = None,
    ) -> str:
        """
        Получает существующий thread_id или создает новый
        thread_id теперь хранится в backend, а не в локальном кеше
        
        Args:
            task_id: ID задачи
            thread_id: thread_id из backend (если передан, используется он)
        
        Returns:
            thread_id
        """
        if not self.client:
            raise ValueError("OpenAI клиент не инициализирован")
        
        v2_headers = self._get_v2_headers()
        
        # Если thread_id пришел из backend, проверяем его и используем
        if thread_id:
            try:
                # Проверяем, что thread все еще существует в OpenAI
                await self.client.beta.threads.retrieve(
                    thread_id,
                    extra_headers=v2_headers
                )
                logger.info(f"Используется thread_id из backend {thread_id} для task_id {task_id}")
                # Обновляем локальный кеш для быстрого доступа
                self._threads[task_id] = thread_id
                return thread_id
            except Exception as e:
                logger.warning(f"Thread {thread_id} из backend не найден в OpenAI, создаем новый: {e}")
        
        # Проверяем локальный кеш (fallback)
        if task_id in self._threads:
            thread_id = self._threads[task_id]
            try:
                # Проверяем, что thread все еще существует
                await self.client.beta.threads.retrieve(
                    thread_id,
                    extra_headers=v2_headers
                )
                logger.info(f"Используется thread из локального кеша {thread_id} для task_id {task_id}")
                return thread_id
            except Exception as e:
                logger.warning(f"Thread {thread_id} из кеша не найден, создаем новый: {e}")
                # Удаляем из кеша и создаем новый
                del self._threads[task_id]
        
        # Создаем новый thread
        try:
            thread = await self.client.beta.threads.create(
                extra_headers=v2_headers
            )
            thread_id = thread.id
            
            # Отправляем thread_id в backend вместо сохранения в локальный кеш (асинхронно, не ждем)
            self._update_task_in_backend_async(
                task_id, thread_id, status="pending", backend_api_base=backend_api_base
            )
            
            # Обновляем локальный кеш для быстрого доступа (fallback)
            self._threads[task_id] = thread_id
            
            logger.info(f"Создан новый thread {thread_id} для task_id {task_id} и отправлен в backend")
            return thread_id
        except Exception as e:
            logger.error(f"Ошибка создания thread: {e}")
            raise
    
    async def delete_thread(self, task_id: str) -> bool:
        """
        Удаляет thread из кеша и опционально из OpenAI.
        Повторный вызов для того же task_id безопасен (идемпотентность).
        """
        task_id = str(task_id)
        # Сразу забираем из кеша, чтобы параллельные DELETE не ловили KeyError после await.
        thread_id = self._threads.pop(task_id, None)
        if thread_id is None:
            logger.info(
                f"Thread для task_id {task_id} не найден в кеше (уже удалён или не создавался)"
            )
            return False

        if self.client:
            try:
                v2_headers = self._get_v2_headers()
                await self.client.beta.threads.delete(
                    thread_id,
                    extra_headers=v2_headers,
                )
                logger.info(
                    f"Thread {thread_id} удален из OpenAI для task_id {task_id}"
                )
            except Exception as e:
                logger.warning(
                    f"Не удалось удалить thread {thread_id} из OpenAI: {e}"
                )

        logger.info(f"Thread {thread_id} снят с учёта для task_id {task_id}")
        return True

    async def get_previous_user_messages(self, thread_id: str) -> List[str]:
        """
        Получает все предыдущие сообщения пользователя из thread в хронологическом порядке
        
        Args:
            thread_id: ID thread
            
        Returns:
            Список текстов сообщений пользователя (в хронологическом порядке)
        """
        if not self.client:
            return []
        
        previous_messages = []
        try:
            v2_headers = self._get_v2_headers()
            all_messages = await self.client.beta.threads.messages.list(
                thread_id=thread_id,
                limit=100,  # Получаем последние 100 сообщений
                extra_headers=v2_headers
            )
            
            # Фильтруем только сообщения пользователя (не ассистента)
            # Сообщения приходят в обратном порядке (новые первыми), переворачиваем
            for msg in reversed(all_messages.data):
                if msg.role == "user" and msg.content:
                    for content_item in msg.content:
                        if hasattr(content_item, "text") and content_item.text:
                            previous_messages.append(content_item.text.value)
                            break
        except Exception as e:
            logger.warning(f"Не удалось получить предыдущие сообщения: {e}")
        
        return previous_messages

    def _normalize_improve_prompt(self, improve_prompt: Optional[bool]) -> bool:
        return True if improve_prompt is None else bool(improve_prompt)

    def _remember_edit_spec(self, task_id: str, task_type: str, spec: Optional[Dict[str, Any]]) -> None:
        if spec:
            self._last_edit_spec.setdefault(task_id, {})[task_type] = spec

    def _remember_edit_spec_from_raw(
        self,
        task_id: str,
        task_type: str,
        raw_text: str,
        prompt_service: Any,
    ) -> None:
        spec, err = prompt_service.parse_edit_spec(task_type=task_type, raw_text=raw_text)
        if spec and not err:
            self._remember_edit_spec(task_id, task_type, spec)

    def _merge_improve_quality_options(
        self,
        options: Optional[Dict[str, Any]],
        ai_model: Optional[str],
        prompt_service: Any,
        *,
        include_seed_and_format: bool = False,
    ) -> Optional[Dict[str, Any]]:
        merged: Dict[str, Any] = dict(options) if isinstance(options, dict) else {}
        if include_seed_and_format:
            merged.setdefault("output_format", "png")
        if improve_options_merge_qwen_style_defaults(ai_model):
            merged.setdefault("prompt_extend", False)
            merged.setdefault("num_images", 1)
            if include_seed_and_format:
                merged.setdefault("seed", 1)
        if improve_options_include_default_negative_prompt(ai_model):
            merged.setdefault(
                "negative_prompt",
                prompt_service.IMPROVE_QUALITY_NEGATIVE_PROMPT[:500],
            )
        return merged or None

    def _make_task_data(
        self,
        task_id: str,
        user_id: str,
        thread_id: str,
        task_type: str,
        prompt: str,
        generation_id: Optional[str],
        improve_prompt: bool,
        backend_api_base: str,
    ) -> Dict[str, Any]:
        """Словарь с полями, совместимыми с proxy TaskData (gpt_fragment = prompt)."""
        return {
            "task_id": task_id,
            "user_id": user_id,
            "thread_id": thread_id,
            "task_type": task_type,
            "prompt": prompt,
            "generation_id": generation_id,
            "improve_prompt": improve_prompt,
            "backend_api_base": backend_api_base,
        }

    def _build_simple_mode_fragment_and_prompt(
        self,
        task_type: str,
        message: str,
        options: Optional[Dict[str, Any]],
        ai_model: Optional[str],
        prompt_service: Any,
    ) -> tuple[str, str, Dict[str, Any]]:
        opts = options if isinstance(options, dict) else None
        spec = prompt_service.build_simple_mode_spec(task_type, message, opts)
        fragment_json = json.dumps(spec, ensure_ascii=False)
        final_prompt = prompt_service.build_final_prompt(
            task_type,
            fragment_json,
            improve_prompt=True,
            ai_model=ai_model,
        )
        return fragment_json, final_prompt, spec

    async def _run_deterministic_edit_spec(
        self,
        task_id: str,
        user_id: str,
        message: str,
        task_type: str,
        thread_id: Optional[str],
        ai_model: Optional[str],
        options: Optional[Dict[str, Any]],
        generation_id: Optional[str],
        images: Optional[List[str]],
        end_image: Optional[str],
        backend_api_base: str,
        *,
        from_assistants_fallback: bool = False,
    ) -> Dict[str, Any]:
        """
        Шаблонный EditSpec без Assistants при improve_prompt=False или skip_gpt=True (см. generate_prompt).
        """
        bb = backend_api_base.rstrip("/")
        try:
            from services.prompt_service import prompt_service

            fragment_json, final_prompt, spec = self._build_simple_mode_fragment_and_prompt(
                task_type,
                message,
                options,
                ai_model,
                prompt_service,
            )
            self._remember_edit_spec(task_id, task_type, spec)
            tid = thread_id or ""
            self._make_task_data(
                task_id=task_id,
                user_id=user_id,
                thread_id=tid,
                task_type=task_type,
                prompt=fragment_json.strip(),
                generation_id=generation_id,
                improve_prompt=False,
                backend_api_base=bb,
            )
            return {
                "task_id": task_id,
                "user_id": user_id,
                "thread_id": tid,
                "prompt": final_prompt.strip(),
                "gpt_fragment": fragment_json.strip(),
                "gpt_ms": 0,
            }
        except Exception as e:
            err_label = (
                "simple_mode_spec (fallback after Assistants failure) → Atlas"
                if from_assistants_fallback
                else "simple_mode_spec (no GPT) → Atlas"
            )
            logger.error(f"{err_label}: {e}", exc_info=True)
            err_msg = str(e)
            await self._send_error_to_kafka(
                task_id, user_id, message, err_msg, backend_api_base=bb
            )
            return {
                "task_id": task_id,
                "user_id": user_id,
                "thread_id": thread_id or "",
                "prompt": message,
                "gpt_ms": 0,
            }

    async def _assistants_pipeline_until_atlas(
        self,
        *,
        task_id: str,
        user_id: str,
        message: str,
        task_type: str,
        images: Optional[List[str]],
        is_edit: bool,
        thread_id: Optional[str],
        ai_model: Optional[str],
        options: Optional[Dict[str, Any]],
        generation_id: Optional[str],
        imp_flag: bool,
        backend_api_base: str,
        prebuilt_gpt_instructions: Optional[str] = None,
    ) -> Tuple[str, str, Dict[str, Any], int]:
        """
        Threads → run → фрагмент GPT → final_prompt → task_data dict. Без Atlas.
        """
        bb = backend_api_base.rstrip("/")
        t0 = time.perf_counter()

        thread_id = await self.get_or_create_thread(
            task_id, thread_id=thread_id, backend_api_base=backend_api_base
        )

        previous_messages = await self.get_previous_user_messages(thread_id)
        all_user_messages = previous_messages + [message]

        from services.prompt_service import prompt_service

        previous_spec = None
        if is_edit:
            previous_spec = self._last_edit_spec.get(task_id, {}).get(task_type)

        prebuilt = (prebuilt_gpt_instructions or "").strip()
        if not previous_messages and prebuilt:
            instructions = prebuilt
        elif len(all_user_messages) > 1:
            previous_list = "\n".join([f"{i+1}. {msg}" for i, msg in enumerate(previous_messages)])
            last_message = message
            combined_context = (
                "CONTEXT (previous user requests, for background and constraints):\n"
                f"{previous_list if previous_list else '(none)'}\n\n"
                "LATEST USER REQUEST (highest priority, focus on this):\n"
                f"{last_message}"
            )
            instructions = prompt_service.build_gpt_instructions(
                task_type,
                combined_context,
                is_edit=is_edit,
                previous_spec=previous_spec,
            )
        else:
            instructions = prompt_service.build_gpt_instructions(
                task_type,
                message,
                is_edit=is_edit,
                previous_spec=previous_spec,
            )

        v2_headers = self._get_v2_headers()
        message_content: Any = message

        await self.client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=message_content,
            extra_headers=v2_headers,
        )

        await self._ensure_assistant()

        if not self._assistant_id:
            raise Exception("Assistant не создан")

        run = await self.client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=self._assistant_id,
            instructions=instructions,
            extra_headers=v2_headers,
        )

        max_wait_time = 30
        wait_interval = 0.5
        elapsed = 0

        while elapsed < max_wait_time:
            run_status = await self.client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id,
                extra_headers=v2_headers,
            )

            if run_status.status == "completed":
                break
            if run_status.status in ["failed", "cancelled", "expired"]:
                le = getattr(run_status, "last_error", None)
                error_msg = (
                    getattr(le, "message", None) or str(le) if le is not None else None
                ) or "Unknown error"
                logger.error(f"Run failed: {error_msg}")
                raise Exception(f"Run failed: {error_msg}")

            await asyncio.sleep(wait_interval)
            elapsed += wait_interval

        if elapsed >= max_wait_time:
            raise Exception("Timeout waiting for run completion")

        messages = await self.client.beta.threads.messages.list(
            thread_id=thread_id,
            limit=1,
            extra_headers=v2_headers,
        )

        if not messages.data or len(messages.data) == 0:
            raise Exception("No response from assistant")

        assistant_message = messages.data[0]
        if assistant_message.role != "assistant":
            raise Exception("Last message is not from assistant")

        gpt_fragment = ""
        if assistant_message.content:
            for content_item in assistant_message.content:
                if hasattr(content_item, "text") and content_item.text:
                    gpt_fragment = content_item.text.value
                    break

        if not gpt_fragment:
            gpt_fragment = message
            logger.warning("Не удалось извлечь фрагмент промпта из ответа, используем оригинальное сообщение")

        self._remember_edit_spec_from_raw(task_id, task_type, gpt_fragment, prompt_service)

        final_prompt = prompt_service.build_final_prompt(
            task_type,
            gpt_fragment,
            improve_prompt=imp_flag,
            ai_model=ai_model,
        )

        if self._settings.is_prompt_log_enable == "1":
            logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
            os.makedirs(logs_dir, exist_ok=True)
            log_file_path = os.path.join(logs_dir, f"task_prompt_{task_id}.log")
            file_exists = os.path.exists(log_file_path)
            with open(log_file_path, "a", encoding="utf-8") as f:
                if file_exists:
                    f.write("\n" + "=" * 80 + "\n")
                else:
                    f.write("Final prompt: " + final_prompt + "\n\n")
                f.write("Message: " + message + "\n" + "GPT fragment (EditSpec JSON expected): " + gpt_fragment)

        logger.info(
            f"Промпт сгенерирован для task_id {task_id}, thread_id {thread_id}, "
            f"task_type {task_type}, prompt: {final_prompt.strip()}"
        )

        task_data = self._make_task_data(
            task_id=task_id,
            user_id=user_id,
            thread_id=thread_id,
            task_type=task_type,
            prompt=gpt_fragment.strip(),
            generation_id=generation_id,
            improve_prompt=imp_flag,
            backend_api_base=bb,
        )

        gpt_ms = int((time.perf_counter() - t0) * 1000)
        return thread_id, final_prompt, task_data, gpt_ms

    async def generate_prompt(
        self,
        task_id: str,
        user_id: str,
        message: str,
        task_type: str,
        images: Optional[List[str]] = None,
        is_edit: bool = False,
        thread_id: Optional[str] = None,
        ai_model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        improve_prompt: bool = True,
        end_image: Optional[str] = None,
        generation_id: Optional[str] = None,
        skip_gpt: bool = False,
        backend_api_base: Optional[str] = None,
        gpt_instructions: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Генерирует промпт для edit_image, video_preview или improve_quality.
        Включает всю логику обработки: создание thread, обработка через OpenAI, получение ответа.

        Args:
            gpt_instructions: при первом user-сообщении в thread вместо build_gpt_instructions на proxy
                (см. prompt_jobs с backend). При multi-turn в thread игнорируется.
            task_id: ID задачи
            user_id: ID пользователя
            message: Сообщение пользователя
            task_type: TaskType.EDIT_IMAGE, TaskType.VIDEO_PREVIEW, TaskType.REFERENCE_VIDEO, TaskType.IMPROVE_QUALITY, TaskType.TEXT_IMAGE или TaskType.TEXT_VIDEO
            images: Список путей к изображениям (относительные пути от storage_dir пользователя)
            is_edit: Флаг, указывающий, что это режим редактирования
            thread_id: thread_id из backend (если передан, используется он)
            skip_gpt: при True — без Assistants: для IMPROVE_QUALITY — шаблонный фрагмент; для edit_image / video_preview / reference_video / text_image / text_video —
            тот же детерминированный EditSpec, что и при improve_prompt=False.
            improve_prompt: при False — без Assistants для edit_image / video_preview / reference_video и (отдельно) для improve_quality
            — шаблоны в prompt_service (build_simple_mode_spec или build_improve_quality_skip_gpt_fragment).
            При True, если включён OPENAI_FALLBACK_SIMPLE_ON_ASSISTANTS_ERROR и Assistants падает — тот же шаблон для типов из DETERMINISTIC_EDIT_SPEC_TASK_TYPES.
        
        Returns:
            Словарь с результатом обработки:
            {
                "task_id": str,
                "user_id": str,
                "thread_id": str,
                "prompt": str  # Финальный промпт на английском
            }
        """
        bb = (backend_api_base or self.backend_url).rstrip("/")
        imp_flag = self._normalize_improve_prompt(improve_prompt)

        improve_quality_template = task_type == TaskType.IMPROVE_QUALITY and (bool(skip_gpt) or not imp_flag)
        if improve_quality_template:
            from services.prompt_service import prompt_service

            frag = prompt_service.build_improve_quality_skip_gpt_fragment(message)
            try:
                final_prompt = prompt_service.build_final_prompt(
                    task_type,
                    frag,
                    improve_prompt=imp_flag,
                    ai_model=ai_model,
                )
                self._remember_edit_spec_from_raw(task_id, task_type, frag, prompt_service)
                skip_options = self._merge_improve_quality_options(
                    options,
                    ai_model,
                    prompt_service,
                    include_seed_and_format=True,
                )
                tid = thread_id or ""
                self._make_task_data(
                    task_id=task_id,
                    user_id=user_id,
                    thread_id=tid,
                    task_type=task_type,
                    prompt=frag,
                    generation_id=generation_id,
                    improve_prompt=imp_flag,
                    backend_api_base=bb,
                )
                return {
                    "task_id": task_id,
                    "user_id": user_id,
                    "thread_id": tid,
                    "prompt": final_prompt.strip(),
                    "gpt_fragment": frag,
                    "options": skip_options,
                    "gpt_ms": 0,
                }
            except Exception as e:
                logger.error(f"improve_quality template (skip_gpt or improve_prompt=False): {e}", exc_info=True)
                err_msg = str(e)
                await self._send_error_to_kafka(
                    task_id, user_id, message or frag, err_msg, backend_api_base=bb
                )
                return {
                    "task_id": task_id,
                    "user_id": user_id,
                    "thread_id": thread_id or "",
                    "prompt": message or frag,
                    "gpt_ms": 0,
                }

        if task_type in DETERMINISTIC_EDIT_SPEC_TASK_TYPES and (
            not imp_flag or bool(skip_gpt)
        ):
            return await self._run_deterministic_edit_spec(
                task_id=task_id,
                user_id=user_id,
                message=message,
                task_type=task_type,
                thread_id=thread_id,
                ai_model=ai_model,
                options=options,
                generation_id=generation_id,
                images=images,
                end_image=end_image,
                backend_api_base=bb,
            )

        if not self.client:
            logger.warning("OpenAI клиент не инициализирован")
            return {
                "task_id": task_id,
                "user_id": user_id,
                "thread_id": "",
                "prompt": message,
                "gpt_fragment": message,
                "gpt_ms": 0,
            }
        
        try:
            # Проверяем режим симуляции
            if self._settings.mock_openai:
                logger.info(f"[MOCK] Симуляция GPT запроса для task_id={task_id}, task_type={task_type}")
                # Генерируем мок thread_id если его нет
                if not thread_id:
                    thread_id = f"mock_thread_{task_id}"
                    self._update_task_in_backend_async(
                        task_id, thread_id, status="pending", backend_api_base=backend_api_base
                    )

                from services.prompt_service import prompt_service
                if task_type in DETERMINISTIC_EDIT_SPEC_TASK_TYPES and (
                    not imp_flag or bool(skip_gpt)
                ):
                    frag, final_prompt, _ = self._build_simple_mode_fragment_and_prompt(
                        task_type,
                        message,
                        options,
                        ai_model,
                        prompt_service,
                    )
                    logger.info(
                        f"[MOCK] deterministic template spec для task_id={task_id}, task_type={task_type}"
                    )
                    return {
                        "task_id": task_id,
                        "user_id": user_id,
                        "thread_id": thread_id,
                        "prompt": final_prompt.strip(),
                        "gpt_fragment": frag,
                        "gpt_ms": 0,
                    }

                mock_gpt_fragment = f"Mock GPT response for: {message[:100]}"
                final_prompt = prompt_service.build_final_prompt(
                    task_type,
                    mock_gpt_fragment,
                    improve_prompt=imp_flag,
                    ai_model=ai_model,
                )

                logger.info(f"[MOCK] Сгенерирован мок-промпт для task_id={task_id}")

                return {
                    "task_id": task_id,
                    "user_id": user_id,
                    "thread_id": thread_id,
                    "prompt": final_prompt.strip(),
                    "gpt_fragment": mock_gpt_fragment,
                    "gpt_ms": 0,
                }

            use_deterministic_assistants_fallback = (
                self._settings.openai_fallback_simple_on_assistants_error
                and imp_flag
                and task_type in DETERMINISTIC_EDIT_SPEC_TASK_TYPES
            )

            try:
                thread_id, final_prompt, task_data, gpt_ms = await self._assistants_pipeline_until_atlas(
                    task_id=task_id,
                    user_id=user_id,
                    message=message,
                    task_type=task_type,
                    images=images,
                    is_edit=is_edit,
                    thread_id=thread_id,
                    ai_model=ai_model,
                    options=options,
                    generation_id=generation_id,
                    imp_flag=imp_flag,
                    backend_api_base=bb,
                    prebuilt_gpt_instructions=gpt_instructions,
                )
            except Exception:
                if use_deterministic_assistants_fallback:
                    logger.warning(
                        "OpenAI Assistants pipeline failed; falling back to deterministic template spec "
                        f"(task_id={task_id}, task_type={task_type})",
                        exc_info=True,
                    )
                    resolved_thread = self._threads.get(task_id, thread_id)
                    return await self._run_deterministic_edit_spec(
                        task_id=task_id,
                        user_id=user_id,
                        message=message,
                        task_type=task_type,
                        thread_id=resolved_thread,
                        ai_model=ai_model,
                        options=options,
                        generation_id=generation_id,
                        images=images,
                        end_image=end_image,
                        backend_api_base=bb,
                        from_assistants_fallback=True,
                    )
                raise

            gpt_frag = (task_data.get("prompt") or "").strip() if isinstance(task_data, dict) else ""
            return {
                "task_id": task_id,
                "user_id": user_id,
                "thread_id": thread_id,
                "prompt": final_prompt.strip(),
                "gpt_fragment": gpt_frag,
                "gpt_ms": gpt_ms,
            }
            
        except asyncio.TimeoutError as e:
            logger.warning("OpenAI таймаут → используем оригинальное сообщение")
            error_message = f"OpenAI timeout: {str(e)}"
            await self._send_error_to_kafka(
                task_id, user_id, message, error_message, backend_api_base=bb
            )
        except openai.APIConnectionError as e:
            logger.warning(f"OpenAI соединение не удалось: {e} → используем оригинальное сообщение")
            error_message = f"OpenAI connection error: {str(e)}"
            await self._send_error_to_kafka(
                task_id, user_id, message, error_message, backend_api_base=bb
            )
        except (httpx.ConnectError, httpx.ConnectTimeout, openai.APITimeoutError) as e:
            logger.warning("OpenAI недоступен (сеть/прокси) → используем оригинальное сообщение")
            error_message = f"OpenAI unavailable: {str(e)}"
            await self._send_error_to_kafka(
                task_id, user_id, message, error_message, backend_api_base=bb
            )
        except openai.RateLimitError as e:
            logger.warning("OpenAI rate limit → используем оригинальное сообщение")
            error_message = f"OpenAI rate limit: {str(e)}"
            await self._send_error_to_kafka(
                task_id, user_id, message, error_message, backend_api_base=bb
            )
        except openai.AuthenticationError as e:
            logger.error("Неверный OPENAI_API_KEY")
            error_message = f"OpenAI authentication error: {str(e)}"
            await self._send_error_to_kafka(
                task_id, user_id, message, error_message, backend_api_base=bb
            )
        except openai.APIError as e:
            status_code = getattr(e, 'status_code', None)
            if status_code == 429:
                logger.warning("OpenAI 429 → используем оригинальное сообщение")
                error_message = f"OpenAI 429 rate limit"
            elif status_code:
                error_body = getattr(e, 'body', str(e))
                logger.warning(f"OpenAI API ошибка {status_code}: {error_body}")
                error_message = f"OpenAI API error {status_code}: {error_body}"
            else:
                logger.warning(f"OpenAI API ошибка: {e}")
                error_message = f"OpenAI API error: {str(e)}"
            await self._send_error_to_kafka(
                task_id, user_id, message, error_message, backend_api_base=bb
            )
        except Exception as e:
            logger.warning(f"Неизвестная ошибка OpenAI ({type(e).__name__}): {e} → используем оригинальное сообщение")
            error_message = f"Unknown OpenAI error: {str(e)}"
            await self._send_error_to_kafka(
                task_id, user_id, message, error_message, backend_api_base=bb
            )
        
        # Fallback: возвращаем оригинальное сообщение (без обёртки prompt_service,
        # чтобы явно видеть, что OpenAI не сработал)
        thread_id = self._threads.get(task_id, "")
        return {
            "task_id": task_id,
            "user_id": user_id,
            "thread_id": thread_id,
            "prompt": message,
            "gpt_fragment": message,
            "gpt_ms": 0,
        }


    def build_chat_tools(
        self,
        *,
        enable_web_search: bool,
        prepared: Any,
        vector_store_id: Optional[str] = None,
        continue_code_interpreter: bool = False,
    ) -> List[Dict[str, Any]]:
        from services.openai_chat import build_chat_tools

        return build_chat_tools(
            enable_web_search=enable_web_search,
            prepared=prepared,
            vector_store_id=vector_store_id,
            continue_code_interpreter=continue_code_interpreter,
        )

    async def stream_chat_response(
        self,
        *,
        user_input: Any,
        tools: List[Dict[str, Any]],
        enable_web_search: bool,
        previous_response_id: Optional[str] = None,
        model: Optional[str] = None,
        prepared: Any = None,
        attachment_names: Optional[List[str]] = None,
    ):
        from services.openai_chat import stream_chat_response

        if not self.client:
            raise RuntimeError("OpenAI client not initialized")
        async for item in stream_chat_response(
            self.client,
            model=model or self.chat_model,
            user_input=user_input,
            tools=tools,
            enable_web_search=enable_web_search,
            previous_response_id=previous_response_id,
            prepared=prepared,
            attachment_names=attachment_names,
        ):
            yield item

    async def generate_chat_title(
        self,
        *,
        user_message: str,
        attachment_names: Optional[List[str]] = None,
        model: Optional[str] = None,
    ) -> str:
        from services.openai_chat import generate_chat_title

        if not self.client:
            raise RuntimeError("OpenAI client not initialized")
        return await generate_chat_title(
            self.client,
            user_message=user_message,
            attachment_names=attachment_names,
            model=model or self.chat_title_model,
        )


# Глобальный экземпляр
openai_service = OpenAIService()
