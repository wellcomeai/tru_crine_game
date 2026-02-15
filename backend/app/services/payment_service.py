"""
Robokassa payment integration for case purchases.
"""
import hashlib
import json
import logging
from datetime import datetime
from decimal import Decimal
from urllib.parse import quote

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Case, User
from app.models.case_purchase import CasePurchase

logger = logging.getLogger(__name__)


class PaymentService:

    def generate_payment_url(
        self,
        invoice_number: int,
        amount: Decimal,
        description: str,
        user_email: str = "",
    ) -> str:
        """Generate a signed Robokassa payment URL."""
        merchant_login = settings.ROBOKASSA_MERCHANT_LOGIN
        password1 = settings.ROBOKASSA_PASSWORD_1
        out_sum = f"{amount:.2f}"

        # Receipt for 54-FZ compliance
        receipt = {
            "sno": "usn_income",
            "items": [{
                "name": description[:128],
                "quantity": 1,
                "sum": float(amount),
                "payment_method": "full_payment",
                "payment_object": "service",
                "tax": "none",
            }]
        }

        receipt_json = json.dumps(receipt, ensure_ascii=False)
        receipt_encoded = quote(receipt_json)

        # Signature: MD5(MerchantLogin:OutSum:InvId:Receipt:Password1)
        sign_string = f"{merchant_login}:{out_sum}:{invoice_number}:{password1}"
        signature = hashlib.md5(sign_string.encode()).hexdigest()

        base_url = "https://auth.robokassa.ru/Merchant/Index.aspx"
        is_test = getattr(settings, 'ROBOKASSA_TEST_MODE', 'true').lower() == 'true'

        params = (
            f"MerchantLogin={merchant_login}"
            f"&OutSum={out_sum}"
            f"&InvId={invoice_number}"
            f"&Description={quote(description)}"
            f"&SignatureValue={signature}"
            f"&Receipt={receipt_encoded}"
            f"&Culture=ru"
        )
        if user_email:
            params += f"&Email={quote(user_email)}"
        if is_test:
            params += "&IsTest=1"

        return f"{base_url}?{params}"

    def verify_callback_signature(
        self, out_sum: str, inv_id: str, signature_value: str
    ) -> bool:
        """Verify callback signature from Robokassa (Password2)."""
        password2 = settings.ROBOKASSA_PASSWORD_2
        expected = hashlib.md5(
            f"{out_sum}:{inv_id}:{password2}".encode()
        ).hexdigest().upper()
        return expected == signature_value.upper()

    async def create_purchase_payment(
        self, user: User, case: Case, db: AsyncSession
    ) -> dict:
        """Create a payment for purchasing a case."""
        price = Decimal(str(case.price or 0))
        if price <= 0:
            raise ValueError("Case is free, no payment needed")

        # Check for existing purchase record (any status)
        existing = await db.execute(
            select(CasePurchase).where(
                CasePurchase.user_id == user.id,
                CasePurchase.case_id == case.id,
            )
        )
        purchase = existing.scalar_one_or_none()

        if purchase:
            # Already paid — no need to pay again
            if purchase.status == "completed":
                raise ValueError("Case already purchased")

            # Pending or cancelled — reuse the record with a new invoice
            result = await db.execute(text("SELECT nextval('invoice_number_seq')"))
            invoice_number = result.scalar()

            purchase.status = "pending"
            purchase.amount = price
            purchase.invoice_number = invoice_number
            purchase.paid_at = None
            purchase.callback_data = None
            await db.flush()
        else:
            # First time buying — create new record
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
        payment_url = self.generate_payment_url(
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
        self, out_sum: str, inv_id: str, signature_value: str, db: AsyncSession
    ) -> str:
        """Process Robokassa Result URL callback (server-to-server)."""
        # 1. Verify signature
        if not self.verify_callback_signature(out_sum, inv_id, signature_value):
            raise ValueError("Invalid signature")

        # 2. Find purchase
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
        callback_amount = Decimal(out_sum).quantize(Decimal("0.01"))
        expected_amount = Decimal(str(purchase.amount)).quantize(Decimal("0.01"))
        if callback_amount != expected_amount:
            purchase.status = "failed"
            await db.commit()
            raise ValueError(f"Amount mismatch: {callback_amount} != {expected_amount}")

        # 5. Activate purchase
        purchase.status = "completed"
        purchase.paid_at = datetime.utcnow()
        purchase.callback_data = {
            "OutSum": out_sum,
            "InvId": inv_id,
            "SignatureValue": signature_value,
        }

        await db.commit()
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
