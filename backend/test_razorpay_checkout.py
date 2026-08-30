"""Razorpay checkout — order creation, signature verify, idempotency, failure handling."""

from __future__ import annotations

import hashlib
import hmac
import os
from unittest.mock import MagicMock, patch

import pytest

from payment_store import create_order_record, get_order, reset_store_for_tests, resolve_plan_amount
import razorpay_checkout as checkout


@pytest.fixture(autouse=True)
def clean_payment_store():
    reset_store_for_tests()
    yield
    reset_store_for_tests()


@pytest.fixture
def test_secret():
    secret = "test_secret_for_hmac"
    with patch.dict(os.environ, {"RAZORPAY_KEY_SECRET": secret, "RAZORPAY_KEY_ID": "rzp_test_abc"}):
        yield secret


def _sign(order_id: str, payment_id: str, secret: str) -> str:
    body = f"{order_id}|{payment_id}"
    return hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()


class TestPlanPricing:
    def test_resolve_sandbox_plan(self):
        plan_id, amount = resolve_plan_amount("sandbox")
        assert plan_id == "sandbox"
        assert amount == 1499.0

    def test_resolve_growth_plan(self):
        plan_id, amount = resolve_plan_amount("growth")
        assert plan_id == "growth"
        assert amount == 499.0

    def test_unknown_plan_rejected(self):
        with pytest.raises(ValueError, match="Unknown plan_id"):
            resolve_plan_amount("enterprise")


class TestOrderCreation:
    def test_unconfigured_mode_uses_server_price(self):
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("RAZORPAY_KEY_ID", None)
            os.environ.pop("RAZORPAY_KEY_SECRET", None)
            result = checkout.create_checkout_order(plan_id="sandbox")
        assert result["mode"] == "unconfigured"
        assert result["amount_inr"] == 1499.0
        assert result["plan_id"] == "sandbox"
        record = get_order(result["order"]["id"])
        assert record is not None
        assert record["status"] == "created"
        assert record["amount_inr"] == 1499.0

    def test_client_amount_not_used(self):
        """Order amount always comes from PLAN_PRICES_INR, not caller input."""
        with patch.dict(os.environ, {}, clear=True):
            result = checkout.create_checkout_order(plan_id="sandbox")
        assert result["amount_inr"] == 1499.0

    @patch("razorpay_checkout.requests.post")
    def test_razorpay_api_called_with_server_amount(self, mock_post, test_secret):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "id": "order_live_test_001",
            "amount": 149900,
            "currency": "INR",
            "receipt": "rs_abc",
        }
        mock_resp.raise_for_status = MagicMock()
        mock_post.return_value = mock_resp

        result = checkout.create_checkout_order(plan_id="sandbox", wedge="checkout_failed")
        assert result["mode"] == "razorpay"
        assert result["amount_inr"] == 1499.0
        call_json = mock_post.call_args.kwargs["json"]
        assert call_json["amount"] == 149900

    def test_live_keys_rejected(self):
        with patch.dict(
            os.environ,
            {"RAZORPAY_KEY_ID": "rzp_live_bad", "RAZORPAY_KEY_SECRET": "secret"},
        ):
            with patch("razorpay_checkout.requests.post") as mock_post:
                with pytest.raises(ValueError, match="Test Mode"):
                    checkout.create_checkout_order(plan_id="sandbox")
                mock_post.assert_not_called()


class TestSignatureVerification:
    def test_valid_signature(self, test_secret):
        oid, pid = "order_1", "pay_1"
        sig = _sign(oid, pid, test_secret)
        assert checkout.verify_payment_signature(oid, pid, sig) is True

    def test_invalid_signature_rejected(self, test_secret):
        assert checkout.verify_payment_signature("order_1", "pay_1", "bad_sig") is False

    def test_verify_without_secret_fails(self):
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("RAZORPAY_KEY_SECRET", None)
            assert checkout.verify_payment_signature("o", "p", "s") is False


