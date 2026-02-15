"""
AI-powered case generation service.

Full pipeline: plot -> validation -> cover -> location images -> POI calibration
-> avatars -> evidence images -> DB save.

Images are stored in Cloudflare R2 (when configured) or local filesystem (fallback).
"""

import json
import logging
import base64
import re
from pathlib import Path
from typing import AsyncGenerator
from uuid import UUID

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.services.storage import storage

logger = logging.getLogger(__name__)

# Fallback directory for local storage (when R2 is not configured)
IMAGES_BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent / "images" / "generated"


class CaseGenerator:
    """Generates detective cases using AI."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # ─────────────────────────────────────────────
    # Helper: store image (R2 or local)
    # ─────────────────────────────────────────────

    async def _store_image(
        self,
        image_bytes: bytes,
        key: str,
        local_rel_path: str,
        max_width: int = 1200,
        max_height: int = 900,
        quality: int = 82,
    ) -> str:
        """
        Store image in R2 (if configured) or local filesystem.
        Returns public URL (R2) or relative path (local).
        """
        if storage.enabled:
            return await storage.upload_image(
                image_bytes, key,
                max_width=max_width, max_height=max_height, quality=quality,
            )
        else:
            # Fallback: save to local filesystem
            full_path = IMAGES_BASE_DIR.parent / local_rel_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_bytes(image_bytes)
            return local_rel_path

    # ─────────────────────────────────────────────
    # PUBLIC: full pipeline (non-streaming, legacy)
    # ─────────────────────────────────────────────

    async def generate_full_case(
        self,
        db: AsyncSession,
        theme: str | None = None,
        difficulty: str = "medium",
        num_suspects: int = 4,
        num_locations: int = 5,
        setting: str | None = None,
    ) -> dict:
        result = {"status": "in_progress", "steps": [], "errors": []}

        try:
            async for progress in self.generate_full_case_with_progress(
                db=db, theme=theme, difficulty=difficulty,
                num_suspects=num_suspects, num_locations=num_locations,
                setting=setting,
            ):
                if progress.get("status") == "in_progress":
                    step_name = progress.get("step_name", f"step_{progress.get('step', '?')}")
                    result["steps"].append({"step": step_name, "status": "done"})
                elif progress.get("status") == "completed":
                    result["status"] = "completed"
                    result["case_id"] = progress.get("case_id", "")
                    result["case_slug"] = progress.get("case_slug", "")
                elif progress.get("status") == "error":
                    result["status"] = "error"
                    result["errors"].append(progress.get("message", "Unknown error"))

        except Exception as e:
            logger.exception("Case generation failed")
            result["status"] = "error"
            result["errors"].append(str(e))

        return result

    # ─────────────────────────────────────────────
    # PUBLIC: full pipeline with progress (SSE)
    # ─────────────────────────────────────────────

    async def generate_full_case_with_progress(
        self,
        db: AsyncSession,
        theme: str | None = None,
        difficulty: str = "medium",
        num_suspects: int = 4,
        num_locations: int = 5,
        setting: str | None = None,
        price: float = 0,
    ) -> AsyncGenerator[dict, None]:
        """Generate case with step-by-step progress updates."""

        total_steps = 8

        # Step 1: Plot generation
        yield {"step": 1, "total": total_steps, "step_name": "plot_generation",
               "message": "Генерация сюжета...", "status": "in_progress"}
        logger.info("Step 1/%d: Generating plot...", total_steps)
        case_data = await self._generate_plot(theme, difficulty, num_suspects, num_locations, setting)

        # Step 2: Validation
        yield {"step": 2, "total": total_steps, "step_name": "validation",
               "message": "Валидация сюжета...", "status": "in_progress"}
        logger.info("Step 2/%d: Validating...", total_steps)
        errors = self._validate_case_data(case_data)
        if errors:
            logger.warning("Validation failed: %s", errors)
            case_data = await self._fix_plot(case_data, errors)
            errors = self._validate_case_data(case_data)
            if errors:
                yield {"status": "error", "message": f"Validation failed: {'; '.join(errors)}"}
                return

        case_slug = case_data["case"]["slug"]

        # Ensure local directories exist (for fallback)
        if not storage.enabled:
            for subdir in ["locations", "characters", "evidence"]:
                (IMAGES_BASE_DIR / case_slug / subdir).mkdir(parents=True, exist_ok=True)

        # Step 3: Cover image
        yield {"step": 3, "total": total_steps, "step_name": "cover_image",
               "message": "Создание обложки дела...", "status": "in_progress"}
        logger.info("Step 3/%d: Generating cover image...", total_steps)
        cover_url = await self._generate_cover_image(case_data["case"], case_slug)
        case_data["case"]["cover_image"] = cover_url

        # Step 4: Location images + POI calibration
        locations = case_data["locations"]
        # We store raw image bytes in memory for POI calibration
        location_image_bytes: dict[str, bytes] = {}
        for i, loc_data in enumerate(locations):
            yield {"step": 4, "total": total_steps, "step_name": "location_images",
                   "message": f"Генерация фото локаций ({i + 1}/{len(locations)})...",
                   "status": "in_progress"}
            logger.info("Step 4/%d: Location image %d/%d (%s)...",
                        total_steps, i + 1, len(locations), loc_data["slug"])
            img_path, img_bytes = await self._generate_location_image(loc_data, case_slug)
            loc_data["image"] = img_path
            if img_bytes:
                location_image_bytes[loc_data["slug"]] = img_bytes

        # Step 5: POI calibration
        yield {"step": 5, "total": total_steps, "step_name": "poi_calibration",
               "message": "Калибровка точек интереса...", "status": "in_progress"}
        logger.info("Step 5/%d: Calibrating POI positions...", total_steps)
        for loc_data in locations:
            if loc_data.get("points_of_interest") and loc_data.get("image"):
                raw_bytes = location_image_bytes.get(loc_data["slug"])
                if raw_bytes:
                    loc_data["points_of_interest"] = await self._calibrate_pois_from_bytes(
                        raw_bytes,
                        loc_data["points_of_interest"],
                        loc_data["name"],
                        loc_data["description"],
                    )
        # Free memory
        location_image_bytes.clear()

        # Step 6: Character avatars
        characters = case_data["characters"]
        for i, char_data in enumerate(characters):
            yield {"step": 6, "total": total_steps, "step_name": "avatars",
                   "message": f"Генерация аватаров ({i + 1}/{len(characters)})...",
                   "status": "in_progress"}
            logger.info("Step 6/%d: Avatar %d/%d (%s)...",
                        total_steps, i + 1, len(characters), char_data["slug"])
            avatar_path = await self._generate_avatar(char_data, case_slug)
            char_data["avatar"] = avatar_path

        # Step 7: Evidence images (key evidence only)
        key_evidence_slugs = case_data["case"]["solution"].get("key_evidence", [])
        key_evidence_items = [ev for ev in case_data["evidence"] if ev["slug"] in key_evidence_slugs]
        for i, ev_data in enumerate(key_evidence_items):
            yield {"step": 7, "total": total_steps, "step_name": "evidence_images",
                   "message": f"Генерация фото улик ({i + 1}/{len(key_evidence_items)})...",
                   "status": "in_progress"}
            logger.info("Step 7/%d: Evidence image %d/%d (%s)...",
                        total_steps, i + 1, len(key_evidence_items), ev_data["slug"])
            ev_img = await self._generate_evidence_image(ev_data, case_slug)
            ev_data["image"] = ev_img

        # Step 8: Save to database
        yield {"step": 8, "total": total_steps, "step_name": "database_save",
               "message": "Сохранение в базу данных...", "status": "in_progress"}
        logger.info("Step 8/%d: Saving to database...", total_steps)
        case_id = await self._save_to_database(case_data, db, price=price)

        yield {"step": 8, "total": total_steps, "status": "completed",
               "message": "Дело успешно создано!",
               "case_id": str(case_id), "case_slug": case_slug}

    # ─────────────────────────────────────────────
    # STEP 1: Plot generation
    # ─────────────────────────────────────────────

    async def _generate_plot(
        self,
        theme: str | None,
        difficulty: str,
        num_suspects: int,
        num_locations: int,
        setting: str | None,
    ) -> dict:
        theme_instruction = ""
        if theme:
            theme_instruction = f"\nТЕМА ДЕЛА: {theme}"
        if setting:
            theme_instruction += f"\nСЕТТИНГ: {setting}"

        difficulty_hints = {
            "easy": "более очевидные улики, менее сложные связи",
            "medium": "умеренная сложность, несколько ложных следов",
            "hard": "сложные связи, много ложных следов, неочевидный мотив",
        }
        diff_hint = difficulty_hints.get(difficulty, difficulty_hints["medium"])

        # Dynamic evidence and connection counts based on suspects + locations
        num_evidence_min = max(6, num_suspects + num_locations)
        num_evidence_max = num_evidence_min + 5
        num_key_evidence = max(3, num_evidence_min // 2)
        min_connections = max(6, num_evidence_min // 2 + 2)

        system_prompt = f"""Ты — сценарист детективных игр.
