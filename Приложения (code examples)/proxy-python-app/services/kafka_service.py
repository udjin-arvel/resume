"""
Сервис для работы с Kafka - подписка на топики и отправка результатов
Поддерживает только 3 топика: requests, results, dialogs
"""
import json
import logging
import asyncio
import httpx
from typing import Dict, Any, Optional, Set, List
from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import KafkaError, CommitFailedError
from kafka.structs import OffsetAndMetadata
from config import settings
from task_types import TaskType, normalize_task_type
from services.backend_proxy_hmac import resolve_backend_api_base_for_request

logger = logging.getLogger(__name__)


async def _post_task_update_backend(
    backend_base: str,
    task_id: str,
    thread_id: Optional[str],
    status: str = "pending",
) -> bool:
    try:
        tid = int(task_id)
    except (TypeError, ValueError):
        return False
    url = f"{backend_base.rstrip('/')}/task/update"
    payload: Dict[str, Any] = {"task_id": tid, "status": status, "thread_id": thread_id}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(url, json=payload)
            return r.status_code == 200
    except Exception as e:
        logger.warning("POST /task/update failed: %s", e, exc_info=True)
        return False


def _parse_requests_topics(raw: str) -> List[str]:
    """
    KAFKA_TOPIC_REQUESTS: одно имя или несколько через запятую, например
    requests-dev,requests-prod
    """
    if raw is None:
        return ["requests"]
    s = str(raw).strip()
    if not s:
        return ["requests"]
    parts = [p.strip() for p in s.split(",")]
    parts = [p for p in parts if p]
    return parts if parts else ["requests"]


def _parse_results_topics(raw: str) -> List[str]:
    """
    KAFKA_TOPIC_RESULTS: одно имя или несколько через запятую — producer
    отправит копию сообщения в каждый топик, например results-dev,results-prod
    """
    if raw is None:
        return ["results"]
    s = str(raw).strip()
    if not s:
        return ["results"]
    parts = [p.strip() for p in s.split(",")]
    parts = [p for p in parts if p]
    out = parts if parts else ["results"]
    # без дублей, порядок сохраняем
    return list(dict.fromkeys(out))


def _offset_and_metadata_for_commit(offset: int) -> OffsetAndMetadata:
    """
    Совместимость версий kafka-python: в новых релизах namedtuple OffsetAndMetadata
    включает leader_epoch (третий аргумент). В OffsetCommitRequest неизвестная эпоха — -1.
    """
    fields = getattr(OffsetAndMetadata, "_fields", ())
    if len(fields) >= 3:
        return OffsetAndMetadata(offset, "", -1)
    return OffsetAndMetadata(offset, None)


