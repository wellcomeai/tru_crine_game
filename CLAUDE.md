# TRU CRINE GAME — AI Detective Mystery Game

## Обзор проекта

Детективная mystery-игра с AI-допросами. Игрок расследует преступление: осматривает локации, собирает улики, допрашивает подозреваемых (через GPT-4o), строит связи на доске улик, выдвигает обвинение. AI оценивает результат.

**Стек:** FastAPI + PostgreSQL (бэкенд) | React 18 + Vite + TypeScript (фронтенд) | OpenAI GPT-4o (AI-допросы)

## Архитектура

```
tru_crine_game/
├── backend/                    # FastAPI бэкенд
│   ├── app/
│   │   ├── main.py             # Точка входа FastAPI, SPA-fallback
│   │   ├── config.py           # Настройки из .env (DB, JWT, OpenAI, Robokassa, R2)
│   │   ├── database.py         # SQLAlchemy async + asyncpg
│   │   ├── api/                # Роутеры
│   │   │   ├── router.py       # Агрегация всех роутов
│   │   │   ├── auth.py         # POST /auth/register, /auth/login, GET /auth/me
│   │   │   ├── cases.py        # GET /cases/, GET /cases/{id}, POST /cases/{id}/start
│   │   │   ├── game.py         # Состояние, локации, персонажи, фазы, осмотр, заметки
│   │   │   ├── evidence.py     # GET evidence, POST/DELETE connect, GET connections
│   │   │   ├── interrogation.py # start, message (SSE streaming), show-evidence, history
│   │   │   ├── accusation.py   # POST accuse, GET result
│   │   │   ├── admin.py        # CRUD дел (admin-only)
│   │   │   └── payments.py     # Robokassa интеграция
│   │   ├── models/             # SQLAlchemy ORM
│   │   │   ├── user.py         # users
│   │   │   ├── case.py         # cases (solution JSONB, phases JSONB)
│   │   │   ├── game_session.py # game_sessions (status, score, current_phase)
│   │   │   ├── game_state.py   # game_state (JSONB: visited, collected, connections, notes)
│   │   │   ├── location.py     # locations (POIs as JSONB, unlock_conditions, sort_order)
│   │   │   ├── character.py    # characters (secrets, alibi, emotional_reactions, ai_system_prompt)
│   │   │   ├── evidence.py     # evidence (type, importance, is_key_evidence, found_conditions)
│   │   │   ├── evidence_connection.py  # Каноничные связи между уликами
│   │   │   ├── interrogation_log.py    # Лог диалогов (messages JSONB)
│   │   │   ├── accusation.py   # Обвинения (score, feedback breakdown)
│   │   │   ├── action_history.py       # Undo система (state snapshots)
│   │   │   └── case_purchase.py        # Покупки дел
│   │   ├── schemas/            # Pydantic-схемы для валидации запросов/ответов
│   │   ├── services/
│   │   │   ├── auth_service.py     # BCrypt + JWT (HS256, 24h expiry)
│   │   │   ├── ai_service.py      # OpenAI: chat_stream, evaluate_motive/method, generate_summary
│   │   │   ├── game_engine.py     # Ядро: unlocks, conditions, visit/examine/connect/accuse
│   │   │   ├── seed_service.py    # Сидинг дел из case_data/
│   │   │   ├── payment_service.py # Robokassa URL-генерация, callback-верификация
│   │   │   └── storage.py         # Cloudflare R2 (S3-совместимый) для картинок
│   │   └── case_data/
│   │       └── case_001.py     # Данные дела: "Убийство в отеле «Гранд Палас»"
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── main.tsx            # Entry point
│   │   ├── App.tsx             # React Router маршруты
│   │   ├── pages/
│   │   │   ├── PublicLandingPage.tsx   # Маркетинговая страница
│   │   │   ├── LandingPage.tsx        # Авторизация (login/register)
│   │   │   ├── CasesPage.tsx          # Каталог дел
│   │   │   ├── GamePage.tsx           # Хаб: вкладки локации/персонажи/улики
│   │   │   ├── LocationPage.tsx       # Осмотр локации (интерактивные POI)
│   │   │   ├── InterrogationPage.tsx  # AI-допрос (SSE streaming, noPadding)
│   │   │   ├── BoardPage.tsx          # Доска улик (ReactFlow, пробковая доска, noPadding)
│   │   │   ├── NotebookPage.tsx       # Заметки и гипотезы
│   │   │   ├── AccusationPage.tsx     # Мастер обвинения (4 шага)
│   │   │   ├── ResultPage.tsx         # Результат и счёт
│   │   │   ├── AdminPage.tsx          # Админка: CRUD дел
│   │   │   └── AdminCasePreviewPage.tsx
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── GameLayout.tsx     # Обёртка: TopBar + Sidebar + content, prop noPadding
│   │   │   │   ├── TopBar.tsx         # Шапка: название дела, профиль, выход
│   │   │   │   └── Sidebar.tsx        # Навигация: локации/персонажи/улики
│   │   │   ├── Board/
│   │   │   │   ├── BoardCanvas.tsx    # ReactFlow канвас (фон — пробковая доска, виньетка)
│   │   │   │   ├── EvidenceNode.tsx   # Нода-карточка (пин, фото, звёзды, KEY badge)
│   │   │   │   └── ConnectionLine.tsx # Красные нити (dash/solid, glow, label-бирка)
│   │   │   ├── Interrogation/
│   │   │   │   ├── InterrogationScene.tsx  # Сцена с персонажем
│   │   │   │   ├── CharacterReply.tsx      # Streaming-ответ персонажа
│   │   │   │   ├── DialogueLog.tsx         # Лог переписки
│   │   │   │   ├── ChatInput.tsx           # Ввод сообщения
│   │   │   │   ├── EvidenceSelector.tsx    # Предъявление улик
│   │   │   │   └── EmotionBadge.tsx        # Бэйдж эмоции
│   │   │   ├── Game/                  # LocationCard, CharacterCard, EvidenceCard, EvidenceModal, PhaseIndicator
│   │   │   ├── Auth/                  # LoginForm, RegisterForm
│   │   │   └── UI/                    # Button, Modal, LoadingSpinner, ProgressBar
│   │   ├── stores/
│   │   │   ├── authStore.ts    # Zustand: token, user, login/register/logout
│   │   │   └── gameStore.ts    # Zustand: всё игровое состояние, API-методы
│   │   ├── hooks/
│   │   │   ├── useGame.ts           # Инициализация сессии, загрузка данных
│   │   │   └── useInterrogation.ts  # Управление допросом: SSE, эмоции, история
│   │   ├── api/
│   │   │   └── client.ts       # Axios (/api), JWT-интерсептор, streamChat() через fetch+SSE
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript интерфейсы (Case, Evidence, Character, PlayerState, etc.)
│   │   └── utils/
│   │       ├── helpers.ts      # getImageUrl(), getInitials(), formatTimestamp(), generateId()
│   │       └── constants.ts    # EVIDENCE_TYPE_ICONS, EMOTION_COLORS, ROLE_LABELS, DIFFICULTY_LABELS
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── images/                     # Статичные изображения (локации, персонажи, улики)
└── build.sh                    # npm install && npm run build (frontend → dist/)
```