Создай полноценное детективное дело в формате JSON.

ВСЕ ТЕКСТЫ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ.
Slugs и id — на латинице (snake_case).

СЛОЖНОСТЬ: {difficulty} ({diff_hint})
КОЛИЧЕСТВО ПОДОЗРЕВАЕМЫХ: {num_suspects}
КОЛИЧЕСТВО ЛОКАЦИЙ: {num_locations}
{theme_instruction}

ОБЯЗАТЕЛЬНАЯ СТРУКТУРА JSON:

{{
  "case": {{
    "title": "Название дела (русский)",
    "slug": "case_slug_latin",
    "description": "Подробное описание предыстории дела (4-6 предложений, русский)",
    "difficulty": "{difficulty}",
    "estimated_time_min": 60,
    "is_published": false,
    "phases": [
      {{
        "id": "phase_1",
        "name": "Осмотр места преступления",
        "description": "Описание задачи фазы (1-2 предложения)",
        "sort_order": 1,
        "completion_conditions": {{
          "type": "and",
          "conditions": [
            {{"type": "evidence_count", "min": 3}},
            {{"type": "visited_location", "location_slug": "SLUG_ПЕРВОЙ_ЛОКАЦИИ"}}
          ]
        }}
      }},
      {{
        "id": "phase_2",
        "name": "Допросы свидетелей",
        "description": "...",
        "sort_order": 2,
        "completion_conditions": {{"type": "evidence_count", "min": 5}}
      }},
      {{
        "id": "phase_3",
        "name": "Углублённое расследование",
        "description": "...",
        "sort_order": 3,
        "completion_conditions": {{
          "type": "and",
          "conditions": [
            {{"type": "has_evidence", "evidence_slug": "SLUG_КЛЮЧЕВОЙ_УЛИКИ"}},
            {{"type": "connection_made", "evidence_a": "SLUG_УЛИКИ_A", "evidence_b": "SLUG_УЛИКИ_B"}}
          ]
        }}
      }},
      {{
        "id": "phase_4",
        "name": "Предъявление обвинения",
        "description": "...",
        "sort_order": 4,
        "completion_conditions": {{"type": "evidence_count", "min": 7}}
      }}
    ],
    "solution": {{
      "guilty": "slug_виновного_персонажа",
      "motive": "Описание мотива (русский)",
      "method": "Метод убийства (русский)",
      "weapon": "slug_орудия",
      "key_evidence": ["slug_улики_1", "slug_улики_2", "slug_улики_3"]
    }}
  }},

  "locations": [
    {{
      "name": "Название локации (русский)",
      "slug": "location_slug",
      "description": "Описание локации (2-3 предложения)",
      "sort_order": 1,
      "is_initial": true,
      "unlock_conditions": null,
      "points_of_interest": [
        {{
          "id": "poi_id_latin",
          "label": "Название точки (русский)",
          "description": "Что игрок видит при наведении",
          "x_percent": 25,
          "y_percent": 55,
          "width_percent": 20,
          "height_percent": 18,
          "evidence_slug": "slug_улики_или_null",
          "examine_text": "Атмосферный текст осмотра (3-5 предложений, русский)."
        }}
      ]
    }}
  ],

  "characters": [
    {{
      "name": "Имя Фамилия (русское)",
      "slug": "character_slug",
      "role": "suspect",
      "age": 35,
      "occupation": "Должность (русский)",
      "personality": "Описание характера (2-3 предложения, русский)",
      "backstory": "Предыстория персонажа (3-5 предложений)",
      "is_guilty": false,
      "is_available_initially": true,
      "unlock_conditions": null,
      "alibi": "Алиби персонажа (русский)",
      "secrets": [{{"id": "secret_1", "content": "Секрет (русский)"}}],
      "emotional_reactions": {{
        "slug_улики": {{
          "reaction": "nervous",
          "instruction": "Как персонаж реагирует (русский)"
        }}
      }},
      "ai_system_prompt": "Подробный промпт для GPT (8-15 предложений, русский)."
    }}
  ],

  "evidence": [
    {{
      "name": "Название улики (русский)",
      "slug": "evidence_slug",
      "type": "physical",
      "description": "Краткое описание (1 предложение)",
      "detailed_description": "Подробное описание (3-5 предложений, русский)",
      "location_slug": "location_slug_или_null",
      "found_at_poi": "poi_id_или_null",
      "found_conditions": null,
      "importance": 5,
      "tags": ["тег"],
      "is_key_evidence": true
    }}
  ],

  "evidence_connections": [
    {{
      "evidence_a_slug": "slug_a",
      "evidence_b_slug": "slug_b",
      "connection_type": "supports",
      "description": "Как связаны (русский)",
      "is_key_connection": true
    }}
  ]
}}

