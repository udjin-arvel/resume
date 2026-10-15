from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import StrEnum
from typing import Callable, Protocol


class ChannelType(StrEnum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    TELEGRAM = "telegram"


@dataclass(frozen=True)
class NotificationMessage:
    recipient: str
    body: str
    subject: str | None = None


class Notifier(Protocol):
    def send(self, message: NotificationMessage) -> None: ...


class DeliveryLogger(Protocol):
    def log_delivery(self, channel: ChannelType, recipient: str, success: bool) -> None: ...


@dataclass
class NotificationBundle:
    notifier: Notifier
    logger: DeliveryLogger


class NotificationFactory(ABC):
    @abstractmethod
    def create_notifier(self) -> Notifier: ...

    @abstractmethod
    def create_logger(self) -> DeliveryLogger: ...

    def create_bundle(self) -> NotificationBundle:
        return NotificationBundle(
            notifier=self.create_notifier(),
            logger=self.create_logger(),
        )


class _InMemoryDeliveryLogger:
    def __init__(self, channel: ChannelType, sink: list[str] | None = None) -> None:
        self._channel = channel
        self._sink = sink if sink is not None else []

    def log_delivery(self, channel: ChannelType, recipient: str, success: bool) -> None:
        self._sink.append(f"{channel.value}:{recipient}:{'ok' if success else 'fail'}")


class EmailNotifier:
    def __init__(self, outbox: list[str] | None = None) -> None:
        self._outbox = outbox if outbox is not None else []

    def send(self, message: NotificationMessage) -> None:
        subject = message.subject or "(no subject)"
        self._outbox.append(f"EMAIL to {message.recipient}: {subject} — {message.body}")


class SmsNotifier:
    def __init__(self, outbox: list[str] | None = None) -> None:
        self._outbox = outbox if outbox is not None else []

    def send(self, message: NotificationMessage) -> None:
        self._outbox.append(f"SMS to {message.recipient}: {message.body}")


class PushNotifier:
    def __init__(self, outbox: list[str] | None = None) -> None:
        self._outbox = outbox if outbox is not None else []

    def send(self, message: NotificationMessage) -> None:
        self._outbox.append(f"PUSH to {message.recipient}: {message.body}")


class TelegramNotifier:
    def __init__(self, outbox: list[str] | None = None) -> None:
        self._outbox = outbox if outbox is not None else []

    def send(self, message: NotificationMessage) -> None:
        self._outbox.append(f"TELEGRAM to {message.recipient}: {message.body}")


class EmailNotificationFactory(NotificationFactory):
    def __init__(self, outbox: list[str] | None = None, logs: list[str] | None = None) -> None:
        self._outbox = outbox
        self._logs = logs

    def create_notifier(self) -> Notifier:
        return EmailNotifier(self._outbox)

    def create_logger(self) -> DeliveryLogger:
        return _InMemoryDeliveryLogger(ChannelType.EMAIL, self._logs)


class SmsNotificationFactory(NotificationFactory):
    def __init__(self, outbox: list[str] | None = None, logs: list[str] | None = None) -> None:
        self._outbox = outbox
        self._logs = logs

    def create_notifier(self) -> Notifier:
        return SmsNotifier(self._outbox)

    def create_logger(self) -> DeliveryLogger:
        return _InMemoryDeliveryLogger(ChannelType.SMS, self._logs)


class PushNotificationFactory(NotificationFactory):
    def __init__(self, outbox: list[str] | None = None, logs: list[str] | None = None) -> None:
        self._outbox = outbox
        self._logs = logs

    def create_notifier(self) -> Notifier:
        return PushNotifier(self._outbox)

    def create_logger(self) -> DeliveryLogger:
        return _InMemoryDeliveryLogger(ChannelType.PUSH, self._logs)


class TelegramNotificationFactory(NotificationFactory):
    def __init__(self, outbox: list[str] | None = None, logs: list[str] | None = None) -> None:
        self._outbox = outbox
        self._logs = logs

    def create_notifier(self) -> Notifier:
        return TelegramNotifier(self._outbox)

    def create_logger(self) -> DeliveryLogger:
        return _InMemoryDeliveryLogger(ChannelType.TELEGRAM, self._logs)


def _email_bundle_factory() -> NotificationBundle:
    return EmailNotificationFactory().create_bundle()


def _sms_bundle_factory() -> NotificationBundle:
    return SmsNotificationFactory().create_bundle()


def _push_bundle_factory() -> NotificationBundle:
    return PushNotificationFactory().create_bundle()


def _telegram_bundle_factory() -> NotificationBundle:
    return TelegramNotificationFactory().create_bundle()


FACTORY_REGISTRY: dict[ChannelType, Callable[[], NotificationBundle]] = {
    ChannelType.EMAIL: _email_bundle_factory,
    ChannelType.SMS: _sms_bundle_factory,
    ChannelType.PUSH: _push_bundle_factory,
    ChannelType.TELEGRAM: _telegram_bundle_factory,
}


class NotificationService:
    def __init__(
        self,
        registry: dict[ChannelType, Callable[[], NotificationBundle]] | None = None,
    ) -> None:
        self._registry = registry or FACTORY_REGISTRY

    def notify(self, channel: ChannelType, message: NotificationMessage) -> None:
        bundle = self._registry[channel]()
        try:
            bundle.notifier.send(message)
            bundle.logger.log_delivery(channel, message.recipient, True)
        except Exception:
            bundle.logger.log_delivery(channel, message.recipient, False)
            raise
