import logging
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.deepseek import analyze_site_data
from app.analysis.errors import AnalysisError, MissingApiKeyError
from app.models import crud
from app.models.entities import ParsedData
from app.models.enums import AnalysisStatus
from app.parsers.base import ParseError
from app.parsers.site_parser import SiteParser

logger = logging.getLogger(__name__)


def _parsed_to_dict(parsed: ParsedData) -> dict[str, Any]:
    return {
        "url": parsed.url,
        "title": parsed.title,
        "description": parsed.description,
        "text_content": parsed.text_content,
        "headings": parsed.headings,
        "links": parsed.links,
        "prices": parsed.prices,
        "contacts": parsed.contacts,
        "meta": parsed.meta,
    }


async def run_analysis_pipeline(session: AsyncSession, request_id: uuid.UUID) -> None:
    request = await crud.get_request(session, request_id)
    if request is None:
        logger.error("Pipeline skipped: request %s not found", request_id)
        return

    existing_result = await crud.get_result_by_request(session, request_id)
    if request.status == AnalysisStatus.completed and existing_result is not None:
        logger.info("Pipeline no-op: request %s already completed", request_id)
        return

    await crud.update_request_status(session, request_id, AnalysisStatus.in_progress)
    await session.commit()

    try:
        parsed = await crud.get_parsed_by_request(session, request_id)
        if parsed is None:
            parse_result = await SiteParser().parse(request.url)
            parsed = await crud.create_parsed_data(
                session,
                request_id,
                url=parse_result.url,
                title=parse_result.title,
                description=parse_result.description,
                text_content=parse_result.text_content,
                headings=parse_result.headings,
                links=parse_result.links,
                prices=parse_result.prices,
                contacts=parse_result.contacts,
                meta=parse_result.meta,
            )
            await session.commit()

        if existing_result is None:
            existing_result = await crud.get_result_by_request(session, request_id)
        if existing_result is None:
            output = await analyze_site_data(_parsed_to_dict(parsed))
            await crud.create_analysis_result(
                session,
                request_id,
                summary=output.summary,
                metrics=output.metrics_dict(),
            )

        await crud.update_request_status(session, request_id, AnalysisStatus.completed)
        await session.commit()
    except (ParseError, AnalysisError, MissingApiKeyError, Exception) as exc:
        logger.exception("Pipeline failed for request %s", request_id)
        await crud.update_request_status(
            session,
            request_id,
            AnalysisStatus.failed,
            error_message=str(exc),
        )
        await session.commit()
        raise
