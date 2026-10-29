from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import UUID

from urllib.parse import quote

from fastapi import Depends, FastAPI, Form, HTTPException, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, HttpUrl
from sqlalchemy.ext.asyncio import AsyncSession

from app.analysis import (
    AlreadyAnalyzedError,
    AnalysisError,
    MissingApiKeyError,
    NoParsedDataError,
    analyze_request_and_save,
)
from app.analysis.errors import RequestNotFoundError as AnalysisRequestNotFoundError
from app.core.config import get_settings
from app.core.database import get_db
from app.core.urls import InvalidUrlError, normalize_url
from app.models import crud
from app.models.enums import AnalysisStatus
from app.parsers import AlreadyParsedError, ParseError, parse_request_and_save
from app.parsers.service import RequestNotFoundError as ParseRequestNotFoundError
from app.tasks.analysis import run_analysis

BASE_DIR = Path(__file__).resolve().parent

settings = get_settings()
app = FastAPI(title="Conquer", debug=settings.debug)

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

STATUS_STAGES = [
    {"key": "queued", "label": "Заявка создана", "detail": "AnalysisRequest сохранён в PostgreSQL"},
    {"key": "parsing", "label": "Парсинг сайта", "detail": "Playwright headless + stealth"},
    {"key": "extract", "label": "Извлечение данных", "detail": "title, meta, тексты, ссылки, контакты, цены"},
    {"key": "llm", "label": "Анализ через DeepSeek", "detail": "deepseek-chat, строгий JSON-ответ"},
    {"key": "done", "label": "Отчёт готов", "detail": "AnalysisResult записан, статус completed"},
]


class CreateRequestBody(BaseModel):
    url: HttpUrl


class RequestResponse(BaseModel):
    id: UUID
    url: str
    status: AnalysisStatus
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ParsedDataResponse(BaseModel):
    id: UUID
    request_id: UUID
    url: str
    title: str | None
    description: str | None
    text_content: str | None
    headings: list[Any] | dict[str, Any] | None
    links: list[Any] | dict[str, Any] | None
    prices: list[Any] | dict[str, Any] | None
    contacts: list[Any] | dict[str, Any] | None
    meta: dict[str, Any] | None

    model_config = {"from_attributes": True}


class AnalysisResultResponse(BaseModel):
    id: UUID
    request_id: UUID
    summary: str
    metrics: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class RunResponse(BaseModel):
    request_id: UUID
    task_id: str
    status: AnalysisStatus


def _stage_states(status: AnalysisStatus) -> list[str]:
    if status == AnalysisStatus.pending:
        return ["done", "pending", "pending", "pending", "pending"]
    if status == AnalysisStatus.in_progress:
        return ["done", "active", "pending", "pending", "pending"]
    if status == AnalysisStatus.completed:
        return ["done", "done", "done", "done", "done"]
    if status == AnalysisStatus.failed:
        return ["done", "failed", "pending", "pending", "pending"]
    return ["pending"] * 5


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
async def index(request: Request, error: str | None = None) -> HTMLResponse:
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "title": "Conquer",
            "error": error,
            "examples": ["stroy-profil.ru", "mebel-loft.ru", "clinic-vita.ru"],
        },
    )


@app.post("/analyze")
async def analyze_form(
    db: AsyncSession = Depends(get_db),
    url: str = Form(...),
) -> RedirectResponse:
    try:
        normalized = normalize_url(url)
    except InvalidUrlError as exc:
        return RedirectResponse(
            url=f"/?error={quote(str(exc))}",
            status_code=status.HTTP_303_SEE_OTHER,
        )

    analysis_request = await crud.create_request(db, normalized)
    await db.commit()
    run_analysis.delay(str(analysis_request.id))
    return RedirectResponse(
        url=f"/requests/{analysis_request.id}",
        status_code=status.HTTP_303_SEE_OTHER,
    )


@app.get("/requests/{request_id}", response_class=HTMLResponse)
async def request_status_page(
    request: Request,
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> HTMLResponse:
    analysis_request = await crud.get_request(db, request_id)
    if analysis_request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    if analysis_request.status == AnalysisStatus.completed:
        result = await crud.get_result_by_request(db, request_id)
        if result is not None:
            return RedirectResponse(
                url=f"/requests/{request_id}/report",
                status_code=status.HTTP_303_SEE_OTHER,
            )

    stage_states = _stage_states(analysis_request.status)
    stages = [
        {**stage, "state": stage_states[i]}
        for i, stage in enumerate(STATUS_STAGES)
    ]

    return templates.TemplateResponse(
        request=request,
        name="status.html",
        context={
            "title": "Conquer — статус",
            "analysis_request": analysis_request,
            "stages": stages,
        },
    )


@app.get("/requests/{request_id}/report", response_class=HTMLResponse)
async def request_report_page(
    request: Request,
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> HTMLResponse:
    analysis_request = await crud.get_request(db, request_id)
    if analysis_request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    result = await crud.get_result_by_request(db, request_id)
    if result is None:
        return RedirectResponse(
            url=f"/requests/{request_id}",
            status_code=status.HTTP_303_SEE_OTHER,
        )

    parsed = await crud.get_parsed_by_request(db, request_id)
    metrics = result.metrics or {}

    return templates.TemplateResponse(
        request=request,
        name="report.html",
        context={
            "title": "Conquer — отчёт",
            "analysis_request": analysis_request,
            "result": result,
            "parsed": parsed,
            "metrics": metrics,
        },
    )


@app.post("/api/requests", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis_request(
    body: CreateRequestBody,
    db: AsyncSession = Depends(get_db),
) -> RequestResponse:
    request = await crud.create_request(db, str(body.url))
    return RequestResponse.model_validate(request)


@app.get("/api/requests/{request_id}", response_model=RequestResponse)
async def get_analysis_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> RequestResponse:
    request = await crud.get_request(db, request_id)
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return RequestResponse.model_validate(request)


@app.post(
    "/api/requests/{request_id}/run",
    response_model=RunResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def run_analysis_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> RunResponse:
    request = await crud.get_request(db, request_id)
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if request.status in (AnalysisStatus.completed, AnalysisStatus.in_progress):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Request already {request.status.value}",
        )

    async_result = run_analysis.delay(str(request_id))
    return RunResponse(
        request_id=request_id,
        task_id=async_result.id,
        status=request.status,
    )


@app.get("/api/requests/{request_id}/result", response_model=AnalysisResultResponse)
async def get_analysis_result(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> AnalysisResultResponse:
    request = await crud.get_request(db, request_id)
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    result = await crud.get_result_by_request(db, request_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")
    return AnalysisResultResponse.model_validate(result)


@app.post(
    "/api/requests/{request_id}/parse",
    response_model=ParsedDataResponse,
    status_code=status.HTTP_201_CREATED,
)
async def parse_analysis_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ParsedDataResponse:
    try:
        parsed = await parse_request_and_save(db, request_id)
    except ParseRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except AlreadyParsedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except ParseError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return ParsedDataResponse.model_validate(parsed)


@app.post(
    "/api/requests/{request_id}/analyze",
    response_model=AnalysisResultResponse,
    status_code=status.HTTP_201_CREATED,
)
async def analyze_analysis_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> AnalysisResultResponse:
    try:
        result = await analyze_request_and_save(db, request_id)
    except AnalysisRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except NoParsedDataError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except AlreadyAnalyzedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except MissingApiKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except AnalysisError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return AnalysisResultResponse.model_validate(result)