ПРАВИЛА:
1. Жертва указана в описании, НЕ включать в characters.
2. Ровно один персонаж с is_guilty=true. solution.guilty = его slug.
3. Локации: РОВНО {num_locations} штук. Первая — is_initial=true. Остальные — is_initial=false.
4. POI: 2-4 на локацию. Не все с уликами (evidence_slug=null для атмосферных).
5. Улики: {num_evidence_min}-{num_evidence_max} штук. key_evidence — {num_key_evidence}-{num_key_evidence + 2} штук.
6. Связи: минимум {min_connections}.
7. Slugs: уникальные, snake_case, латиница.
8. POI координаты: примерные позиции, раскидать по изображению.
9. ai_system_prompt: подробно описать речевую манеру, что скрывает, как реагирует.
10. Персонажей (подозреваемых): РОВНО {num_suspects} штук. Ровно один с is_guilty=true.

Ответь ТОЛЬКО валидным JSON. Без markdown, без комментариев."""

        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Сгенерируй детективное дело."},
            ],
            temperature=0.9,
            max_tokens=8000,
        )

        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = re.sub(r'^```(?:json)?\s*', '', raw)
            raw = re.sub(r'\s*```$', '', raw)

        return json.loads(raw)

    # ─────────────────────────────────────────────
    # STEP 2: Validation
    # ─────────────────────────────────────────────

    def _validate_case_data(self, data: dict) -> list[str]:
        errors = []

        for key in ["case", "locations", "characters", "evidence", "evidence_connections"]:
            if key not in data:
                errors.append(f"Missing top-level key: {key}")

        if errors:
            return errors

        case_info = data["case"]
        solution = case_info.get("solution", {})

        char_slugs = [c["slug"] for c in data["characters"]]
        ev_slugs = [e["slug"] for e in data["evidence"]]
        loc_slugs = [loc["slug"] for loc in data["locations"]]

        guilty = solution.get("guilty")
        if guilty and guilty not in char_slugs:
            errors.append(f"solution.guilty '{guilty}' not in characters: {char_slugs}")

        guilty_chars = [c for c in data["characters"] if c.get("is_guilty")]
        if len(guilty_chars) != 1:
            errors.append(f"Expected 1 guilty character, found {len(guilty_chars)}")
        elif guilty_chars[0]["slug"] != guilty:
            errors.append(f"is_guilty character '{guilty_chars[0]['slug']}' != solution.guilty '{guilty}'")

        for kev in solution.get("key_evidence", []):
            if kev not in ev_slugs:
                errors.append(f"key_evidence '{kev}' not in evidence")

        for loc in data["locations"]:
            for poi in loc.get("points_of_interest", []):
                ev = poi.get("evidence_slug")
                if ev and ev not in ev_slugs:
                    errors.append(f"POI evidence '{ev}' in location '{loc['slug']}' not found")

        for conn in data["evidence_connections"]:
            if conn["evidence_a_slug"] not in ev_slugs:
                errors.append(f"Connection evidence_a '{conn['evidence_a_slug']}' not found")
            if conn["evidence_b_slug"] not in ev_slugs:
                errors.append(f"Connection evidence_b '{conn['evidence_b_slug']}' not found")

        initial = [loc for loc in data["locations"] if loc.get("is_initial")]
        if not initial:
            errors.append("No initial location (is_initial=true)")

        for name, slugs in [("characters", char_slugs), ("evidence", ev_slugs), ("locations", loc_slugs)]:
            dupes = [s for s in slugs if slugs.count(s) > 1]
            if dupes:
                errors.append(f"Duplicate {name} slugs: {set(dupes)}")

        for phase in case_info.get("phases", []):
            if "sort_order" not in phase:
                errors.append(f"Phase '{phase.get('id')}' missing sort_order")

        for phase in case_info.get("phases", []):
            conds = phase.get("completion_conditions", {})
            self._validate_conditions(conds, ev_slugs, loc_slugs, errors, phase.get("id", "?"))

        return errors

    def _validate_conditions(self, cond, ev_slugs, loc_slugs, errors, context):
        if not cond:
            return
        ctype = cond.get("type")
        if ctype in ("and", "or"):
            for sub in cond.get("conditions", []):
                self._validate_conditions(sub, ev_slugs, loc_slugs, errors, context)
        elif ctype == "has_evidence":
            if cond.get("evidence_slug") not in ev_slugs:
                errors.append(f"Phase {context}: has_evidence '{cond.get('evidence_slug')}' not in evidence")
        elif ctype == "visited_location":
            if cond.get("location_slug") not in loc_slugs:
                errors.append(f"Phase {context}: visited_location '{cond.get('location_slug')}' not in locations")
        elif ctype == "connection_made":
            if cond.get("evidence_a") not in ev_slugs:
                errors.append(f"Phase {context}: connection evidence_a not found")
            if cond.get("evidence_b") not in ev_slugs:
                errors.append(f"Phase {context}: connection evidence_b not found")

    async def _fix_plot(self, case_data: dict, errors: list[str]) -> dict:
        fix_prompt = f"""Вот JSON детективного дела, в котором найдены ошибки.