## Игровой цикл

1. **Каталог дел** → Игрок выбирает дело, стартует сессию
2. **Расследование:**
   - Осмотр локаций (последовательный unlock по sort_order, все POI предыдущей локации должны быть осмотрены)
   - Сбор улик (examine POI → evidence привязана к конкретным точкам интереса)
   - AI-допросы персонажей (GPT-4o, streaming, эмоциональные реакции на улики)
   - Доска улик (ReactFlow: drag нод, создание связей, подтверждение каноничных связей)
   - Заметки и гипотезы
3. **Прогресс фаз** — 4 фазы, разблокируются через `completion_conditions`
4. **Обвинение** → AI-оценка (макс. 1050 очков)

## Система разблокировки

`game_engine.py` → `evaluate_conditions()` / `check_unlocks()`:

Условия (JSONB): `has_evidence`, `visited_location`, `examined_poi`, `interrogated`, `interrogated_with_evidence`, `evidence_count`, `connection_made`. Булевые: `and`, `or`. Проверяются после каждого действия.

## Система подсчёта очков

| Компонент     | Макс. | Механика                                       |
|---------------|-------|------------------------------------------------|
| Подозреваемый | 500   | Всё или ничего (угадал/нет)                    |
| Мотив         | 200   | AI оценивает текст игрока vs. правильный мотив |
| Метод         | 150   | AI оценивает текст игрока vs. правильный метод |
| Улики         | 150   | Доля ключевых улик в обвинении                 |
| Бонус         | 50    | Не использовал подсказки                       |
| **Итого**     | **1050** |                                             |

