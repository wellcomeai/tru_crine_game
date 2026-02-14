import uuid
from sqlalchemy import Column, String, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class EvidenceConnection(Base):
    __tablename__ = "evidence_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    evidence_a_slug = Column(String(100), nullable=False)
    evidence_b_slug = Column(String(100), nullable=False)
    connection_type = Column(String(50))
    description = Column(Text)
    is_key_connection = Column(Boolean, default=False)