ОШИБКИ:
{chr(10).join(f'- {e}' for e in errors)}

ТЕКУЩИЙ JSON:
{json.dumps(case_data, ensure_ascii=False, indent=2)}

Исправь ВСЕ ошибки и верни исправленный JSON.
ТОЛЬКО валидный JSON, без markdown, без комментариев."""

        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": fix_prompt}],
            temperature=0.3,
            max_tokens=8000,
        )

        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = re.sub(r'^```(?:json)?\s*', '', raw)
            raw = re.sub(r'\s*```$', '', raw)

        return json.loads(raw)

    # ─────────────────────────────────────────────
    # STEP 3: Cover image
    # ─────────────────────────────────────────────

    async def _generate_cover_image(self, case_info: dict, case_slug: str) -> str:
        prompt = f"""Атмосферная обложка для детективной игры.

Название дела: {case_info['title']}
Краткое описание: {case_info.get('description', '')}

Стиль: кинематографичный, тёмный нуар, драматичное освещение.
Должна передавать атмосферу тайны и расследования.
Формат: горизонтальный, соотношение 16:9.
БЕЗ текста и надписей на изображении."""

        try:
            response = await self.client.images.generate(
                model="gpt-image-1",
                prompt=prompt,
                n=1,
                size="1536x1024",
                quality="high",
            )

            image_b64 = response.data[0].b64_json
            image_bytes = base64.b64decode(image_b64)

            key = f"cases/{case_slug}/cover.webp"
            local_rel = f"generated/{case_slug}/cover.png"

            return await self._store_image(
                image_bytes, key, local_rel,
                max_width=1200, max_height=675, quality=85,
            )

        except Exception as e:
            logger.error("Failed to generate cover image for %s: %s", case_slug, e)
            return ""

    # ─────────────────────────────────────────────
    # STEP 4: Location images
    # ─────────────────────────────────────────────

    async def _generate_location_image(self, loc_data: dict, case_slug: str) -> tuple[str, bytes | None]:
        """Generate location image. Returns (stored_path, raw_bytes_for_calibration)."""
        pois = loc_data.get("points_of_interest", [])
        poi_descriptions = []
        for poi in pois:
            position_hint = self._position_hint(poi.get("x_percent", 50), poi.get("y_percent", 50))
            poi_descriptions.append(
                f"- {poi['label']}: {poi.get('description', '')} (расположить {position_hint})"
            )

        prompt = f"""Фотореалистичное изображение для детективной игры.

