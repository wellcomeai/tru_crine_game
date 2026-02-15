"""
Robokassa Payment Service — production integration for Detective AI.

Handles:
  - Payment URL generation with MD5 signature
  - Callback signature verification
  - Receipt generation for 54-FZ fiscal compliance
  - Case purchase lifecycle (create, confirm, check access)
"""

import hashlib
import json
import logging
from datetime import datetime
from decimal import Decimal, InvalidOperation
from urllib.parse import urlencode

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Case, User
from app.models.case_purchase import CasePurchase

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Low-level Robokassa helpers
# ---------------------------------------------------------------------------

def _md5(value: str) -> str:
    """Return the MD5 hex digest of the given string."""
    return hashlib.md5(value.encode("utf-8")).hexdigest()


def _build_receipt(description: str, amount: Decimal) -> str:
    """
    Build a 54-FZ fiscal receipt as a JSON string.

    Returns raw JSON (NOT url-encoded) — encoding is handled by urlencode().
    """
    receipt = {
        "sno": "usn_income",
        "items": [
            {
                "name": description[:128],
                "quantity": 1,
                "sum": float(amount),
                "payment_method": "full_payment",
                "payment_object": "service",
                "tax": "none",
            }
        ],
    }
    return json.dumps(receipt, ensure_ascii=False)


def generate_payment_url(
    invoice_number: int,
    amount: Decimal,
    description: str,
    user_email: str = "",
) -> str:
    """
    Generate a signed Robokassa payment URL.

    Signature formula (with receipt):
        MD5(MerchantLogin:OutSum:InvId:Receipt:Password1)

    Signature formula (without receipt):
        MD5(MerchantLogin:OutSum:InvId:Password1)

    Parameters
    ----------
    invoice_number : int
        Unique invoice number (InvId).
    amount : Decimal
        Payment amount in RUB.
    description : str
        Payment description shown to the user.
    user_email : str, optional
        Buyer email for the receipt.

    Returns
    -------
    str
        Full URL to redirect the user to Robokassa.
    """
    merchant_login = settings.ROBOKASSA_MERCHANT_LOGIN
    password1 = settings.ROBOKASSA_PASSWORD_1

    if not merchant_login or not password1:
        raise ValueError("Robokassa credentials are not configured")

    out_sum = f"{amount:.2f}"

    # --- Receipt (54-FZ) — raw JSON string ---
    receipt_json = _build_receipt(description, amount)

    # --- Signature ---
    # IMPORTANT: use raw JSON in signature, NOT url-encoded
    sign_string = f"{merchant_login}:{out_sum}:{invoice_number}:{receipt_json}:{password1}"
    signature = _md5(sign_string)

    # --- Build URL via urlencode ---
    base_url = "https://auth.robokassa.ru/Merchant/Index.aspx"

    params: dict = {
        "MerchantLogin": merchant_login,
        "OutSum": out_sum,
        "InvId": invoice_number,
        "Description": description,
        "SignatureValue": signature,
        "Receipt": receipt_json,
        "Culture": "ru",
    }

    if user_email:
        params["Email"] = user_email

    if settings.ROBOKASSA_TEST_MODE:
        params["IsTest"] = 1

    url = f"{base_url}?{urlencode(params)}"

    logger.info(
        f"Generated Robokassa URL: InvId={invoice_number}, amount={out_sum}, "
        f"test_mode={settings.ROBOKASSA_TEST_MODE}"
    )
    return url


def verify_result_signature(out_sum: str, inv_id: str, signature: str) -> bool:
    """
    Verify the signature on Robokassa Result URL callback.

    Expected: MD5(OutSum:InvId:Password2)

    Parameters
    ----------
    out_sum : str
        The OutSum parameter from the callback.
    inv_id : str
        The InvId parameter from the callback.
    signature : str
        The SignatureValue parameter from the callback.

    Returns
    -------
    bool
        True if the signature is valid.
    """
    password2 = settings.ROBOKASSA_PASSWORD_2
    password1 = settings.ROBOKASSA_PASSWORD_1
    if not password2:
        logger.error("ROBOKASSA_PASSWORD_2 is not configured")
        return False

    sig_lower = signature.lower()

    # Try all combinations of passwords and OutSum formats
    passwords_to_try = {
        "Password2": password2,
        "Password1": password1,
    }
    sums_to_try = [out_sum]

    # Add normalized OutSum (2 decimal places)
    try:
        normalized = f"{Decimal(out_sum).quantize(Decimal('0.01'))}"
        if normalized != out_sum:
            sums_to_try.append(normalized)
    except (InvalidOperation, Exception):
        pass

    for pwd_name, pwd_value in passwords_to_try.items():
        if not pwd_value:
            continue
        for s in sums_to_try:
            expected = _md5(f"{s}:{inv_id}:{pwd_value}")
            if expected.lower() == sig_lower:
                if pwd_name == "Password2":
                    logger.info(f"Signature OK for InvId={inv_id} (OutSum='{s}')")
                else:
                    logger.error(
                        f"PASSWORDS SWAPPED! Signature matched with {pwd_name} "
                        f"for InvId={inv_id}. Fix env vars: swap ROBOKASSA_PASSWORD_1 and ROBOKASSA_PASSWORD_2"
                    )
                return pwd_name == "Password2"

    # Nothing matched at all — log debug info
    masked_pwd1 = password1[:3] + "***" + password1[-2:] if password1 and len(password1) > 5 else "***"
    masked_pwd2 = password2[:3] + "***" + password2[-2:] if len(password2) > 5 else "***"
    logger.warning(
        f"Signature mismatch for InvId={inv_id}: "
        f"received={signature}, "
        f"OutSum='{out_sum}', InvId='{inv_id}', "
        f"Pwd1_masked='{masked_pwd1}', Pwd1_len={len(password1) if password1 else 0}, "
        f"Pwd2_masked='{masked_pwd2}', Pwd2_len={len(password2)}"
    )

    return False


