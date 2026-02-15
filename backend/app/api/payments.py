"""
Payment endpoints for case purchases.
- POST /api/payments/buy/{case_id} - create payment, return URL
- POST|GET /api/payments/result - Robokassa callback (server-to-server)
- GET|POST /api/payments/success - redirect after successful payment
- GET|POST /api/payments/fail - redirect after failed payment
"""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Case, User
from app.services.auth_service import get_current_user
from app.services.payment_service import payment_service

logger = logging.getLogger(__name__)
router = APIRouter()

ADMIN_EMAIL = "well96well@gmail.com"


@router.post("/buy/{case_id}")
async def buy_case(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a payment for purchasing a case."""
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    price = float(case.price or 0)
    if price <= 0:
        raise HTTPException(400, "Case is free")

    # Admin gets free access
    if current_user.email == ADMIN_EMAIL:
        raise HTTPException(400, "Admin has free access")

    try:
        result = await payment_service.create_purchase_payment(
            current_user, case, db
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.api_route("/result", methods=["GET", "POST"])
async def payment_result(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Robokassa Result URL callback (server-to-server).
    Most critical endpoint - payment confirmation.
    """
    if request.method == "POST":
        form = await request.form()
        params = dict(form)
    else:
        params = dict(request.query_params)

    out_sum = params.get("OutSum", "")
    inv_id = params.get("InvId", "")
    signature = params.get("SignatureValue", "")

    if not all([out_sum, inv_id, signature]):
        return PlainTextResponse("ERROR: Missing parameters", status_code=400)

    try:
        result = await payment_service.process_callback(
            out_sum, inv_id, signature, db
        )
        return PlainTextResponse(result)
    except ValueError as e:
        logger.error("Payment callback error: %s", e)
        return PlainTextResponse(f"ERROR: {e}", status_code=400)


@router.api_route("/success", methods=["GET", "POST"])
async def payment_success():
    """Page after successful payment (user redirect)."""
    return HTMLResponse("""
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>Оплата успешна</title>
    <meta http-equiv="refresh" content="3;url=/"></head>
    <body style="display:flex;align-items:center;justify-content:center;
    height:100vh;font-family:sans-serif;background:#0a0a0a;color:#fff;">
    <div style="text-align:center;">
        <h1>Оплата прошла успешно!</h1>
        <p>Дело разблокировано. Переадресация через 3 секунды...</p>
    </div></body></html>
    """)


@router.api_route("/fail", methods=["GET", "POST"])
async def payment_fail():
    """Page after failed payment."""
    return HTMLResponse("""
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>Ошибка оплаты</title>
    <meta http-equiv="refresh" content="5;url=/"></head>
    <body style="display:flex;align-items:center;justify-content:center;
    height:100vh;font-family:sans-serif;background:#0a0a0a;color:#fff;">
    <div style="text-align:center;">
        <h1>Оплата не прошла</h1>
        <p>Попробуйте позже. Переадресация через 5 секунд...</p>
    </div></body></html>
    """)
