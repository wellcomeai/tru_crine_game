import json
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    GameSession, GameState, Case, Location, Character,
    Evidence, EvidenceConnection, InterrogationLog, ActionHistory, Accusation,
)
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)


class GameEngine:

    async def get_session_and_state(
        self, session_id: UUID, db: AsyncSession
    ) -> tuple[GameSession, GameState]:
        session = await db.get(GameSession, session_id)
        if not session:
            raise ValueError("Session not found")
        result = await db.execute(
            select(GameState).where(GameState.session_id == session_id)
        )
        state = result.scalar_one_or_none()
        if not state:
            raise ValueError("Game state not found")
        return session, state

    async def evaluate_conditions(
        self, conditions: Optional[dict], state: GameState, db: AsyncSession,
        session_id: Optional[UUID] = None,
    ) -> bool:
        if conditions is None:
            return True

        ctype = conditions.get("type")

        if ctype == "has_evidence":
            return conditions["evidence_slug"] in (state.collected_evidence or [])

        elif ctype == "visited_location":
            return conditions["location_slug"] in (state.visited_locations or [])

        elif ctype == "examined_poi":
            return conditions["poi_id"] in (state.examined_pois or [])

        elif ctype == "interrogated":
            slug = conditions["character_slug"]
            if slug not in (state.unlocked_characters or []):
                return False
            if session_id:
                result = await db.execute(
                    select(InterrogationLog).where(
                        InterrogationLog.session_id == session_id,
                        InterrogationLog.character_slug == slug,
                        InterrogationLog.message_count > 0,
                    )
                )
                return result.scalar_one_or_none() is not None
            return False

        elif ctype == "interrogated_with_evidence":
            slug = conditions["character_slug"]
            evidence_slug = conditions["evidence_slug"]
            if session_id:
                result = await db.execute(
                    select(InterrogationLog).where(
                        InterrogationLog.session_id == session_id,
                        InterrogationLog.character_slug == slug,
                    )
                )
                log = result.scalar_one_or_none()
                if log and log.messages:
                    for msg in log.messages:
                        if msg.get("evidence_shown") == evidence_slug:
                            return True
            return False

        elif ctype == "evidence_count":
            return len(state.collected_evidence or []) >= conditions.get("min", 0)

        elif ctype == "connection_made":
            a = conditions["evidence_a"]
            b = conditions["evidence_b"]
            for conn in (state.player_connections or []):
                if (conn["a"] == a and conn["b"] == b) or (conn["a"] == b and conn["b"] == a):
                    return True
            return False

        elif ctype == "and":
            for sub in conditions.get("conditions", []):
                if not await self.evaluate_conditions(sub, state, db, session_id):
                    return False
            return True

        elif ctype == "or":
            for sub in conditions.get("conditions", []):
                if await self.evaluate_conditions(sub, state, db, session_id):
                    return True
            return False

        return False

    async def check_unlocks(
        self, session_id: UUID, state: GameState, db: AsyncSession
    ) -> dict:
        session = await db.get(GameSession, session_id)
        case_id = session.case_id

        result_data = {
            "new_locations": [],
            "new_characters": [],
            "new_evidence": [],
            "new_phases": [],
            "notifications": [],
        }

        # Check locations
        locations_result = await db.execute(
            select(Location).where(Location.case_id == case_id)
        )
        for loc in locations_result.scalars().all():
            if loc.slug not in (state.visited_locations or []):
                if not loc.is_initial and loc.unlock_conditions:
                    if await self.evaluate_conditions(loc.unlock_conditions, state, db, session_id):
                        # Location is now accessible but not auto-added to visited
                        result_data["new_locations"].append({"slug": loc.slug, "name": loc.name})
                        result_data["notifications"].append(f"Открыта новая локация: {loc.name}!")

        # Check characters
        chars_result = await db.execute(
            select(Character).where(Character.case_id == case_id)
        )
        for char in chars_result.scalars().all():
            if char.slug not in (state.unlocked_characters or []) and char.role != "victim":
                if char.unlock_conditions:
                    if await self.evaluate_conditions(char.unlock_conditions, state, db, session_id):
                        state.unlocked_characters = (state.unlocked_characters or []) + [char.slug]
                        result_data["new_characters"].append({"slug": char.slug, "name": char.name})
                        result_data["notifications"].append(f"Доступен для допроса: {char.name}!")

        # Check evidence with found_conditions (not location-based)
        evidence_result = await db.execute(
            select(Evidence).where(
                Evidence.case_id == case_id,
                Evidence.location_slug.is_(None),
            )
        )
        for ev in evidence_result.scalars().all():
            if ev.slug not in (state.collected_evidence or []):
                if ev.found_conditions:
                    if await self.evaluate_conditions(ev.found_conditions, state, db, session_id):
                        state.collected_evidence = (state.collected_evidence or []) + [ev.slug]
                        result_data["new_evidence"].append({"slug": ev.slug, "name": ev.name})
                        result_data["notifications"].append(f"Получена новая улика: {ev.name}!")

        # Check phases
        case = await db.get(Case, case_id)
        phases = case.phases or []
        for phase in phases:
            phase_id = phase["id"]
            if phase_id not in (state.unlocked_phases or []):
                conditions = phase.get("completion_conditions")
                if await self.evaluate_conditions(conditions, state, db, session_id):
                    state.unlocked_phases = (state.unlocked_phases or []) + [phase_id]
                    result_data["new_phases"].append({"id": phase_id, "name": phase["name"]})
                    result_data["notifications"].append(f"Новая фаза: {phase['name']}!")
                    # Update session current_phase
                    session.current_phase = phase_id

        await db.commit()
        return result_data

    def _snapshot_state(self, state: GameState) -> dict:
        return {
            "visited_locations": list(state.visited_locations or []),
            "collected_evidence": list(state.collected_evidence or []),
            "unlocked_characters": list(state.unlocked_characters or []),
            "examined_pois": list(state.examined_pois or []),
            "player_connections": list(state.player_connections or []),
            "player_notes": state.player_notes or "",
            "player_hypotheses": list(state.player_hypotheses or []),
            "unlocked_phases": list(state.unlocked_phases or []),
            "hints_used": list(state.hints_used or []),
        }

    async def _save_action(
        self, session_id: UUID, action_type: str, action_data: dict,
        state: GameState, db: AsyncSession,
    ):
        action = ActionHistory(
            session_id=session_id,
            action_type=action_type,
            action_data=action_data,
            state_before=self._snapshot_state(state),
        )
        db.add(action)

    async def process_visit(
        self, session_id: UUID, location_slug: str, db: AsyncSession
    ) -> dict:
        session, state = await self.get_session_and_state(session_id, db)

        # Get location
        result = await db.execute(
            select(Location).where(
                Location.case_id == session.case_id,
                Location.slug == location_slug,
            )
        )
        location = result.scalar_one_or_none()
        if not location:
            raise ValueError("Location not found")

        # Check access
        if not location.is_initial:
            if not await self.evaluate_conditions(location.unlock_conditions, state, db, session_id):
                raise ValueError("Location is locked")

        # Save action
        await self._save_action(session_id, "visit", {"location_slug": location_slug}, state, db)

        # Update state
        if location_slug not in (state.visited_locations or []):
            state.visited_locations = (state.visited_locations or []) + [location_slug]

        state.updated_at = datetime.utcnow()
        await db.commit()

        # Check unlocks
        unlocks = await self.check_unlocks(session_id, state, db)

        return {
            "location": {
                "slug": location.slug,
                "name": location.name,
                "description": location.description,
                "image": location.image,
                "points_of_interest": location.points_of_interest or [],
            },
            "unlocks": unlocks,
        }

    async def process_examine(
        self, session_id: UUID, location_slug: str, poi_id: str, db: AsyncSession
    ) -> dict:
        session, state = await self.get_session_and_state(session_id, db)

        # Verify location was visited
        if location_slug not in (state.visited_locations or []):
            raise ValueError("Location not visited yet")

        # Get location
        result = await db.execute(
            select(Location).where(
                Location.case_id == session.case_id,
                Location.slug == location_slug,
            )
        )
        location = result.scalar_one_or_none()
        if not location:
            raise ValueError("Location not found")

        # Find POI
        poi = None
        for p in (location.points_of_interest or []):
            if p["id"] == poi_id:
                poi = p
                break
        if not poi:
            raise ValueError("Point of interest not found")

        # Save action
        await self._save_action(
            session_id, "examine",
            {"location_slug": location_slug, "poi_id": poi_id},
            state, db,
        )

        # Mark as examined
        poi_key = f"{location_slug}:{poi_id}"
        if poi_key not in (state.examined_pois or []):
            state.examined_pois = (state.examined_pois or []) + [poi_key]

        # Check if POI yields evidence
        found_evidence = None
        evidence_slug = poi.get("evidence_slug")
        if evidence_slug and evidence_slug not in (state.collected_evidence or []):
            # Get evidence record
            ev_result = await db.execute(
                select(Evidence).where(
                    Evidence.case_id == session.case_id,
                    Evidence.slug == evidence_slug,
                )
            )
            evidence = ev_result.scalar_one_or_none()
            if evidence:
                # Check evidence found_conditions if any
                can_collect = True
                if evidence.found_conditions:
                    can_collect = await self.evaluate_conditions(
                        evidence.found_conditions, state, db, session_id
                    )
                if can_collect:
                    state.collected_evidence = (state.collected_evidence or []) + [evidence_slug]
                    found_evidence = {
                        "slug": evidence.slug,
                        "name": evidence.name,
                        "type": evidence.type,
                        "description": evidence.description,
                        "image": evidence.image,
                    }

        state.updated_at = datetime.utcnow()
        await db.commit()

        # Check unlocks
        unlocks = await self.check_unlocks(session_id, state, db)

        return {
            "examine_text": poi.get("examine_text", poi.get("description", "")),
            "evidence": found_evidence,
            "unlocks": unlocks,
        }

    async def process_connect(
        self, session_id: UUID, slug_a: str, slug_b: str,
        note: str, db: AsyncSession,
    ) -> dict:
        session, state = await self.get_session_and_state(session_id, db)

        # Verify both evidence collected
        collected = state.collected_evidence or []
        if slug_a not in collected or slug_b not in collected:
            raise ValueError("Both evidence must be collected first")

        # Check if already connected
        for conn in (state.player_connections or []):
            if (conn["a"] == slug_a and conn["b"] == slug_b) or \
               (conn["a"] == slug_b and conn["b"] == slug_a):
                raise ValueError("Connection already exists")

        # Save action
        await self._save_action(
            session_id, "connect",
            {"slug_a": slug_a, "slug_b": slug_b, "note": note},
            state, db,
        )

        # Check if this matches a known connection
        ec_result = await db.execute(
            select(EvidenceConnection).where(
                EvidenceConnection.case_id == session.case_id,
            )
        )
        confirmation_text = None
        is_confirmed = False
        for ec in ec_result.scalars().all():
            if (ec.evidence_a_slug == slug_a and ec.evidence_b_slug == slug_b) or \
               (ec.evidence_a_slug == slug_b and ec.evidence_b_slug == slug_a):
                confirmation_text = ec.description
                is_confirmed = True
                break

        # Add connection
        new_conn = {
            "a": slug_a,
            "b": slug_b,
            "note": note or "",
            "is_confirmed": is_confirmed,
            "confirmation_text": confirmation_text,
        }
        state.player_connections = (state.player_connections or []) + [new_conn]
        state.updated_at = datetime.utcnow()
        await db.commit()

        # Check unlocks
        unlocks = await self.check_unlocks(session_id, state, db)

        return {
            "connection": new_conn,
            "unlocks": unlocks,
        }

    async def process_disconnect(
        self, session_id: UUID, slug_a: str, slug_b: str, db: AsyncSession,
    ):
        session, state = await self.get_session_and_state(session_id, db)

        connections = state.player_connections or []
        new_connections = [
            c for c in connections
            if not ((c["a"] == slug_a and c["b"] == slug_b) or
                    (c["a"] == slug_b and c["b"] == slug_a))
        ]
        state.player_connections = new_connections
        state.updated_at = datetime.utcnow()
        await db.commit()

    async def process_undo(self, session_id: UUID, db: AsyncSession) -> dict:
        # Get last action
        result = await db.execute(
            select(ActionHistory)
            .where(ActionHistory.session_id == session_id)
            .order_by(ActionHistory.created_at.desc())
            .limit(1)
        )
        action = result.scalar_one_or_none()
        if not action or not action.state_before:
            raise ValueError("Nothing to undo")

        # Restore state
        state_result = await db.execute(
            select(GameState).where(GameState.session_id == session_id)
        )
        state = state_result.scalar_one()

        before = action.state_before
        state.visited_locations = before.get("visited_locations", [])
        state.collected_evidence = before.get("collected_evidence", [])
        state.unlocked_characters = before.get("unlocked_characters", [])
        state.examined_pois = before.get("examined_pois", [])
        state.player_connections = before.get("player_connections", [])
        state.player_notes = before.get("player_notes", "")
        state.player_hypotheses = before.get("player_hypotheses", [])
        state.unlocked_phases = before.get("unlocked_phases", [])
        state.hints_used = before.get("hints_used", [])
        state.updated_at = datetime.utcnow()

        # Delete the action
        await db.delete(action)
        await db.commit()

        return {"message": "Undo successful", "state": self._snapshot_state(state)}

    async def evaluate_accusation(
        self, session_id: UUID, accusation_data: dict, db: AsyncSession,
    ) -> dict:
        session, state = await self.get_session_and_state(session_id, db)
        case = await db.get(Case, session.case_id)
        solution = case.solution

        total_score = 0
        breakdown = {}

        # 1. Suspect check (500 points)
        suspect_correct = accusation_data["accused_slug"] == solution["guilty"]
        suspect_score = 500 if suspect_correct else 0
        total_score += suspect_score
        breakdown["suspect"] = {
            "correct": suspect_correct,
            "score": suspect_score,
            "correct_answer": solution["guilty"],
        }

        # 2. Motive (0-200 via AI)
        motive_result = await ai_service.evaluate_motive(
            accusation_data.get("motive", ""),
            solution.get("motive", ""),
        )
        motive_score = min(motive_result.get("score", 0), 200)
        total_score += motive_score
        breakdown["motive"] = {
            "score": motive_score,
            "feedback": motive_result.get("feedback", ""),
        }

        # 3. Method (0-150 via AI)
        method_result = await ai_service.evaluate_method(
            accusation_data.get("method", ""),
            solution.get("method", ""),
        )
        method_score = min(method_result.get("score", 0), 150)
        total_score += method_score
        breakdown["method"] = {
            "score": method_score,
            "feedback": method_result.get("feedback", ""),
        }

        # 4. Evidence (0-150)
        key_evidence = solution.get("key_evidence", [])
        player_evidence = accusation_data.get("supporting_evidence", [])
        matched = len(set(key_evidence) & set(player_evidence))
        evidence_score = int((matched / max(len(key_evidence), 1)) * 150)
        total_score += evidence_score
        breakdown["evidence"] = {
            "score": evidence_score,
            "details": f"Ключевые улики: {matched}/{len(key_evidence)}",
        }

        # 5. Bonus (50 for no hints)
        bonus_score = 50 if not (state.hints_used or []) else 0
        total_score += bonus_score
        breakdown["bonus"] = {
            "score": bonus_score,
            "details": "Без подсказок" if bonus_score > 0 else "Использованы подсказки",
        }

        # Generate story summary
        story_summary = await ai_service.generate_story_summary(solution, total_score)

        # Save accusation
        accusation = Accusation(
            session_id=session_id,
            accused_slug=accusation_data["accused_slug"],
            motive=accusation_data.get("motive", ""),
            method=accusation_data.get("method", ""),
            supporting_evidence=player_evidence,
            is_correct=suspect_correct,
            score=total_score,
            feedback={
                "breakdown": breakdown,
                "story_summary": story_summary,
            },
        )
        db.add(accusation)

        # Update session
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        session.score = total_score
        await db.commit()

        return {
            "is_correct": suspect_correct,
            "total_score": total_score,
            "max_score": 1050,
            "breakdown": breakdown,
            "story_summary": story_summary,
        }


game_engine = GameEngine()
