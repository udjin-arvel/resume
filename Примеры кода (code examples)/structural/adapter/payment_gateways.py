from __future__ import annotations

import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Protocol


# Тип ошибки платежного шлюза
class PaymentGatewayError(Exception):
    pass


# Тип запроса платежа (немутабельный)
@dataclass(frozen=True)
class PaymentRequest:
    order_id: str
    amount_rub: int  # whole rubles


# Тип результата платежа (немутабельный)
@dataclass(frozen=True)
class PaymentResult:
    payment_id: str


# Протокол платежного шлюза
class PaymentGateway(Protocol):
    def charge(self, request: PaymentRequest) -> PaymentResult: ...


# Конкретный клиент (Stripe)
class StripeClient:
    def create_charge(self, merchant_order_id: str, amount: int) -> dict[str, str]:
        if amount <= 0:
            raise ValueError("invalid amount")
        return {"id": f"ch_{merchant_order_id}", "status": "succeeded"}


# Адаптер для Stripe
class StripeAdapter:
    def __init__(self, sdk: StripeClient) -> None:
        self._sdk = sdk

    def charge(self, request: PaymentRequest) -> PaymentResult:
        try:
            raw = self._sdk.create_charge(request.order_id, request.amount_rub)
        except ValueError as exc:
            raise PaymentGatewayError(str(exc)) from exc
        return PaymentResult(payment_id=raw["id"])


# Конкретный клиент (некий OldBankXml)
class OldBankXmlClient:
    def post_xml(self, payload: str) -> str:
        root = ET.fromstring(payload)
        order = root.findtext("OrderId", "")
        kopecks = int(root.findtext("AmountKopecks", "0"))
        if kopecks <= 0:
            return (
                "<Response><Code>ERR</Code><Message>bad amount</Message></Response>"
            )
        return (
            f"<Response><Code>OK</Code><TransactionId>bank-{order}</TransactionId>"
            f"<AmountKopecks>{kopecks}</AmountKopecks></Response>"
        )


# Адаптер для OldBankXml
class OldBankXmlAdapter:
    def __init__(self, client: OldBankXmlClient) -> None:
        self._client = client

    def charge(self, request: PaymentRequest) -> PaymentResult:
        kopecks = request.amount_rub * 100
        payload = (
            f"<Payment><OrderId>{request.order_id}</OrderId>"
            f"<AmountKopecks>{kopecks}</AmountKopecks></Payment>"
        )
        response_xml = self._client.post_xml(payload)
        root = ET.fromstring(response_xml)
        code = root.findtext("Code", "ERR")
        if code != "OK":
            message = root.findtext("Message", "payment failed")
            raise PaymentGatewayError(message)
        tx_id = root.findtext("TransactionId")
        if not tx_id:
            raise PaymentGatewayError("missing transaction id")
        return PaymentResult(payment_id=tx_id)


# Функция для обработки платежа
def process_payment(gateway: PaymentGateway, request: PaymentRequest) -> PaymentResult:
    return gateway.charge(request)
