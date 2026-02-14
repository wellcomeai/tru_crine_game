import logging

from sqlalchemy import select

from app.database import async_session
from app.models import Case, Location, Character, Evidence, EvidenceConnection

logger = logging.getLogger(__name__)


async def seed_case_data() -> None:
    """Seed the database with all available case data."""
    try:
        await _seed_case_001()
    except Exception as e:
        logger.error("Failed to seed case data: %s", e)


async def _seed_case_001() -> None:
    """Seed case 001 if it does not already exist."""
    async with async_session() as session:
        result = await session.execute(
            select(Case).where(Case.slug == "case_001_murder_at_grand_palace")
        )
        existing = result.scalar_one_or_none()

        if existing is not None:
            logger.info("Case 'case_001_murder_at_grand_palace' already exists — skipping seed.")
            return

        from app.case_data.case_001 import CASE_001_DATA

        data = CASE_001_DATA

        # Create the Case record
        case = Case(**data["case"])
        session.add(case)
        await session.flush()

        case_id = case.id

        # Create Location records
        for loc_data in data["locations"]:
            record = {**loc_data, "case_id": case_id}
            session.add(Location(**record))

        # Create Character records
        for char_data in data["characters"]:
            record = {**char_data, "case_id": case_id}
            session.add(Character(**record))

        # Create Evidence records
        for ev_data in data["evidence"]:
            record = {**ev_data, "case_id": case_id}
            session.add(Evidence(**record))

        # Create EvidenceConnection records
        for conn_data in data["evidence_connections"]:
            record = {**conn_data, "case_id": case_id}
            session.add(EvidenceConnection(**record))

        await session.commit()

        logger.info(
            "Seeded case '%s' with %d locations, %d characters, %d evidence items, "
            "and %d evidence connections.",
            data["case"]["title"],
            len(data["locations"]),
            len(data["characters"]),
            len(data["evidence"]),
            len(data["evidence_connections"]),
        )
