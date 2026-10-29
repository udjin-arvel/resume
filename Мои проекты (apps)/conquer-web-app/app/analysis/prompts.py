import json
from typing import Any

SYSTEM_PROMPT = """Ты аналитик конкурентных сайтов.
По входным данным парсинга верни строго один JSON-объект (без markdown) со схемой:
{
  "summary": "краткая сводка на русском (2-5 предложений)",
  "metrics": {
    "industry": "отрасль",
    "price_segment": "ценовой сегмент",
    "products": ["продукты/услуги"],
    "keywords": ["ключевые слова"],
    "usp": ["уникальные торговые предложения"],
    "contacts": [{"type": "email|phone|other", "value": "..."}],
    "tone": "тональность контента/отзывов или null",
    "risks": [{"level": "high|medium|low", "text": "..."}],
    "scores": [{"label": "...", "value": 0-100}]
  }
}
Оценивай только по данным. Если данных мало — честно отрази это в summary и risks.
Пиши на русском языке.
"""

JSON_REPAIR_PROMPT = (
    "Предыдущий ответ был невалидным JSON или не соответствовал схеме. "
    "Верни только исправленный валидный JSON-объект по схеме из system-сообщения."
)


def build_user_payload(parsed: dict[str, Any], max_text_chars: int) -> dict[str, Any]:
    text = parsed.get("text_content") or ""
    if len(text) > max_text_chars:
        text = text[:max_text_chars]

    links = parsed.get("links") or []
    if isinstance(links, list) and len(links) > 50:
        links = links[:50]

    return {
        "url": parsed.get("url"),
        "title": parsed.get("title"),
        "description": parsed.get("description"),
        "headings": parsed.get("headings") or [],
        "contacts": parsed.get("contacts") or {},
        "prices": parsed.get("prices") or [],
        "links": links,
        "text_content": text,
        "meta": parsed.get("meta") or {},
    }


def build_user_message(parsed: dict[str, Any], max_text_chars: int) -> str:
    payload = build_user_payload(parsed, max_text_chars)
    return json.dumps(payload, ensure_ascii=False)
