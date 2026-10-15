from api_decorators import (
    InMemoryCache,
    RateLimitExceededError,
    audit_log,
    cached,
    rate_limiter,
)

_calls = 0


@cached(timeout=60.0)
def expensive(x: int) -> int:
    global _calls
    _calls += 1
    return x * 2


def test_cached_uses_backend() -> None:
    global _calls
    _calls = 0
    assert expensive(3) == 6
    assert expensive(3) == 6
    assert _calls == 1


def test_rate_limiter_blocks() -> None:
    t = 0.0

    def clock() -> float:
        return t

    @rate_limiter(max_calls=2, period=10.0, clock=clock)
    def api() -> str:
        return "ok"

    assert api() == "ok"
    assert api() == "ok"
    try:
        api()
    except RateLimitExceededError:
        pass
    else:
        raise AssertionError("expected rate limit")


def test_audit_log() -> None:
    lines: list[str] = []

    @audit_log(sink=lines)
    def ping() -> int:
        return 1

    assert ping() == 1
    assert lines == ["call ping"]


def test_cache_ttl_expiry() -> None:
    t = 0.0

    def clock() -> float:
        return t

    cache = InMemoryCache(clock=clock)
    invocations = 0

    @cached(timeout=5.0, cache=cache)
    def work(n: int) -> int:
        nonlocal invocations
        invocations += 1
        return n

    assert work(1) == 1
    assert invocations == 1
    t = 6.0
    assert work(1) == 1
    assert invocations == 2
