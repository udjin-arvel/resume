from notifications import (
    ChannelType,
    EmailNotificationFactory,
    NotificationMessage,
    NotificationService,
    TelegramNotificationFactory,
)


def test_email_factory_bundle() -> None:
    outbox: list[str] = []
    logs: list[str] = []
    factory = EmailNotificationFactory(outbox=outbox, logs=logs)
    bundle = factory.create_bundle()
    msg = NotificationMessage(recipient="a@b.c", body="Hello", subject="Hi")
    bundle.notifier.send(msg)
    bundle.logger.log_delivery(ChannelType.EMAIL, msg.recipient, True)
    assert any("EMAIL" in line for line in outbox)
    assert logs == ["email:a@b.c:ok"]


def test_notification_service_uses_registry() -> None:
    service = NotificationService()
    service.notify(
        ChannelType.TELEGRAM,
        NotificationMessage(recipient="@user", body="Price drop"),
    )


def test_telegram_factory_via_class() -> None:
    outbox: list[str] = []
    factory = TelegramNotificationFactory(outbox=outbox)
    factory.create_notifier().send(NotificationMessage(recipient="1", body="x"))
    assert outbox[0].startswith("TELEGRAM")
