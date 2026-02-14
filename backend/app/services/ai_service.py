import json
import logging
from typing import AsyncGenerator, Optional

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


class AIService:

    def build_system_prompt(
        self,
        character: dict,
        game_state: dict,
        interrogation_history: list,
        collected_evidence: list,
    ) -> str:
        # Layer 1: Base rules
        prompt = """Ты — персонаж в детективной игре. Тебя допрашивает следователь.

ПРАВИЛА:
1. НИКОГДА не выходи из роли. Ты — живой человек, не AI.
2. Отвечай ТОЛЬКО от лица своего персонажа.
3. Не признавайся в преступлении напрямую, даже если виновен.
4. Реагируй эмоционально на предъявленные улики.
5. Можешь врать, уклоняться, нервничать, злиться.
6. Отвечай на русском языке.
7. Ответы 1-4 предложения, как в реальном допросе.
8. Помни всё, что было сказано ранее в допросе.
"""

        # Layer 2: Character profile
        prompt += f"""
ТВОЙ ПРОФИЛЬ:
Имя: {character['name']}
Возраст: {character.get('age', 'неизвестно')}
Профессия: {character.get('occupation', 'неизвестно')}
Роль: {character.get('role', 'свидетель')}
Характер: {character.get('personality', '')}
"""

        # Layer 3: Secrets and alibi
        prompt += f"""
ТВОЯ ИСТОРИЯ (знаешь только ты):
{character.get('backstory', '')}

ТВОЁ АЛИБИ:
{character.get('alibi', 'У тебя нет конкретного алиби.')}

ТВОИ СЕКРЕТЫ:
"""
        secrets = character.get('secrets', [])
        for secret in secrets:
            prompt += f"- {secret.get('content', '')}\n"

        # Layer 4: Emotional reactions
        emotional_reactions = character.get('emotional_reactions', {})
        if emotional_reactions:
            prompt += "\nРЕАКЦИИ НА УЛИКИ (если следователь предъявит):\n"
            for evidence_slug, reaction in emotional_reactions.items():
                prompt += f"- Если предъявят '{evidence_slug}': реакция — {reaction.get('reaction', 'нейтральная')}. {reaction.get('instruction', '')}\n"

        # Layer 5: Dynamic context
        shown_evidence = []
        for msg in interrogation_history:
            if msg.get('evidence_shown'):
                shown_evidence.append(msg['evidence_shown'])

        if shown_evidence:
            prompt += f"\nУЖЕ ПРЕДЪЯВЛЕННЫЕ УЛИКИ: {', '.join(shown_evidence)}\n"
            prompt += "Учитывай это в своих ответах — ты помнишь, что тебе показывали.\n"

        # Layer 6: Custom system prompt from character data
        if character.get('ai_system_prompt'):
            prompt += f"\nДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:\n{character['ai_system_prompt']}\n"

        return prompt

    async def chat_stream(self, messages: list[dict]) -> AsyncGenerator[str, None]:
        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=0.8,
                max_tokens=500,
                stream=True,
            )
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            yield f"[Ошибка связи с персонажем. Попробуйте снова.]"

    async def chat_full(self, messages: list[dict]) -> str:
        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=0.8,
                max_tokens=500,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI error: {e}")
            return ""

    async def evaluate_motive(self, player_motive: str, correct_motive: str) -> dict:
        messages = [
            {
                "role": "system",
                "content": "Ты — оценщик детективной игры. Оцени насколько мотив, названный игроком, совпадает с правильным. Ответь JSON: {\"score\": 0-200, \"feedback\": \"пояснение\"}"
            },
            {
                "role": "user",
                "content": f"Правильный мотив: {correct_motive}\nМотив игрока: {player_motive}"
            }
        ]
        text = await self.chat_full(messages)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"score": 100, "feedback": "Частично верно."}

    async def evaluate_method(self, player_method: str, correct_method: str) -> dict:
        messages = [
            {
                "role": "system",
                "content": "Ты — оценщик детективной игры. Оцени насколько метод убийства, названный игроком, совпадает с правильным. Ответь JSON: {\"score\": 0-150, \"feedback\": \"пояснение\"}"
            },
            {
                "role": "user",
                "content": f"Правильный метод: {correct_method}\nМетод игрока: {player_method}"
            }
        ]
        text = await self.chat_full(messages)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"score": 75, "feedback": "Частично верно."}

    async def generate_story_summary(self, case_solution: dict, player_score: int) -> str:
        messages = [
            {
                "role": "system",
                "content": "Ты — рассказчик детективной игры. Напиши краткий (2-3 абзаца) рассказ о том, что произошло на самом деле. Пиши на русском, атмосферно и интригующе."
            },
            {
                "role": "user",
                "content": f"""Разгадка дела:
Убийца: {case_solution.get('guilty', 'неизвестно')}
Мотив: {case_solution.get('motive', 'неизвестно')}
Метод: {case_solution.get('method', 'неизвестно')}
Очки игрока: {player_score}/1050

Напиши что произошло на самом деле."""
            }
        ]
        return await self.chat_full(messages)

    async def generate_greeting(self, character: dict) -> str:
        messages = [
            {
                "role": "system",
                "content": self.build_system_prompt(character, {}, [], [])
            },
            {
                "role": "user",
                "content": "[Следователь входит в комнату для допросов и садится напротив вас.]"
            }
        ]
        return await self.chat_full(messages)


ai_service = AIService()
