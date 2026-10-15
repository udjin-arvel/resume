import asyncio
from decimal import Decimal

from price_tracker import (
    AnalyticsTracker,
    AsyncEventDispatcher,
    EmailNotifier,
    PriceChangedEvent,
    PriceTracker,
)


async def test_dispatcher_notifies_all() -> None:
    email_box: list[str] = []
    analytics_events: list[PriceChangedEvent] = []
    dispatcher = AsyncEventDispatcher()
    dispatcher.subscribe(EmailNotifier(email_box))
    dispatcher.subscribe(AnalyticsTracker(analytics_events))

    cb_log: list[str] = []

    async def on_price(event: PriceChangedEvent) -> None:
        cb_log.append(event.product_id)

    dispatcher.subscribe_callback(on_price)

    tracker = PriceTracker(dispatcher)
    await tracker.set_price("sku-1", Decimal("100"))
    await tracker.set_price("sku-1", Decimal("90"))

    assert len(email_box) == 1
    assert analytics_events[0].new_price == Decimal("90")
    assert cb_log == ["sku-1"]


def test_async_entry() -> None:
    asyncio.run(test_dispatcher_notifies_all())