# ---------------------------------------------------------------------------
# Case purchase business logic
# ---------------------------------------------------------------------------

class PaymentService:
    """High-level service for case purchase payments."""

    async def create_purchase_payment(
        self, user: User, case: Case, db: AsyncSession
    ) -> dict:
        """Create a payment for purchasing a case."""
        price = Decimal(str(case.price or 0))
        if price <= 0:
            raise ValueError("Case is free, no payment needed")

        # Check for existing purchase record
        existing = await db.execute(
            select(CasePurchase).where(
                CasePurchase.user_id == user.id,
                CasePurchase.case_id == case.id,
            )
        )
        purchase = existing.scalar_one_or_none()

        if purchase:
            if purchase.status == "completed":
                raise ValueError("Case already purchased")

            # Reuse pending/cancelled/failed record with a new invoice
            result = await db.execute(text("SELECT nextval('invoice_number_seq')"))
            invoice_number = result.scalar()

            purchase.status = "pending"
            purchase.amount = price
            purchase.invoice_number = invoice_number
            purchase.paid_at = None
            purchase.callback_data = None
            await db.flush()
        else:
            # First time — create new record
            result = await db.execute(text("SELECT nextval('invoice_number_seq')"))
            invoice_number = result.scalar()

            purchase = CasePurchase(
                user_id=user.id,
                case_id=case.id,
                amount=price,
                payment_system="robokassa",
                invoice_number=invoice_number,
                status="pending",
            )
            db.add(purchase)
            await db.flush()

        # Generate payment URL
        description = f"Покупка дела: {case.title}"
        payment_url = generate_payment_url(
            invoice_number=invoice_number,
            amount=price,
            description=description,
            user_email=user.email or "",
        )

        await db.commit()

        return {
            "payment_url": payment_url,
            "invoice_number": invoice_number,
            "amount": float(price),
        }

    async def process_callback(
        self,
        out_sum: str,
        inv_id: str,
        signature_value: str,
        db: AsyncSession,
    ) -> str:
        """
        Process Robokassa Result URL callback (server-to-server).

        Returns "OK{InvId}" on success — required by Robokassa.
        Raises ValueError on any validation failure.
        """
        # 1. Verify signature
        if not verify_result_signature(out_sum, inv_id, signature_value):
            raise ValueError("Invalid signature")

        # 2. Find purchase (with row lock)
        result = await db.execute(
            select(CasePurchase)
            .where(CasePurchase.invoice_number == int(inv_id))
            .with_for_update()
        )
        purchase = result.scalar_one_or_none()
        if not purchase:
            raise ValueError(f"Purchase not found for InvId={inv_id}")

        # 3. Idempotency
        if purchase.status == "completed":
            return f"OK{inv_id}"

        # 4. Validate amount
        try:
            callback_amount = Decimal(out_sum).quantize(Decimal("0.01"))
            expected_amount = Decimal(str(purchase.amount)).quantize(Decimal("0.01"))
        except (InvalidOperation, AttributeError) as e:
            logger.error(f"Cannot parse amount for InvId={inv_id}: {e}")
            raise ValueError(f"Invalid amount format: {out_sum}")

        if callback_amount != expected_amount:
            purchase.status = "failed"
            await db.commit()
            raise ValueError(
                f"Amount mismatch: received={callback_amount}, expected={expected_amount}"
            )

        # 5. Activate purchase
        purchase.status = "completed"
        purchase.paid_at = datetime.utcnow()
        purchase.callback_data = {
            "OutSum": out_sum,
            "InvId": inv_id,
            "SignatureValue": signature_value,
        }

        await db.commit()
        logger.info(f"Payment processed successfully: InvId={inv_id}")
        return f"OK{inv_id}"

    async def has_access(
        self, user_id, case_id, db: AsyncSession
    ) -> bool:
        """Check if user has purchased access to a case."""
        result = await db.execute(
            select(CasePurchase).where(
                CasePurchase.user_id == user_id,
                CasePurchase.case_id == case_id,
                CasePurchase.status == "completed",
            )
        )
        return result.scalar_one_or_none() is not None


payment_service = PaymentService()