class TestPaymentSuccess:
    def test_success_marks_paid(self, test_secret):
        create_order_record(
            order_id="order_ok",
            plan_id="sandbox",
            amount_inr=1499.0,
            amount_paise=149900,
            wedge="checkout_failed",
            receipt="rs_1",
            razorpay_mode="razorpay",
        )
        pid = "pay_ok_1"
        sig = _sign("order_ok", pid, test_secret)
        result = checkout.handle_payment_success(order_id="order_ok", payment_id=pid, signature=sig)
        assert result["status"] == "paid"
        assert result["recovered"] is True
        assert result["duplicate"] is False
        assert get_order("order_ok")["status"] == "paid"

    def test_invalid_signature_raises(self, test_secret):
        create_order_record(
            order_id="order_bad_sig",
            plan_id="sandbox",
            amount_inr=1499.0,
            amount_paise=149900,
            wedge="checkout_failed",
            receipt="rs_2",
            razorpay_mode="razorpay",
        )
        with pytest.raises(ValueError, match="Invalid payment signature"):
            checkout.handle_payment_success(
                order_id="order_bad_sig",
                payment_id="pay_x",
                signature="not_valid",
            )

    def test_duplicate_verify_is_idempotent(self, test_secret):
        create_order_record(
            order_id="order_dup",
            plan_id="sandbox",
            amount_inr=1499.0,
            amount_paise=149900,
            wedge="checkout_failed",
            receipt="rs_3",
            razorpay_mode="razorpay",
        )
        pid = "pay_dup_1"
        sig = _sign("order_dup", pid, test_secret)
        first = checkout.handle_payment_success(order_id="order_dup", payment_id=pid, signature=sig)
        second = checkout.handle_payment_success(order_id="order_dup", payment_id=pid, signature=sig)
        assert first["duplicate"] is False
        assert second["duplicate"] is True
        assert second["status"] == "paid"

    def test_same_payment_id_different_order_rejected(self, test_secret):
        for oid in ("order_a", "order_b"):
            create_order_record(
                order_id=oid,
                plan_id="sandbox",
                amount_inr=1499.0,
                amount_paise=149900,
                wedge="checkout_failed",
                receipt=f"rs_{oid}",
                razorpay_mode="razorpay",
            )
        pid = "pay_shared"
        sig_a = _sign("order_a", pid, test_secret)
        checkout.handle_payment_success(order_id="order_a", payment_id=pid, signature=sig_a)
        sig_b = _sign("order_b", pid, test_secret)
        with pytest.raises(ValueError, match="payment_id already used"):
            checkout.handle_payment_success(order_id="order_b", payment_id=pid, signature=sig_b)


class TestPaymentFailure:
    @patch("policy_bridge.recommend_live")
    def test_failure_triggers_policy_and_marks_failed(self, mock_recommend):
        mock_recommend.return_value = {"selected_action": "send_payment_link"}
        create_order_record(
            order_id="order_fail",
            plan_id="sandbox",
            amount_inr=1499.0,
            amount_paise=149900,
            wedge="checkout_failed",
            receipt="rs_fail",
            razorpay_mode="razorpay",
        )
        result = checkout.handle_payment_failed(
            order_id="order_fail",
            payment_id="pay_fail_1",
            error_code="BAD_REQUEST_ERROR",
            error_description="insufficient funds",
        )
        assert result["status"] == "failed"
        assert result["recovered"] is False
        assert result["failure_reason"] == "insufficient_funds"
        assert get_order("order_fail")["status"] == "failed"
        mock_recommend.assert_called_once()

    def test_failure_on_paid_order_rejected(self, test_secret):
        create_order_record(
            order_id="order_paid",
            plan_id="sandbox",
            amount_inr=1499.0,
            amount_paise=149900,
            wedge="checkout_failed",
            receipt="rs_paid",
            razorpay_mode="razorpay",
        )
        pid = "pay_paid"
        sig = _sign("order_paid", pid, test_secret)
        checkout.handle_payment_success(order_id="order_paid", payment_id=pid, signature=sig)
        result = checkout.handle_payment_failed(
            order_id="order_paid",
            payment_id="pay_late",
            error_code="X",
            error_description="late fail",
        )
        assert result["ok"] is False
        assert result["status"] == "paid"


class TestCheckoutLifecycle:
    def test_cancelled_status(self):
        create_order_record(
            order_id="order_cancel",
            plan_id="sandbox",
            amount_inr=1499.0,
            amount_paise=149900,
            wedge="checkout_failed",
            receipt="rs_cancel",
            razorpay_mode="razorpay",
        )
        opened = checkout.handle_checkout_opened("order_cancel")
        assert opened["status"] == "pending"
        cancelled = checkout.handle_checkout_cancelled("order_cancel")
        assert cancelled["status"] == "cancelled"
