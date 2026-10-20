from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Callable, Protocol


# Тип заказа (немутабельный)
@dataclass(frozen=True)
class Order:
    order_id: str
    weight_kg: Decimal
    distance_km: Decimal
    subtotal_rub: Decimal


# Протокол стратегии доставки
class DeliveryStrategy(Protocol):
    def calculate(self, order: Order) -> Decimal: ...


# Конкретная стратегии
class DHLDelivery:
    def __init__(self, base_rate: Decimal = Decimal("300"), per_kg: Decimal = Decimal("50")) -> None:
        self._base = base_rate
        self._per_kg = per_kg

    def calculate(self, order: Order) -> Decimal:
        express = Decimal("1.2") if order.distance_km > Decimal("500") else Decimal("1.0")
        return (self._base + order.weight_kg * self._per_kg) * express

class PickPointDelivery:
    def __init__(
        self,
        zone_fee: Decimal = Decimal("199"),
        free_from: Decimal = Decimal("3000"),
    ) -> None:
        self._zone_fee = zone_fee
        self._free_from = free_from

    def calculate(self, order: Order) -> Decimal:
        if order.subtotal_rub >= self._free_from:
            return Decimal("0")
        return self._zone_fee

class SelfPickup:
    def calculate(self, order: Order) -> Decimal:
        return Decimal("0")


# Тип колбэка доставки
DeliveryFn = Callable[[Order], Decimal]


# Колбэк доставки для самовывоза
def self_pickup_fn(_order: Order) -> Decimal:
    return Decimal("0")


# Контекст доставки (конкретная стратегия доставки передается в конструктор)
class OrderShipping:
    def __init__(self, strategy: DeliveryStrategy | DeliveryFn) -> None:
        self._strategy = strategy

    def total_with_delivery(self, order: Order) -> Decimal:
        if hasattr(self._strategy, "calculate"):
            delivery = self._strategy.calculate(order)
        else:
            delivery = self._strategy(order)
        return order.subtotal_rub + delivery
