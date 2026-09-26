from typing import Any

from pydantic import BaseModel, Field


class ParseResult(BaseModel):
    url: str
    title: str | None = None
    description: str | None = None
    text_content: str | None = None
    headings: list[str] = Field(default_factory=list)
    links: list[dict[str, str]] = Field(default_factory=list)
    prices: list[str] = Field(default_factory=list)
    contacts: dict[str, list[str]] = Field(default_factory=lambda: {"emails": [], "phones": []})
    meta: dict[str, Any] = Field(default_factory=dict)