class KafkaService:
    """Сервис для работы с Kafka - подписка на топики и отправка результатов"""
    
    def __init__(self):
        self.bootstrap_servers = settings.KAFKA_BOOTSTRAP_SERVERS
        self.consumer_group_id = settings.KAFKA_CONSUMER_GROUP_ID
        self.topic_requests = settings.KAFKA_TOPIC_REQUESTS
        self.topic_requests_list = _parse_requests_topics(self.topic_requests)
        self.topic_results = settings.KAFKA_TOPIC_RESULTS
        self.topic_results_list = _parse_results_topics(self.topic_results)
        self.topic_dialogs = settings.KAFKA_TOPIC_DIALOGS
        self.topic_prompt_jobs = settings.KAFKA_TOPIC_PROMPT_JOBS
        self.backend_url = settings.BACKEND_URL.rstrip("/")
        
        # Consumers
        self.requests_consumer: Optional[KafkaConsumer] = None
        self.prompt_jobs_consumer: Optional[KafkaConsumer] = None
        
        # Producer
        self.producer: Optional[KafkaProducer] = None
        
        # Флаги работы
        self.requests_is_running = False
        self.prompt_jobs_is_running = False
        
        # Фоновые задачи
        self.requests_background_task: Optional[asyncio.Task] = None
        self.prompt_jobs_background_task: Optional[asyncio.Task] = None

        # Параллельная обработка requests: backpressure до create_task (см. consume_requests_messages).
        # Порядок завершения задач может не совпадать с порядком сообщений в партиции — UI опирается на task_id/generation_id.
        n = settings.KAFKA_REQUESTS_MAX_CONCURRENCY
        self._requests_semaphore = asyncio.Semaphore(n)
        self._inflight_tasks: Set[asyncio.Task] = set()
        pj_n = int(settings.KAFKA_PROMPT_JOBS_MAX_CONCURRENCY)
        if pj_n < 1:
            pj_n = 1
        self._prompt_jobs_semaphore = asyncio.Semaphore(pj_n)
        self._inflight_prompt_tasks: Set[asyncio.Task] = set()
        logger.info("Kafka requests concurrency limit: %s; prompt_jobs: %s", n, pj_n)
    
    def initialize(self):
        """Инициализация Kafka consumer и producer"""
        try:
            # Инициализация producer для отправки результатов
            self.producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers.split(','),
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                acks='all',
                retries=3,
                max_in_flight_requests_per_connection=1,
                request_timeout_ms=30000,
                api_version=(0, 10, 1)
            )
            logger.info(f"Kafka producer инициализирован. Bootstrap servers: {self.bootstrap_servers}")
        except Exception as e:
            logger.error(f"Ошибка инициализации Kafka producer: {e}")
            self.producer = None
        
        try:
            # Инициализация consumer для топика requests.
            # Конфигурация подобрана под долгие (30–60 секунд) запросы к GPT / AtlasAI.
            # Мы коммитим offset вручную сразу после чтения сообщения,
            # а тяжелую обработку выполняем отдельно, чтобы не было повторов при длительной обработке.
            self.requests_consumer = KafkaConsumer(
                *self.topic_requests_list,
                bootstrap_servers=self.bootstrap_servers.split(','),
                group_id=f"{self.consumer_group_id}_requests",
                auto_offset_reset=settings.KAFKA_CONSUMER_AUTO_OFFSET_RESET,
                enable_auto_commit=False,  # ручной commit
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                consumer_timeout_ms=1000,
                request_timeout_ms=60000,   # 60 секунд на сетевые операции
                session_timeout_ms=45000,   # 45 секунд до исключения из группы
                heartbeat_interval_ms=15000,  # heartbeat каждые 15 секунд (< session_timeout_ms/3)
                max_poll_interval_ms=600000,  # 10 минут между poll (достаточно для 30–60 секунд обработки)
                api_version=(0, 10, 1)
            )
            logger.info(
                "Kafka requests consumer инициализирован. Topics=%s Group=%s_requests",
                self.topic_requests_list,
                self.consumer_group_id,
            )
        except Exception as e:
            logger.error(f"Ошибка инициализации Kafka GPT requests consumer: {e}")
            logger.warning("Kafka GPT requests consumer не инициализирован, приложение продолжит работу без него")
            self.requests_consumer = None

        try:
            self.prompt_jobs_consumer = KafkaConsumer(
                self.topic_prompt_jobs,
                bootstrap_servers=self.bootstrap_servers.split(","),
                group_id=f"{self.consumer_group_id}_prompt_jobs",
                auto_offset_reset=settings.KAFKA_CONSUMER_AUTO_OFFSET_RESET,
                enable_auto_commit=False,
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                consumer_timeout_ms=1000,
                request_timeout_ms=60000,
                session_timeout_ms=45000,
                heartbeat_interval_ms=15000,
                max_poll_interval_ms=600000,
                api_version=(0, 10, 1),
            )
            logger.info(
                "Kafka prompt_jobs consumer: topic=%s group=%s_prompt_jobs",
                self.topic_prompt_jobs,
                self.consumer_group_id,
            )
        except Exception as e:
            logger.error("Ошибка инициализации Kafka prompt_jobs consumer: %s", e)
            self.prompt_jobs_consumer = None
    
    def cleanup(self):
        """Очистка ресурсов"""
        self.requests_is_running = False
        
        if self.requests_background_task:
            self.requests_background_task.cancel()
        
        if self.requests_consumer:
            self.requests_consumer.close()
            logger.info("Kafka requests consumer закрыт")

        if self.prompt_jobs_consumer:
            self.prompt_jobs_consumer.close()
            logger.info("Kafka prompt_jobs consumer закрыт")
        
        if self.producer:
            self.producer.close()
            logger.info("Kafka producer закрыт")
    
    def _try_resolve_backend_for_message(self, msg: Dict[str, Any]) -> Optional[str]:
        try:
            return resolve_backend_api_base_for_request(
                msg,
                default_backend_url=settings.BACKEND_URL,
                hmac_secret=settings.BACKEND_PROXY_HMAC_SECRET,
                allow_legacy_unsigned=settings.BACKEND_PROXY_ALLOW_LEGACY_UNSIGNED,
            )
        except ValueError:
            return None

    async def _send_error_to_backend(
        self,
        task_id: str,
        error_message: str,
        backend_base: Optional[str] = None,
        *,
        user_error_message: Optional[str] = None,
    ) -> bool:
        """
        Отправляет ошибку в backend через API /task/error
        
        Args:
            task_id: ID задачи
            error_message: исходный текст провайдера (как error_upstream в Kafka)
            user_error_message: текст для клиента (как поле error в Kafka), опционально
        
        Returns:
            True если успешно, False если ошибка
        """
        try:
            # Проверяем, что task_id не пустой
            if not task_id:
                logger.warning("task_id пустой, пропускаем отправку ошибки в backend")
                return False
            
            # Преобразуем task_id в int
            try:
                task_id_int = int(task_id)
            except (ValueError, TypeError):
                logger.error(f"Некорректный task_id: {task_id}, не может быть преобразован в int")
                return False
            
            base = (backend_base if backend_base is not None else self.backend_url).rstrip("/")
            error_url = f"{base}/task/error"
            payload: Dict[str, Any] = {
                "task_id": task_id_int,
                "error_message": error_message,
            }
            if user_error_message is not None:
                payload["user_error_message"] = user_error_message
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(error_url, json=payload)
                if response.status_code == 200:
                    logger.info(f"Ошибка отправлена в backend для task_id={task_id}")
                    return True
                else:
                    logger.warning(f"Не удалось отправить ошибку в backend для task_id={task_id}: статус {response.status_code}, ответ: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Ошибка при отправке ошибки в backend для task_id={task_id}: {e}", exc_info=True)
            return False
    
    def _send_error_to_backend_async(
        self,
        task_id: str,
        error_message: str,
        backend_base: Optional[str] = None,
        *,
        user_error_message: Optional[str] = None,
    ) -> None:
        """
        Асинхронно отправляет ошибку в backend (fire-and-forget, не ждем завершения)
        
        Args:
            task_id: ID задачи
            error_message: исходный текст провайдера
            user_error_message: текст для клиента (как error в Kafka)
        """
        def handle_result(task: asyncio.Task) -> None:
            """Обработка результата фоновой задачи"""
            try:
                task.result()  # Проверяем, не было ли исключения
            except Exception as e:
                logger.error(f"Ошибка в фоновой отправке ошибки для task_id={task_id} в backend: {e}", exc_info=True)
        
        # Создаем задачу в фоне
        task = asyncio.create_task(
            self._send_error_to_backend(
                task_id,
                error_message,
                backend_base=backend_base,
                user_error_message=user_error_message,
            )
        )
        task.add_done_callback(handle_result)

    async def process_gpt_request_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обработка сообщения из топика requests
        
        Args:
            message: Сообщение из Kafka с полями:
                - task_id: ID задачи
                - user_id: ID пользователя
                - thread_id: ID треда
                - message: Сообщение пользователя
                - task_type: Строковый код задачи (chat, edit_image, video_preview, …)
                - images: Список путей к изображениям (опционально)
            
        Returns:
            Dict с результатом обработки
        """
        try:
            _imgs = message.get("images")
            logger.info(
                "Kafka GPT request task_id=%s user_id=%s task_type=%s ai_model=%s n_images=%s",
                message.get("task_id"),
                message.get("user_id"),
                message.get("task_type"),
                message.get("ai_model"),
                len(_imgs) if isinstance(_imgs, list) else 0,
            )

            # Извлекаем данные из сообщения
            task_id = str(message.get("task_id", ""))
            user_id = str(message.get("user_id", ""))
            thread_id = str(message.get("thread_id", ""))
            user_message = message.get("message", "") or ""
            task_type = normalize_task_type(message.get("task_type", TaskType.EDIT_IMAGE))
            images = message.get("images", [])
            is_edit = message.get("is_edit", False)
            ai_model = message.get("ai_model", None)
            options = message.get("options")
            improve_prompt = message.get("improve_prompt", True)
            skip_gpt_raw = message.get("skip_gpt", False)
            skip_gpt_flag = bool(skip_gpt_raw) if not isinstance(skip_gpt_raw, str) else str(skip_gpt_raw).lower() in (
                "1",
                "true",
                "yes",
            )
            if task_type != TaskType.IMPROVE_QUALITY:
                skip_gpt_flag = False
            msg_stripped = user_message.strip()
            end_image_path = message.get("end_image")
            generation_id_raw = message.get("generation_id")
            generation_id = None
            if generation_id_raw is not None and str(generation_id_raw).strip() != "":
                try:
                    generation_id = str(int(generation_id_raw))
                except (TypeError, ValueError):
                    logger.warning(
                        f"Некорректный generation_id в Kafka (requests): {generation_id_raw}"
                    )

            if not task_id:
                raise ValueError("task_id обязателен в сообщении")
            if not user_id:
                raise ValueError("user_id обязателен в сообщении")
            if not msg_stripped and not (skip_gpt_flag and task_type == TaskType.IMPROVE_QUALITY):
                raise ValueError("message обязателен в сообщении (кроме skip_gpt для improve_quality — допустим пустой)")
            
            # thread_id может прийти из backend через Kafka сообщение
            thread_id_param = thread_id if thread_id else None
            
            logger.info(f"Обработка GPT запроса: task_id={task_id}, user_id={user_id}, task_type={task_type}, images={len(images) if images else 0}")

            try:
                resolved_backend = resolve_backend_api_base_for_request(
                    message,
                    default_backend_url=settings.BACKEND_URL,
                    hmac_secret=settings.BACKEND_PROXY_HMAC_SECRET,
                    allow_legacy_unsigned=settings.BACKEND_PROXY_ALLOW_LEGACY_UNSIGNED,
                )
            except ValueError as e:
                logger.error("Kafka requests: не удалось определить backend API: %s", e)
                error_response = {
                    "task_id": task_id,
                    "user_id": user_id,
                    "thread_id": thread_id_param or "",
                    "prompt": user_message,
                    "error": str(e),
                }
                if generation_id is not None:
                    try:
                        error_response["generation_id"] = int(generation_id)
                    except (TypeError, ValueError):
                        pass
                await self.send_gpt_result(error_response, notify_backend_error=False)
                return error_response
            
            # Задачи типа CHAT обрабатываются через OpenAI без Atlas
            if task_type == TaskType.CHAT:
                from services.chat_service import chat_service
                await chat_service.handle_chat_task(
                    message, backend_base=resolved_backend
                )
                return {
                    "task_id": task_id,
                    "user_id": user_id,
                    "task_type": TaskType.CHAT,
                }

            # Backend формирует промпт; в requests приходит atlas_ready + prompt + gpt_fragment
            atlas_ready_raw = message.get("atlas_ready", False)
            atlas_ready = bool(atlas_ready_raw) if not isinstance(atlas_ready_raw, str) else str(
                atlas_ready_raw
            ).lower() in ("1", "true", "yes", "on")
            if not atlas_ready:
                err = (
                    "Сообщение requests без atlas_ready: OpenAI/prompt строит backend. "
                    "Обновите backend и согласуйте деплой с proxy."
                )
                logger.error("Kafka requests: %s (task_id=%s)", err, task_id)
                error_response = {
                    "task_id": task_id,
                    "user_id": user_id,
                    "thread_id": thread_id_param or "",
                    "prompt": user_message,
                    "error": err,
                }
                if generation_id is not None:
                    try:
                        error_response["generation_id"] = int(generation_id)
                    except (TypeError, ValueError):
                        pass
                await self.send_gpt_result(
                    error_response, backend_base=resolved_backend, notify_backend_error=True
                )
                return error_response

            final_prompt = (message.get("prompt") or "").strip()
            gpt_fragment = (message.get("gpt_fragment") or "").strip() or user_message
            if not final_prompt:
                raise ValueError("atlas_ready: пустой prompt (финальный промпт для Atlas)")

            from services.atlas_dispatch import dispatch_to_atlas, task_data_from_kafka

            # Proxy берёт Atlas — pending в backend до вызова провайдера
            await _post_task_update_backend(
                resolved_backend, task_id, thread_id_param, status="pending"
            )

            task_data = task_data_from_kafka(
                message,
                gpt_fragment=gpt_fragment,
                resolved_backend_base=resolved_backend,
            )
            video_path = message.get("video")
            if video_path is not None and not str(video_path).strip():
                video_path = None

            await dispatch_to_atlas(
                task_type=task_type,
                final_prompt=final_prompt,
                task_data=task_data,
                images=images,
                options=options,
                end_image=end_image_path,
                ai_model=ai_model,
                video=str(video_path).strip() if video_path else None,
            )
            result = {
                "task_id": task_id,
                "user_id": user_id,
                "thread_id": str(message.get("thread_id", "") or ""),
                "prompt": final_prompt,
            }
            logger.info(
                "Atlas dispatch done: task_id=%s, thread_id=%s, task_type=%s",
                result.get("task_id"),
                result.get("thread_id"),
                task_type,
            )
            return result
            
        except Exception as e:
            logger.error(f"Ошибка обработки сообщения requests: {e}", exc_info=True)
            task_id = str(message.get("task_id", ""))
            user_id = str(message.get("user_id", ""))
            task_type = normalize_task_type(message.get("task_type", TaskType.EDIT_IMAGE))
            thread_id = str(message.get("thread_id", ""))

            rb = self._try_resolve_backend_for_message(message)
            error_response = {
                "task_id": task_id,
                "user_id": user_id,
                "thread_id": thread_id,
                "prompt": message.get("message", ""),
                "error": str(e),
            }
            gid = message.get("generation_id")
            if gid is not None and str(gid).strip() != "":
                try:
                    error_response["generation_id"] = int(gid)
                except (TypeError, ValueError):
                    pass
            await self.send_gpt_result(
                error_response,
                backend_base=rb,
                notify_backend_error=rb is not None,
            )
            
            return error_response

    def _on_inflight_task_done(self, task: asyncio.Task) -> None:
        self._inflight_tasks.discard(task)
        if task.cancelled():
            return
        exc = task.exception()
        if exc is not None:
            logger.error("In-flight Kafka request task failed: %s", exc, exc_info=exc)

    async def _process_request_message_with_release(self, message_value: Dict[str, Any]) -> None:
        try:
            await self.process_gpt_request_message(message_value)
        finally:
            self._requests_semaphore.release()
    
    async def _safe_commit_offset_prompt(self, topic_partition, offset: int) -> bool:
        if not self.prompt_jobs_consumer:
            logger.warning("prompt_jobs consumer не инициализирован, пропускаем коммит")
            return False
        try:
            await asyncio.to_thread(
                self.prompt_jobs_consumer.commit,
                offsets={topic_partition: _offset_and_metadata_for_commit(offset)},
            )
            logger.info(
                "prompt_jobs: offset commit topic=%s partition=%s",
                topic_partition.topic,
                topic_partition.partition,
            )
            return True
        except CommitFailedError as e:
            logger.warning("prompt_jobs: commit failed: %s", e)
            return False
        except Exception as e:
            logger.error("prompt_jobs: unexpected commit error: %s", e, exc_info=True)
            return False

    async def _safe_commit_offset(self, topic_partition, offset: int) -> bool:
        """
        Безопасный коммит offset с обработкой ошибок.

        Мы не пересоздаем consumer внутри этого метода, а только логируем ошибки.
        В случае CommitFailedError (например, consumer временно не в группе)
        сообщение может быть прочитано повторно — это нормальное поведение Kafka (at-least-once).
        """
        if not self.requests_consumer:
            logger.warning("Consumer не инициализирован, пропускаем коммит")
            return False
        
        try:
            await asyncio.to_thread(
                self.requests_consumer.commit,
                offsets={topic_partition: _offset_and_metadata_for_commit(offset)},
            )
            logger.info(
                f"Offset закоммичен: topic={topic_partition.topic}, "
                f"partition={topic_partition.partition}, offset={offset - 1}"
            )
            return True
        except CommitFailedError as e:
            logger.warning(
                f"Не удалось закоммитить offset {offset - 1} для topic={topic_partition.topic}, "
                f"partition={topic_partition.partition}: {e}"
            )
            return False
        except Exception as e:
            logger.error(f"Неожиданная ошибка при коммите offset: {e}", exc_info=True)
            return False
    
    async def send_gpt_result(
        self,
        response: Dict[str, Any],
        *,
        backend_base: Optional[str] = None,
        notify_backend_error: bool = True,
    ):
        """
        Отправка результата обработки в топик results
        
        Args:
            response: Результат обработки с полями:
                - task_id: str
                - user_id: str
                - thread_id: str
                - prompt: str
                - error: str (опционально, текст для клиента)
                - error_upstream: str (опционально, исходная ошибка провайдера для POST /task/error)
            backend_base: origin backend для POST /task/error (fallback — BACKEND_URL из настроек)
            notify_backend_error: False — не вызывать /task/error (например, при ошибке resolve origin)
        """
        try:
            # Если есть ошибка, отправляем её в backend
            error = response.get("error")
            task_id = response.get("task_id")
            if error and task_id and notify_backend_error:
                upstream = response.get("error_upstream")
                error_message = (
                    str(upstream) if upstream is not None and str(upstream).strip() else str(error)
                )
                self._send_error_to_backend_async(
                    task_id,
                    error_message,
                    backend_base=backend_base,
                    user_error_message=str(error),
                )
            
            if not self.producer:
                logger.error("Kafka producer не инициализирован")
                return
            
            # Используем task_id как ключ для упорядочивания сообщений
            key = response.get("task_id") or response.get("user_id") or "unknown"
            logger.info(
                "[RESULT OUT] brokers=%s topics=%s key=%s task_id=%s user_id=%s "
                "gen_id=%s ai_model=%s file_path=%s image_url=%s video_url=%s "
                "thread_id=%s error=%s",
                self.bootstrap_servers,
                self.topic_results_list,
                key,
                response.get("task_id"),
                response.get("user_id"),
                response.get("generation_id"),
                response.get("ai_model"),
                response.get("file_path"),
                response.get("image_url"),
                response.get("video_url"),
                response.get("thread_id"),
                bool(error),
            )
            
            # Отправляем копию сообщения в каждый топик из KAFKA_TOPIC_RESULTS
            for topic_name in self.topic_results_list:
                future = await asyncio.to_thread(
                    self.producer.send,
                    topic_name,
                    key=key,
                    value=response,
                )
                record_metadata = await asyncio.to_thread(future.get, timeout=10)
                logger.info("=== KAFKA GPT RESULT SENT ===")
                logger.info(f"Topic: {record_metadata.topic}")
                logger.info(f"Partition: {record_metadata.partition}")
                logger.info(f"Offset: {record_metadata.offset}")
                logger.info(f"Task ID: {response.get('task_id', 'N/A')}")
                logger.info(f"User ID: {response.get('user_id', 'N/A')}")
                logger.info(f"Thread ID: {response.get('thread_id', 'N/A')}")
                logger.info(f"Prompt: {response.get('prompt', 'N/A')[:100]}...")
                if error:
                    logger.info(f"Error: {error[:200]}...")
            
        except Exception as e:
            logger.error(f"Ошибка отправки результата в Kafka: {e}", exc_info=True)

    async def send_atlas_ready_to_requests(
        self,
        payload: Dict[str, Any],
        *,
        key: str,
    ) -> None:
        """Публикация в topic requests (первый из KAFKA_TOPIC_REQUESTS) после GPT на proxy."""
        if not self.producer:
            raise RuntimeError("Kafka producer не инициализирован")
        target = self.topic_requests_list[0] if self.topic_requests_list else "requests"
        key_s = str(key) if key is not None else "unknown"
        fut = await asyncio.to_thread(
            self.producer.send,
            target,
            key=key_s,
            value=payload,
        )
        await asyncio.to_thread(fut.get, timeout=30)
        logger.info(
            "Atlas ready → topic=%s task_id=%s",
            target,
            payload.get("task_id"),
        )

    def _on_inflight_prompt_done(self, task: asyncio.Task) -> None:
        self._inflight_prompt_tasks.discard(task)
        if task.cancelled():
            return
        exc = task.exception()
        if exc is not None:
            logger.error("In-flight prompt_jobs task failed: %s", exc, exc_info=exc)

    async def _process_prompt_job_with_release(self, message_value: Dict[str, Any]) -> None:
        try:
            from services.proxy_prompt_job import run_proxy_prompt_job

            await run_proxy_prompt_job(message_value)
        finally:
            self._prompt_jobs_semaphore.release()

    async def consume_prompt_jobs_messages(self) -> None:
        if not self.prompt_jobs_consumer:
            logger.warning("Kafka prompt_jobs consumer не инициализирован")
            return
        logger.info("Старт consumer prompt_jobs topic=%s", self.topic_prompt_jobs)
        self.prompt_jobs_is_running = True
        while self.prompt_jobs_is_running:
            try:
                message_pack = await asyncio.to_thread(
                    self.prompt_jobs_consumer.poll, timeout_ms=1000
                )
                if not message_pack:
                    await asyncio.sleep(0.1)
                    continue
                for topic_partition, messages in message_pack.items():
                    for message in messages:
                        try:
                            if not await self._safe_commit_offset_prompt(
                                topic_partition, message.offset + 1
                            ):
                                logger.warning(
                                    "prompt_jobs: пропуск offset=%s partition=%s",
                                    message.offset,
                                    topic_partition.partition,
                                )
                                continue
                            await self._prompt_jobs_semaphore.acquire()
                            try:
                                t = asyncio.create_task(
                                    self._process_prompt_job_with_release(message.value)
                                )
                                self._inflight_prompt_tasks.add(t)
                                t.add_done_callback(self._on_inflight_prompt_done)
                            except BaseException:
                                self._prompt_jobs_semaphore.release()
                                raise
                        except asyncio.CancelledError:
                            raise
                        except Exception as e:
                            logger.error("Ошибка чтения prompt_jobs: %s", e, exc_info=True)
                            await asyncio.sleep(2)
            except Exception as e:
                if self.prompt_jobs_is_running:
                    logger.error("Цикл prompt_jobs: %s", e, exc_info=True)
                    await asyncio.sleep(5)
        logger.info("Остановка consumer prompt_jobs")

    def start_prompt_jobs_consumer(self) -> None:
        if not self.prompt_jobs_consumer:
            logger.warning("prompt_jobs consumer не настроен — пропуск")
            return
        if self.prompt_jobs_background_task and not self.prompt_jobs_background_task.done():
            logger.warning("prompt_jobs consumer уже запущен")
            return
        self.prompt_jobs_background_task = asyncio.create_task(
            self.consume_prompt_jobs_messages()
        )
        logger.info("prompt_jobs consumer запущен в фоне")
    
    async def consume_requests_messages(self):
        """Основной цикл потребления сообщений из топика requests"""
        if not self.requests_consumer:
            logger.error("Kafka requests consumer не инициализирован")
            return
        
        logger.info(
            "Начало потребления сообщений из топиков: %s",
            self.topic_requests_list,
        )
        self.requests_is_running = True
        
        while self.requests_is_running:
            try:
                # Получаем сообщения из Kafka
                message_pack = await asyncio.to_thread(self.requests_consumer.poll, timeout_ms=1000)
                
                if not message_pack:
                    await asyncio.sleep(0.1)
                    continue
                
                # Обрабатываем все полученные сообщения
                for topic_partition, messages in message_pack.items():
                    for message in messages:
                        try:
                            logger.info(
                                f"Получено сообщение из Kafka: topic={topic_partition.topic}, "
                                f"partition={topic_partition.partition}, offset={message.offset}"
                            )

                            # Сначала коммитим offset (после успешного чтения сообщения),
                            # чтобы избежать повторной обработки при долгих запросах к GPT / AtlasAI.
                            # Это даёт at-most-once с точки зрения Kafka: при падении во время обработки
                            # сообщение не будет прочитано повторно из Kafka.
                            if not await self._safe_commit_offset(topic_partition, message.offset + 1):
                                logger.warning(
                                    "Пропуск обработки сообщения requests: коммит offset не выполнен "
                                    "(partition=%s, offset=%s)",
                                    topic_partition.partition,
                                    message.offset,
                                )
                                continue

                            # Слот семафора до create_task — ограничение числа одновременных генераций и памяти.
                            await self._requests_semaphore.acquire()
                            try:
                                task = asyncio.create_task(
                                    self._process_request_message_with_release(message.value)
                                )
                                self._inflight_tasks.add(task)
                                task.add_done_callback(self._on_inflight_task_done)
                            except BaseException:
                                self._requests_semaphore.release()
                                raise

                        except asyncio.CancelledError:
                            raise
                        except Exception as e:
                            logger.error(f"Ошибка обработки сообщения requests: {e}", exc_info=True)
                            msg_value = message.value if message.value else {}
                            task_id = str(msg_value.get("task_id", ""))
                            user_id = str(msg_value.get("user_id", ""))
                            task_type = normalize_task_type(msg_value.get("task_type", TaskType.EDIT_IMAGE))
                            thread_id = ""
                            
                            rb_outer = self._try_resolve_backend_for_message(msg_value)
                            error_response = {
                                "task_id": task_id,
                                "user_id": user_id,
                                "thread_id": thread_id,
                                "prompt": msg_value.get("message", ""),
                                "error": str(e),
                            }
                            egid = msg_value.get("generation_id")
                            if egid is not None and str(egid).strip() != "":
                                try:
                                    error_response["generation_id"] = int(egid)
                                except (TypeError, ValueError):
                                    pass
                            await self.send_gpt_result(
                                error_response,
                                backend_base=rb_outer,
                                notify_backend_error=rb_outer is not None,
                            )
                
            except Exception as e:
                if self.requests_is_running:
                    logger.error(f"Ошибка в цикле потребления сообщений requests: {e}", exc_info=True)
                    await asyncio.sleep(5)
        
        logger.info("Остановка потребления сообщений из топика requests")
    
    def start_requests_consumer(self):
        """Запуск consumer топика requests в фоновом режиме"""
        if not self.requests_consumer:
            logger.warning("Kafka requests consumer не инициализирован, пропускаем запуск")
            return
        
        if self.requests_background_task and not self.requests_background_task.done():
            logger.warning("Kafka requests consumer уже запущен")
            return
        
        self.requests_background_task = asyncio.create_task(self.consume_requests_messages())
        logger.info("Kafka requests consumer запущен в фоновом режиме")
    
    def stop_requests_consumer(self):
        """Остановка consumer топика requests"""
        self.requests_is_running = False
        if self.requests_background_task:
            self.requests_background_task.cancel()
            logger.info("Kafka requests consumer остановлен")

    async def shutdown_graceful(self) -> None:
        """
        Остановить цикл poll, дождаться завершения in-flight обработки requests (с таймаутом),
        затем закрыть consumer/producer. Вызывать из lifespan вместо stop_requests_consumer+cleanup.
        """
        logger.info("Kafka graceful shutdown: остановка цикла consumer")
        self.requests_is_running = False
        self.prompt_jobs_is_running = False
        for bg in (self.requests_background_task, self.prompt_jobs_background_task):
            if bg is not None and not bg.done():
                bg.cancel()
                try:
                    await bg
                except asyncio.CancelledError:
                    pass
        timeout = float(settings.KAFKA_SHUTDOWN_DRAIN_TIMEOUT_SEC)
        pending_copy = set(self._inflight_tasks) | set(self._inflight_prompt_tasks)
        if pending_copy:
            logger.info(
                "Kafka graceful shutdown: ожидание до %.0fs, in-flight задач: %d",
                timeout,
                len(pending_copy),
            )
            _, still_pending = await asyncio.wait(pending_copy, timeout=timeout)
            if still_pending:
                logger.warning(
                    "Kafka graceful shutdown: после таймаута всё ещё выполняются %d задач; закрываем Kafka",
                    len(still_pending),
                )
        self.cleanup()


# Глобальный экземпляр
kafka_service = KafkaService()
