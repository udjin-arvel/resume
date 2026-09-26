from urllib.parse import quote, urlparse


class InvalidUrlError(ValueError):
    pass


def normalize_url(raw: str) -> str:
    value = (raw or "").strip()
    if not value:
        raise InvalidUrlError("URL is required")

    if "://" not in value:
        value = f"https://{value}"

    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise InvalidUrlError("Enter a valid http(s) URL")

    return value
