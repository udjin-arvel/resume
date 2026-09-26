from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "conquer",
    broker=settings.redis_url,
    backend=settings.redis_url,
)
celery_app.conf.task_default_queue = "default"
celery_app.conf.broker_connection_retry_on_startup = True
celery_app.conf.update(
    include=["app.tasks.analysis"],
    task_track_started=True,
    task_time_limit=600,
    task_soft_time_limit=540,
)
