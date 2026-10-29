import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agent import iter_agent_events

app = FastAPI(title="УК РФ RAG")

# Клиент крутится отдельно (CORS все allowed origins)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Описание случая для поиска статьи")


def ndjson_events(query: str):
    try:
        for event in iter_agent_events(query):
            yield json.dumps(event, ensure_ascii=False) + "\n"
    except Exception as e:
        yield json.dumps({"type": "error", "text": f"Ошибка агента: {e}"}, ensure_ascii=False) + "\n"


@app.post("/search")
def search(request: SearchRequest):
    return StreamingResponse(
        ndjson_events(request.query),
        media_type="application/x-ndjson",
    )


@app.get("/health")
def health():
    return {"status": "ok"}
