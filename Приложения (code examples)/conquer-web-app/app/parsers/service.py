import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import crud
from app.models.entities import ParsedData
from app.models.enums import AnalysisStatus
from app.parsers.base import ParseError
from app.parsers.site_parser import SiteParser


class RequestNotFoundError(Exception):
    pass


class AlreadyParsedError(Exception):
    pass


async def parse_request_and_save(
    session: AsyncSession,
    request_id: uuid.UUID,
) -> ParsedData:
    request = await crud.get_request(session, request_id)
    if request is None:
        raise RequestNotFoundError(f"Request {request_id} not found")

    existing = await crud.get_parsed_by_request(session, request_id)
    if existing is not None:
        raise AlreadyParsedError(f"Request {request_id} already has parsed data")

    await crud.update_request_status(session, request_id, AnalysisStatus.in_progress)

    try:
        result = await SiteParser().parse(request.url)
        parsed = await crud.create_parsed_data(
            session,
            request_id,
            url=result.url,
            title=result.title,
            description=result.description,
            text_content=result.text_content,
            headings=result.headings,
            links=result.links,
            prices=result.prices,
            contacts=result.contacts,
            meta=result.meta,
        )
        await crud.update_request_status(session, request_id, AnalysisStatus.pending)
        return parsed
    except ParseError as exc:
        await crud.update_request_status(
            session,
            request_id,
            AnalysisStatus.failed,
            error_message=str(exc),
        )
        await session.commit()
        raise
