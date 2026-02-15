import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class CasePurchase(Base):
    __tablename__ = "case_purchases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False, default=0)
    payment_system = Column(String(50), default="free")  # "robokassa", "free", "admin_grant"
    invoice_number = Column(Integer, nullable=True, unique=True)
    status = Column(String(20), default="completed")  # "pending", "completed", "failed", "cancelled"
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    callback_data = Column(JSONB, nullable=True)

    __table_args__ = (
        UniqueConstraint('user_id', 'case_id', name='uq_user_case_purchase'),
    )
