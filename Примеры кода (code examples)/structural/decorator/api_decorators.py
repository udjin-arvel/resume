from __future__ import annotations

import functools
import json
import time
from collections import defaultdict, deque
from typing import Any, Callable, ParamSpec, Protocol, TypeVar

# Типизация параметров и результата функции 
P = ParamSpec("P") # P - параметры
R = TypeVar("R") # R - результат


# Протокол кэша
class CacheBackend(Protocol):
    def get(self, key: str) -> bytes | None: ...

    def set(self, key: str, value: bytes, ttl_seconds: float) -> None: ...


# Конкретный кэш в памяти
class InMemoryCache:
    def __init__(self, clock: Callable[[], float] | None = None) -> None:
        self._store: dict[str, tuple[bytes, float]] = {}
        self._clock = clock or time.monotonic

    def get(self, key: str) -> bytes | None:
        item = self._store.get(key)
        if item is None:
            return None
        value, expires_at = item
        if self._clock() >= expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: bytes, ttl_seconds: float) -> None:
        self._store[key] = (value, self._clock() + ttl_seconds)


# Функция для генерации ключа кэша
def _cache_key(func: Callable[..., Any], args: tuple[Any, ...], kwargs: dict[str, Any]) -> str:
    payload = {"func": func.__qualname__, "args": args, "kwargs": kwargs}
    return json.dumps(payload, sort_keys=True, default=str)


# Декоратор кэширования
def cached(
    timeout: float = 60.0,
    cache: CacheBackend | None = None,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    backend = cache or InMemoryCache()

    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            key = _cache_key(func, args, kwargs)
            hit = backend.get(key)
            if hit is not None:
                return json.loads(hit.decode("utf-8"))
            result = func(*args, **kwargs)
            backend.set(key, json.dumps(result).encode("utf-8"), timeout)
            return result

        return wrapper

    return decorator


# Декоратор лимита скорости
def rate_limiter(
    max_calls: int,
    period: float,
    clock: Callable[[], float] | None = None,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    if max_calls <= 0:
        raise ValueError("max_calls must be positive")
    monotonic = clock or time.monotonic
    buckets: dict[str, deque[float]] = defaultdict(deque)

    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            key = func.__qualname__
            now = monotonic()
            q = buckets[key]
            while q and now - q[0] >= period:
                q.popleft()
            if len(q) >= max_calls:
                raise RateLimitExceededError(f"rate limit for {key}")
            q.append(now)
            return func(*args, **kwargs)

        return wrapper

    return decorator


# Декоратор логирования
def audit_log(sink: list[str] | None = None) -> Callable[[Callable[P, R]], Callable[P, R]]:
    log = sink if sink is not None else []

    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            log.append(f"call {func.__name__}")
            return func(*args, **kwargs)

        return wrapper

    return decorator
