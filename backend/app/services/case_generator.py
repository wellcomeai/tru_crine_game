"""
AI-powered case generation service.

Full pipeline: plot -> validation -> images -> POI calibration -> DB save.
"""

import json
import logging
import base64
import re
from pathlib import Path
from uuid import UUID

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

logger = logging.getLogger(__name__)

# Directory for generated images — served via FastAPI StaticFiles
IMAGES_BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent / "images" / "generated"


class CaseGenerator:
    """Generates detective cases using AI."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # ─────────────────────────────────────────────
    # PUBLIC: full pipeline
    # ─────────────────────────────────────────────

    async def generate_full_case(
        self,
        db: AsyncSession,
        theme: str | None = None,
        difficulty: str = "medium",
        num_suspects: int = 4,
        setting: str | None = None,
    ) -> dict:
        result = {"status": "in_progress", "steps": [], "errors": []}

        try:
            # Step 1: Plot
            logger.info("Step 1/7: Generating plot...")
            case_data = await self._generate_plot(theme, difficulty, num_suspects, setting)
            result["steps"].append({"step": "plot_generation", "status": "done"})

            # Step 2: Validation
            logger.info("Step 2/7: Validating...")
            errors = self._validate_case_data(case_data)
            if errors:
                logger.warning(f"Validation failed: {errors}")
                case_data = await self._fix_plot(case_data, errors)
                errors = self._validate_case_data(case_data)
                if errors:
                    result["status"] = "error"
                    result["errors"] = errors
                    return result
            result["steps"].append({"step": "validation", "status": "done"})

            case_slug = case_data["case"]["slug"]

            # Create directories
            for subdir in ["locations", "characters", "evidence"]:
                (IMAGES_BASE_DIR / case_slug / subdir).mkdir(parents=True, exist_ok=True)

            # Step 3: Location images
            logger.info("Step 3/7: Generating location images...")
            for loc_data in case_data["locations"]:
                img_path = await self._generate_location_image(loc_data, case_slug)
                loc_data["image"] = img_path
            result["steps"].append({"step": "location_images", "status": "done"})

            # Step 4: POI calibration
            logger.info("Step 4/7: Calibrating POI positions...")
            for loc_data in case_data["locations"]:
                if loc_data.get("points_of_interest") and loc_data.get("image"):
                    full_path = IMAGES_BASE_DIR.parent / loc_data["image"]
                    if full_path.exists():
                        loc_data["points_of_interest"] = await self._calibrate_pois(
                            str(full_path),
                            loc_data["points_of_interest"],
                            loc_data["name"],
                            loc_data["description"],
                        )
            result["steps"].append({"step": "poi_calibration", "status": "done"})

            # Step 5: Character avatars
            logger.info("Step 5/7: Generating character avatars...")
            for char_data in case_data["characters"]:
                avatar_path = await self._generate_avatar(char_data, case_slug)
                char_data["avatar"] = avatar_path
            result["steps"].append({"step": "avatars", "status": "done"})

            # Step 6: Evidence images (key evidence only)
            logger.info("Step 6/7: Generating evidence images...")
            key_evidence_slugs = case_data["case"]["solution"].get("key_evidence", [])
            for ev_data in case_data["evidence"]:
                if ev_data["slug"] in key_evidence_slugs:
                    ev_img = await self._generate_evidence_image(ev_data, case_slug)
                    ev_data["image"] = ev_img
            result["steps"].append({"step": "evidence_images", "status": "done"})

            # Step 7: Save to DB
            logger.info("Step 7/7: Saving to database...")
            case_id = await self._save_to_database(case_data, db)
            result["steps"].append({"step": "database_save", "status": "done"})

            result["status"] = "completed"
            result["case_id"] = str(case_id)
            result["case_slug"] = case_slug

        except Exception as e:
            logger.exception("Case generation failed")
            result["status"] = "error"
            result["errors"].append(str(e))

        return result

    # ─────────────────────────────────────────────
    # STEP 1: Plot generation
    # ─────────────────────────────────────────────

    async def _generate_plot(
        self,
        theme: str | None,
        difficulty: str,
        num_suspects: int,
        setting: str | None,
    ) -> dict:
        theme_instruction = ""
        if theme:
            theme_instruction = f"\nТЕМА ДЕЛА: {theme}"
        if setting:
            theme_instruction += f"\nСЕТТИНГ: {setting}"

        difficulty_hints = {
            "easy": "3 подозреваемых, более очевидные улики, менее сложные связи",
            "medium": "4 подозреваемых, умеренная сложность, несколько ложных следов",
            "hard": "5 подозреваемых, сложные связи, много ложных следов, неочевидный мотив",
        }
        diff_hint = difficulty_hints.get(difficulty, difficulty_hints["medium"])

        system_prompt = f"""Ты — сценарист детективных игр.