Локация: {loc_data['name']}
Описание: {loc_data['description']}

ОБЪЕКТЫ, КОТОРЫЕ ОБЯЗАТЕЛЬНО ДОЛЖНЫ ПРИСУТСТВОВАТЬ:
{chr(10).join(poi_descriptions) if poi_descriptions else 'Обстановка по описанию'}

Стиль: фотореалистичный, мрачная атмосфера, детективный нуар.
Ракурс: вид спереди или 3/4, все объекты видны.
Освещение: приглушённое, драматичные тени.
Формат: широкий кадр 16:9.
БЕЗ текста, надписей, водяных знаков, людей."""

        try:
            response = await self.client.images.generate(
                model="gpt-image-1",
                prompt=prompt,
                n=1,
                size="1536x1024",
                quality="high",
            )

            image_b64 = response.data[0].b64_json
            image_bytes = base64.b64decode(image_b64)

            key = f"cases/{case_slug}/locations/{loc_data['slug']}.webp"
            local_rel = f"generated/{case_slug}/locations/{loc_data['slug']}.png"

            stored_path = await self._store_image(image_bytes, key, local_rel)
            return stored_path, image_bytes

        except Exception as e:
            logger.error("Failed to generate image for %s: %s", loc_data["slug"], e)
            return "", None

    def _position_hint(self, x: int, y: int) -> str:
        h = "слева" if x < 35 else "справа" if x > 65 else "по центру"
        v = "вверху" if y < 35 else "внизу" if y > 65 else "посередине"
        return f"{h}, {v}"

    # ─────────────────────────────────────────────
    # STEP 5: POI calibration (from bytes)
    # ─────────────────────────────────────────────

    async def _calibrate_pois_from_bytes(
        self, image_bytes: bytes, pois: list[dict],
        location_name: str, location_description: str,
    ) -> list[dict]:
        """Calibrate POI positions using image bytes (no disk read needed)."""
        image_b64 = base64.b64encode(image_bytes).decode()

        poi_list_text = "\n".join([
            f'  - id: "{p["id"]}", label: "{p["label"]}", description: "{p.get("description", "")}"'
            for p in pois
        ])

        calibration_prompt = f"""Проанализируй изображение локации и определи точные координаты каждого объекта.

