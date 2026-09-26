import re
from urllib.parse import urljoin, urlparse

EMAIL_RE = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
    re.IGNORECASE,
)
PHONE_RE = re.compile(
    r"(?:\+?\d[\d\-\s().]{7,}\d)",
)
PRICE_RE = re.compile(
    r"(?:₽|руб\.?|USD|EUR|\$|€)\s?\d[\d\s.,]*|\d[\d\s.,]*\s?(?:₽|руб\.?|USD|EUR|\$|€)",
    re.IGNORECASE,
)

CAPTCHA_MARKERS = (
    "captcha",
    "cf-challenge",
    "just a moment",
    "attention required",
    "verify you are human",
    "checking your browser",
)


def extract_emails(text: str) -> list[str]:
    found = {m.group(0).lower() for m in EMAIL_RE.finditer(text or "")}
    return sorted(found)


def extract_phones(text: str) -> list[str]:
    found: set[str] = set()
    for match in PHONE_RE.finditer(text or ""):
        raw = match.group(0).strip()
        digits = re.sub(r"\D", "", raw)
        if 8 <= len(digits) <= 15:
            found.add(re.sub(r"\s+", " ", raw))
    return sorted(found)


def extract_prices(text: str, limit: int = 50) -> list[str]:
    seen: set[str] = set()
    prices: list[str] = []
    for match in PRICE_RE.finditer(text or ""):
        value = re.sub(r"\s+", " ", match.group(0).strip())
        if value not in seen:
            seen.add(value)
            prices.append(value)
        if len(prices) >= limit:
            break
    return prices


def normalize_link(base_url: str, href: str | None) -> str | None:
    if not href:
        return None
    href = href.strip()
    if href.startswith(("#", "javascript:", "data:")):
        return None
    absolute = urljoin(base_url, href)
    parsed = urlparse(absolute)
    if parsed.scheme not in ("http", "https", "mailto", "tel"):
        return None
    return absolute


def looks_like_captcha(title: str | None, body_text: str | None) -> bool:
    haystack = f"{title or ''} {body_text or ''}".lower()
    return any(marker in haystack for marker in CAPTCHA_MARKERS)
