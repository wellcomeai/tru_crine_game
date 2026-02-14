import uuid
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id"), nullable=False)
    slug = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    image = Column(String(500))
    is_initial = Column(Boolean, default=False)
    unlock_conditions = Column(JSONB, nullable=True)
    points_of_interest = Column(JSONB, default=list)
    sort_order = Column(Integer, default=0)
