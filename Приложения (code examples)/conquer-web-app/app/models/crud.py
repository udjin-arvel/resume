import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import AnalysisRequest, AnalysisResult, ParsedData
from app.models.enums import AnalysisStatus


async def create_request(session: AsyncSession, url: str) -> AnalysisRequest:
    request = AnalysisRequest(url=url, status=AnalysisStatus.pending)
    session.add(request)
    await session.flush()
    await session.refresh(request)
    return request


async def get_request(session: AsyncSession, request_id: uuid.UUID) -> AnalysisRequest | None:
    return await session.get(AnalysisRequest, request_id)


async def update_request_status(
    session: AsyncSession,
    request_id: uuid.UUID,
    status: AnalysisStatus,
    error_message: str | None = None,
) -> AnalysisRequest | None:
    request = await get_request(session, request_id)
    if request is None:
        return None
    request.status = status
    request.error_message = error_message
    await session.flush()
    await session.refresh(request)
    return request


async def create_parsed_data(
    session: AsyncSession,
    request_id: uuid.UUID,
    *,
    url: str,
    title: str | None = None,
    description: str | None = None,
    text_content: str | None = None,
    headings: list[Any] | dict[str, Any] | None = None,
    links: list[Any] | dict[str, Any] | None = None,
    prices: list[Any] | dict[str, Any] | None = None,
    contacts: list[Any] | dict[str, Any] | None = None,
    meta: dict[str, Any] | None = None,
) -> ParsedData:
    parsed = ParsedData(
        request_id=request_id,
        url=url,
        title=title,
        description=description,
        text_content=text_content,
        headings=headings,
        links=links,
        prices=prices,
        contacts=contacts,
        meta=meta,
    )
    session.add(parsed)
    await session.flush()
    await session.refresh(parsed)
    return parsed


async def get_parsed_by_request(
    session: AsyncSession,
    request_id: uuid.UUID,
) -> ParsedData | None:
    result = await session.execute(
        select(ParsedData).where(ParsedData.request_id == request_id)
    )
    return result.scalar_one_or_none()


async def create_analysis_result(
    session: AsyncSession,
    request_id: uuid.UUID,
    *,
    summary: str,
    metrics: dict[str, Any] | None = None,
) -> AnalysisResult:
    analysis = AnalysisResult(
        request_id=request_id,
        summary=summary,
        metrics=metrics or {},
    )
    session.add(analysis)
    await session.flush()
    await session.refresh(analysis)
    return analysis


async def get_result_by_request(
    session: AsyncSession,
    request_id: uuid.UUID,
) -> AnalysisResult | None:
    result = await session.execute(
        select(AnalysisResult).where(AnalysisResult.request_id == request_id)
    )
    return result.scalar_one_or_none()
