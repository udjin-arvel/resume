from __future__ import annotations

import asyncio
from dataclasses import dataclass
from decimal import Decimal
from typing import Awaitable, Callable, Protocol


@dataclass(frozen=True)
class PriceChangedEvent:
    product_id: str
    old_price: Decimal
    new_price: Decimal
    currency: str = "RUB"


class PriceObserver(Protocol):
    async def update(self, event: PriceChangedEvent) -> None: ...


PriceCallback = Callable[[PriceChangedEvent], Awaitable[None]]


class EmailNotifier:
    def __init__(self, outbox: list[str] | None = None) -> None:
        self._outbox = outbox if outbox is not None else []

    async def update(self, event: PriceChangedEvent) -> None:
        self._outbox.append(
            f"email:{event.product_id}:{event.old_price}->{event.new_price}"
        )


class TelegramBotNotifier:
    def __init__(self, outbox: list[str] | None = None) -> None:
        self._outbox = outbox if outbox is not None else []

    async def update(self, event: PriceChangedEvent) -> None:
        self._outbox.append(f"tg:{event.product_id}:{event.new_price}")


class AnalyticsTracker:
    def __init__(self, events: list[PriceChangedEvent] | None = None) -> None:
        self._events = events if events is not None else []

    async def update(self, event: PriceChangedEvent) -> None:
        self._events.append(event)


class AsyncEventDispatcher:
    def __init__(self) -> None:
        self._observers: list[PriceObserver] = []
        self._callbacks: list[PriceCallback] = []

    def subscribe(self, observer: PriceObserver) -> None:
        self._observers.append(observer)

    def subscribe_callback(self, callback: PriceCallback) -> None:
        self._callbacks.append(callback)

    async def publish(self, event: PriceChangedEvent) -> list[BaseException | None]:
        tasks = [o.update(event) for o in self._observers]
        tasks.extend(cb(event) for cb in self._callbacks)
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return list(results)


class PriceTracker:
    def __init__(self, dispatcher: AsyncEventDispatcher) -> None:
        self._dispatcher = dispatcher
        self._prices: dict[str, Decimal] = {}

    async def set_price(self, product_id: str, price: Decimal, currency: str = "RUB") -> None:
        old = self._prices.get(product_id, price)
        self._prices[product_id] = price
        if old != price:
            await self._dispatcher.publish(
                PriceChangedEvent(
                    product_id=product_id,
                    old_price=old,
                    new_price=price,
                    currency=currency,
                )
            )
