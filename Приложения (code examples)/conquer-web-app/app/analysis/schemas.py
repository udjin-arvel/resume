from typing import Any, Literal

from pydantic import BaseModel, Field


class RiskItem(BaseModel):
    level: Literal["high", "medium", "low"]
    text: str


class ScoreItem(BaseModel):
    label: str
    value: int = Field(ge=0, le=100)


class ContactItem(BaseModel):
    type: str
    value: str


class AnalysisMetrics(BaseModel):
    industry: str
    price_segment: str
    products: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    usp: list[str] = Field(default_factory=list)
    contacts: list[ContactItem] = Field(default_factory=list)
    tone: str | None = None
    risks: list[RiskItem] = Field(default_factory=list)
    scores: list[ScoreItem] = Field(default_factory=list)


class AnalysisOutput(BaseModel):
    summary: str
    metrics: AnalysisMetrics

    def metrics_dict(self) -> dict[str, Any]:
        return self.metrics.model_dump()