Локация: {location_name}
Описание: {location_description}

Объекты для размещения:
{poi_list_text}

Для каждого объекта определи:
- x_percent: позиция LEFT-edge в процентах от ширины (0=левый, 100=правый)
- y_percent: позиция TOP-edge в процентах от высоты (0=верх, 100=низ)
- width_percent: ширина области (12-25%)
- height_percent: высота области (12-22%)

Ответь ТОЛЬКО JSON-массивом:
[{{"id": "poi_id", "x_percent": 25, "y_percent": 40, "width_percent": 18, "height_percent": 15}}, ...]"""

        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_b64}",
                                "detail": "high",
                            },
                        },
                        {"type": "text", "text": calibration_prompt},
                    ],
                }
            ],
            temperature=0.1,
            max_tokens=2000,
        )

        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = re.sub(r'^```(?:json)?\s*', '', raw)
            raw = re.sub(r'\s*```$', '', raw)

        calibrated = json.loads(raw)
        cal_map = {p["id"]: p for p in calibrated}
        for poi in pois:
            if poi["id"] in cal_map:
                cal = cal_map[poi["id"]]
                poi["x_percent"] = cal.get("x_percent", poi.get("x_percent", 50))
                poi["y_percent"] = cal.get("y_percent", poi.get("y_percent", 50))
                poi["width_percent"] = cal.get("width_percent", poi.get("width_percent", 18))
                poi["height_percent"] = cal.get("height_percent", poi.get("height_percent", 15))

        return pois

    # ─────────────────────────────────────────────
    # STEP 6: Character avatars
    # ─────────────────────────────────────────────

    async def _generate_avatar(self, char_data: dict, case_slug: str) -> str:
        prompt = f"""Фотореалистичный портрет для детективной игры.

