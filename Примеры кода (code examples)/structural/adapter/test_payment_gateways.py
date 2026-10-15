from payment_gateways import (
    OldBankXmlAdapter,
    OldBankXmlClient,
    PaymentGatewayError,
    PaymentRequest,
    StripeAdapter,
    StripeClient,
    process_payment,
)


def test_stripe_adapter() -> None:
    result = StripeAdapter(StripeClient()).charge(
        PaymentRequest(order_id="ord-1", amount_rub=500)
    )
    assert result.payment_id == "ch_ord-1"


def test_old_bank_xml_adapter() -> None:
    result = OldBankXmlAdapter(OldBankXmlClient()).charge(
        PaymentRequest(order_id="42", amount_rub=10)
    )
    assert result.payment_id == "bank-42"


def test_process_payment_polymorphic() -> None:
    gw: StripeAdapter | OldBankXmlAdapter = StripeAdapter(StripeClient())
    assert process_payment(gw, PaymentRequest("x", 1)).payment_id.startswith("ch_")


def test_bank_error_mapping() -> None:
    client = OldBankXmlClient()
    adapter = OldBankXmlAdapter(client)
    try:
        adapter.charge(PaymentRequest("bad", amount_rub=0))
    except PaymentGatewayError:
        pass
    else:
        raise AssertionError("expected PaymentGatewayError")
