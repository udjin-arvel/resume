"""Сообщения об ошибках Atlas для клиента (Kafka)."""
import httpx

from services.atlasai_service import (
    _ATLAS_POLL_CONNECT_TIMEOUT_RU,
    _ATLAS_POLL_READ_TIMEOUT_RU,
    _ATLAS_HTTP_TIMEOUT_RU,
    _error_message_for_atlas_exception,
)


def test_connect_timeout_user_message():
    assert _error_message_for_atlas_exception(httpx.ConnectTimeout("connect")) == _ATLAS_POLL_CONNECT_TIMEOUT_RU


def test_read_timeout_user_message():
    assert _error_message_for_atlas_exception(httpx.ReadTimeout("read")) == _ATLAS_POLL_READ_TIMEOUT_RU


def test_generic_httpx_timeout_not_atlas_request_timed_out():
    msg = _error_message_for_atlas_exception(httpx.WriteTimeout("write"))
    assert msg == _ATLAS_HTTP_TIMEOUT_RU
    assert "Превышено время ожидания ответа. Попробуйте позже" not in msg