Персонаж: {char_data['name']}
Профессия: {char_data.get('occupation', '')}
Характер: {char_data.get('personality', '')}

Стиль: фотореалистичный, тёмный фон, драматичное боковое освещение.
Формат: портрет крупным планом, квадратное соотношение.
Выражение лица: задумчивое или настороженное.
БЕЗ текста, надписей, водяных знаков."""

        try:
            response = await self.client.images.generate(
                model="gpt-image-1",
                prompt=prompt,
                n=1,
                size="1024x1024",
                quality="medium",
            )

            image_b64 = response.data[0].b64_json
            image_bytes = base64.b64decode(image_b64)

            key = f"cases/{case_slug}/characters/{char_data['slug']}.webp"
            local_rel = f"generated/{case_slug}/characters/{char_data['slug']}.png"

            return await self._store_image(
                image_bytes, key, local_rel,
                max_width=512, max_height=512, quality=80,
            )

        except Exception as e:
            logger.error("Failed to generate avatar for %s: %s", char_data["slug"], e)
            return ""

    # ─────────────────────────────────────────────
    # STEP 7: Evidence images
    # ─────────────────────────────────────────────

    async def _generate_evidence_image(self, ev_data: dict, case_slug: str) -> str:
        prompt = f"""Фотография улики для детективного расследования.

Улика: {ev_data['name']}
Тип: {ev_data.get('type', '')}
Описание: {ev_data.get('detailed_description', ev_data.get('description', ''))}

