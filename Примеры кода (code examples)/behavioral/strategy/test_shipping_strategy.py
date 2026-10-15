from decimal import Decimal

from shipping_strategy import (
    DHLDelivery,
    Order,
    OrderShipping,
    PickPointDelivery,
    SelfPickup,
    self_pickup_fn,
)


def _sample() -> Order:
    return Order(
        order_id="o1",
        weight_kg=Decimal("2"),
        distance_km=Decimal("100"),
        subtotal_rub=Decimal("1500"),
    )


def test_dhl_strategy() -> None:
    shipping = OrderShipping(DHLDelivery())
    total = shipping.total_with_delivery(_sample())
    assert total == Decimal("1500") + Decimal("400")


def test_pickpoint_free_threshold() -> None:
    order = Order("o2", Decimal("1"), Decimal("10"), Decimal("5000"))
    assert PickPointDelivery().calculate(order) == Decimal("0")


def test_function_strategy() -> None:
    shipping = OrderShipping(self_pickup_fn)
    assert shipping.total_with_delivery(_sample()) == Decimal("1500")


def test_self_pickup_class() -> None:
    assert SelfPickup().calculate(_sample()) == Decimal("0")