Создай полноценное детективное дело в формате JSON.

ВСЕ ТЕКСТЫ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ.
Slugs и id — на латинице (snake_case).

СЛОЖНОСТЬ: {difficulty} ({diff_hint})
КОЛИЧЕСТВО ПОДОЗРЕВАЕМЫХ: {num_suspects}
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
3. Локации: 4-6 штук. Первая — is_initial=true. Остальные — is_initial=false.
4. POI: 2-4 на локацию. Не все с уликами (evidence_slug=null для атмосферных).
5. Улики: 8-12 штук. key_evidence — 4-6 штук.
6. Связи: минимум 6.
7. Slugs: уникальные, snake_case, латиница.
8. POI координаты: примерные позиции, раскидать по изображению.
9. ai_system_prompt: подробно описать речевую манеру, что скрывает, как реагирует.

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
        loc_slugs = [l["slug"] for l in data["locations"]]

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

        initial = [l for l in data["locations"] if l.get("is_initial")]
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
    # STEP 3: Location images
    # ─────────────────────────────────────────────

    async def _generate_location_image(self, loc_data: dict, case_slug: str) -> str:
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

            filename = f"{loc_data['slug']}.png"
            rel_path = f"generated/{case_slug}/locations/{filename}"
            full_path = IMAGES_BASE_DIR / case_slug / "locations" / filename
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_bytes(image_bytes)

            return rel_path

        except Exception as e:
            logger.error(f"Failed to generate image for {loc_data['slug']}: {e}")
            return ""

    def _position_hint(self, x: int, y: int) -> str:
        h = "слева" if x < 35 else "справа" if x > 65 else "по центру"
        v = "вверху" if y < 35 else "внизу" if y > 65 else "посередине"
        return f"{h}, {v}"

    # ─────────────────────────────────────────────
    # STEP 4: POI calibration
    # ─────────────────────────────────────────────

    async def _calibrate_pois(
        self, image_path: str, pois: list[dict], location_name: str, location_description: str,
    ) -> list[dict]:
        with open(image_path, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode()

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
    # STEP 5: Character avatars
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

            filename = f"{char_data['slug']}.png"
            rel_path = f"generated/{case_slug}/characters/{filename}"
            full_path = IMAGES_BASE_DIR / case_slug / "characters" / filename
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_bytes(image_bytes)

            return rel_path

        except Exception as e:
            logger.error(f"Failed to generate avatar for {char_data['slug']}: {e}")
            return ""

    # ─────────────────────────────────────────────
    # STEP 6: Evidence images
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

            filename = f"{ev_data['slug']}.png"
            rel_path = f"generated/{case_slug}/evidence/{filename}"
            full_path = IMAGES_BASE_DIR / case_slug / "evidence" / filename
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_bytes(image_bytes)

            return rel_path

        except Exception as e:
            logger.error(f"Failed to generate evidence image for {ev_data['slug']}: {e}")
            return ""

    # ─────────────────────────────────────────────
    # STEP 7: Save to DB
    # ─────────────────────────────────────────────

    async def _save_to_database(self, case_data: dict, db: AsyncSession) -> UUID:
        from app.models import Case, Location, Character, Evidence, EvidenceConnection

        case_info = case_data["case"]

        case = Case(
            title=case_info["title"],
            slug=case_info["slug"],
            description=case_info["description"],
            difficulty=case_info.get("difficulty", "medium"),
            estimated_time_min=case_info.get("estimated_time_min", 60),
            phases=case_info.get("phases"),
            solution=case_info.get("solution"),
            is_published=False,
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


case_generator = CaseGenerator()