## AI-интеграция (OpenAI GPT-4o)

- **Допрос:** Streaming SSE (`chat_stream`), temperature 0.8, max 500 tokens
- **System prompt:** 6-слойный (базовые правила → профиль → секреты → алиби → эмоции на улики → кастомные инструкции)
- **Оценка обвинения:** `evaluate_motive()`, `evaluate_method()` — AI-судья возвращает JSON {score, feedback}
- **Story summary:** `generate_story_summary()` — нарративная развязка для правильных обвинений

## Ключевые типы (TypeScript)

```typescript
Evidence { id, slug, name, type, description, detailed_description, image, importance, tags, is_key_evidence }
Character { id, slug, name, role, age, occupation, avatar, interrogation_image, is_interrogated, is_locked, current_emotion }
PlayerState { visited_locations, collected_evidence, unlocked_characters, examined_pois, player_connections, player_notes, player_hypotheses }
PlayerConnection { a, b, note, is_confirmed, confirmation_text }
```

## Стилизация

- **TailwindCSS v3** — тёмная нуар-тема
- **Цвета:** `noir-900`/`noir-800` (фоны), `gold`/`#c9a84c` (акценты), `#cc3333` (красные нити/пины)
- **Доска улик:** Пробковая доска (CSS background-image), карточки `#f5f0e8`, пины CSS-градиенты, красные нити (stroke-dasharray)
- **Допрос:** Full-screen (`noPadding`), сцена + диалог + ввод
- **Шрифты:** Serif для заголовков, sans-serif для текста

## Команды

```bash
# Бэкенд
cd backend && uvicorn app.main:app --reload

# Фронтенд (dev)
cd frontend && npm run dev

# Билд фронтенда
cd frontend && npm install && npm run build

# Полный билд
./build.sh
```

## Переменные окружения (backend/.env)

```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/detective_game
SECRET_KEY=<64-char-hex>
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
IMAGES_BASE_URL=/images
ROBOKASSA_MERCHANT_LOGIN=
ROBOKASSA_PASSWORD_1=
ROBOKASSA_PASSWORD_2=
ROBOKASSA_TEST_MODE=false
APP_URL=http://localhost:5173
R2_ENDPOINT_URL=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=detective-ai
R2_PUBLIC_URL=
```

## Паттерны и соглашения

- **Роуты:** Все API под `/api/`, SPA-fallback для React Router
- **Стейт:** Zustand store (`authStore`, `gameStore`) — single source of truth
- **API-клиент:** Axios с JWT-интерсептором, 401 → auto-logout
- **Streaming:** fetch + ReadableStream + SSE-парсинг (не Axios)
- **Изображения:** `getImageUrl(path)` — relative → `/images/{path}`, http → as-is
- **Full-screen страницы:** `<GameLayout noPadding>` + `h-[calc(100vh-3.5rem)]`
- **Overlay-элементы:** `absolute z-40 bg-[rgba(10,10,15,0.7)] backdrop-blur-sm`
- **Иконки:** Lucide React
- **Тосты:** Sonner (`toast.success/error`)
- **Граф улик:** @xyflow/react с кастомными nodeTypes/edgeTypes
- **Язык интерфейса:** Русский
