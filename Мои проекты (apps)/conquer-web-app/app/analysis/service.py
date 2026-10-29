import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis.deepseek import analyze_site_data
from app.analysis.errors import (
    AlreadyAnalyzedError,
    AnalysisError,
    MissingApiKeyError,
    NoParsedDataError,
    RequestNotFoundError,
)
from app.models import crud
from app.models.entities import AnalysisResult, ParsedData
from app.models.enums import AnalysisStatus


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


async def analyze_request_and_save(
    session: AsyncSession,
    request_id: uuid.UUID,
) -> AnalysisResult:
    request = await crud.get_request(session, request_id)
    if request is None:
        raise RequestNotFoundError(f"Request {request_id} not found")

    parsed = await crud.get_parsed_by_request(session, request_id)
    if parsed is None:
        raise NoParsedDataError(f"Request {request_id} has no parsed data")

    existing = await crud.get_result_by_request(session, request_id)
    if existing is not None:
        raise AlreadyAnalyzedError(f"Request {request_id} already has analysis result")

    await crud.update_request_status(session, request_id, AnalysisStatus.in_progress)

    try:
        output = await analyze_site_data(_parsed_to_dict(parsed))
        result = await crud.create_analysis_result(
            session,
            request_id,
            summary=output.summary,
            metrics=output.metrics_dict(),
        )
        await crud.update_request_status(session, request_id, AnalysisStatus.completed)
        return result
    except MissingApiKeyError:
        await crud.update_request_status(session, request_id, AnalysisStatus.pending)
        await session.commit()
        raise
    except AnalysisError as exc:
        await crud.update_request_status(
            session,
            request_id,
            AnalysisStatus.failed,
            error_message=str(exc),
        )
        await session.commit()
        raise
