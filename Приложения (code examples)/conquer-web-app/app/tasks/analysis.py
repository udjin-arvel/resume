import asyncio
import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.tasks.pipeline import run_analysis_pipeline

logger = logging.getLogger(__name__)


async def _run(request_id: str) -> dict[str, str]:
    # Fresh engine per task: Celery prefork + asyncio.run() must not reuse
    # a module-level engine bound to another event loop.
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    try:
        async with session_factory() as session:
            await run_analysis_pipeline(session, UUID(request_id))
            return {"request_id": request_id, "status": "completed"}
    finally:
        await engine.dispose()


@celery_app.task(name="app.tasks.analysis.run_analysis", bind=True, max_retries=0)
def run_analysis(self, request_id: str) -> dict[str, str]:
    try:
        return asyncio.run(_run(request_id))
    except Exception:
        logger.exception("Celery task run_analysis failed for %s", request_id)
        raise