Стиль: вид сверху на тёмном столе следователя.
Освещение: направленный свет, мягкие тени.
Реалистичный стиль. Квадратный формат.
БЕЗ текста, надписей, водяных знаков."""

        try:
            response = await self.client.images.generate(
                model="gpt-image-1",
                prompt=prompt,
                n=1,
                size="1024x1024",
                quality="medium",
            )

            image_b64 = response.data[0].b64_json
            image_bytes = base64.b64decode(image_b64)

            key = f"cases/{case_slug}/evidence/{ev_data['slug']}.webp"
            local_rel = f"generated/{case_slug}/evidence/{ev_data['slug']}.png"

            return await self._store_image(
                image_bytes, key, local_rel,
                max_width=800, max_height=800, quality=80,
            )

        except Exception as e:
            logger.error("Failed to generate evidence image for %s: %s", ev_data["slug"], e)
            return ""

    # ─────────────────────────────────────────────
    # STEP 8: Save to DB
    # ─────────────────────────────────────────────

    async def _save_to_database(self, case_data: dict, db: AsyncSession, price: float = 0) -> UUID:
        from app.models import Case, Location, Character, Evidence, EvidenceConnection

        case_info = case_data["case"]

        case = Case(
            title=case_info["title"],
            slug=case_info["slug"],
            description=case_info["description"],
            difficulty=case_info.get("difficulty", "medium"),
            estimated_time_min=case_info.get("estimated_time_min", 60),
            cover_image=case_info.get("cover_image", ""),
            phases=case_info.get("phases"),
            solution=case_info.get("solution"),
            is_published=False,
            price=price,
        )
        db.add(case)
        await db.flush()

        for loc in case_data["locations"]:
            db.add(Location(
                case_id=case.id,
                name=loc["name"],
                slug=loc["slug"],
                description=loc.get("description", ""),
                image=loc.get("image", ""),
                sort_order=loc.get("sort_order", 0),
                is_initial=loc.get("is_initial", False),
                unlock_conditions=loc.get("unlock_conditions"),
                points_of_interest=loc.get("points_of_interest", []),
            ))

        for char in case_data["characters"]:
            db.add(Character(
                case_id=case.id,
                name=char["name"],
                slug=char["slug"],
                role=char.get("role", "suspect"),
                age=char.get("age"),
                occupation=char.get("occupation", ""),
                personality=char.get("personality", ""),
                backstory=char.get("backstory", ""),
                is_guilty=char.get("is_guilty", False),
                is_available_initially=char.get("is_available_initially", False),
                unlock_conditions=char.get("unlock_conditions"),
                alibi=char.get("alibi"),
                secrets=char.get("secrets", []),
                emotional_reactions=char.get("emotional_reactions", {}),
                ai_system_prompt=char.get("ai_system_prompt", ""),
                avatar=char.get("avatar", ""),
                sort_order=char.get("sort_order", 0),
            ))

        for ev in case_data["evidence"]:
            db.add(Evidence(
                case_id=case.id,
                name=ev["name"],
                slug=ev["slug"],
                type=ev.get("type", "physical"),
                description=ev.get("description", ""),
                detailed_description=ev.get("detailed_description", ""),
                image=ev.get("image", ""),
                location_slug=ev.get("location_slug"),
                found_at_poi=ev.get("found_at_poi"),
                found_conditions=ev.get("found_conditions"),
                importance=ev.get("importance", 1),
                tags=ev.get("tags", []),
                is_key_evidence=ev.get("is_key_evidence", False),
            ))

        for conn in case_data["evidence_connections"]:
            db.add(EvidenceConnection(
                case_id=case.id,
                evidence_a_slug=conn["evidence_a_slug"],
                evidence_b_slug=conn["evidence_b_slug"],
                connection_type=conn.get("connection_type", "supports"),
                description=conn.get("description", ""),
                is_key_connection=conn.get("is_key_connection", False),
            ))

        await db.commit()
        return case.id

    # ─────────────────────────────────────────────
    # PUBLIC: Image regeneration methods
    # ─────────────────────────────────────────────

    async def regenerate_cover(self, case_slug: str, case_info: dict) -> str:
        """Regenerate cover image. Returns new image path/URL."""
        return await self._generate_cover_image(case_info, case_slug)

    async def regenerate_location_image(self, case_slug: str, loc_data: dict) -> tuple[str, bytes | None]:
        """Regenerate location image. Returns (path, raw_bytes)."""
        return await self._generate_location_image(loc_data, case_slug)

    async def regenerate_avatar(self, case_slug: str, char_data: dict) -> str:
        """Regenerate character avatar. Returns new image path/URL."""
        return await self._generate_avatar(char_data, case_slug)

    async def regenerate_evidence_image(self, case_slug: str, ev_data: dict) -> str:
        """Regenerate evidence image. Returns new image path/URL."""
        return await self._generate_evidence_image(ev_data, case_slug)

    async def recalibrate_pois(self, image_bytes: bytes, pois: list[dict], location_name: str, location_description: str) -> list[dict]:
        """Recalibrate POI positions for a location image."""
        return await self._calibrate_pois_from_bytes(image_bytes, pois, location_name, location_description)


case_generator = CaseGenerator()
