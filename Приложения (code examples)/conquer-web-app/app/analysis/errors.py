class AnalysisError(Exception):
    """Raised when DeepSeek analysis fails after retries."""


class MissingApiKeyError(Exception):
    """Raised when DEEPSEEK_API_KEY is not configured."""


class AlreadyAnalyzedError(Exception):
    """Raised when AnalysisResult already exists for the request."""


class NoParsedDataError(Exception):
    """Raised when ParsedData is missing for the request."""


class RequestNotFoundError(Exception):
    """Raised when AnalysisRequest does not exist."""
