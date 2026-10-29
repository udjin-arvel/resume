from abc import ABC, abstractmethod

from app.parsers.schemas import ParseResult


class ParseError(Exception):
    """Raised when page fetch or extraction fails (timeout, captcha, network)."""


class BaseParser(ABC):
    @abstractmethod
    async def parse(self, url: str) -> ParseResult:
        raise NotImplementedError
