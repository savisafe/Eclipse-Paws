# Eclipse Paws

Браузерная 2D/2.5D action-platformer игра (Phaser 3 + React 19 + TypeScript, Vite).

> Источники истины по сюжету и плану реконструкции: `docs/ECLIPSE_PAWS_SCENARIO.md` и
> `docs/ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md` (см. приоритет документов в §2 плана). Этот README —
> только про команды запуска, разработки и проверки; здесь нет и не должно быть сюжетных или
> архитектурных решений.

## Требования

- Node.js `>=20.19.0` (см. `package.json` → `engines`).
- npm (используется как менеджер пакетов; `package-lock.json` зафиксирован).

## Установка

```bash
npm install
```

## Разработка

```bash
npm run dev
```

Запускает Vite dev-сервер с HMR (по умолчанию `http://localhost:5173`).

Полезные query-параметры для отладки в dev-режиме (см. `src/ui/App.tsx`, работают только при
`import.meta.env.DEV`):

- `?level=<CampaignLevelId>` — открыть конкретный уровень вместо первого (`garden-first-dawn`).
- `?heroLevel=<N>` — переопределить уровень героя (открывает связанные способности сразу).
- `?phaseDurationMs=<N>` — переопределить длительность дневной/ночной фазы уровня.

## Сборка

```bash
npm run build
```

`tsc -b && vite build` — сначала строгая проверка типов всего проекта (`tsconfig.json`,
`tsconfig.app.json`, `tsconfig.node.json`), затем production-сборка в `dist/`.

```bash
npm run preview
```

Локально поднимает собранный `dist/` для проверки production-сборки.

## Проверки

```bash
npm run lint          # ESLint (flat config), включая архитектурные границы core/application/content/adapters
npm run format:check  # Prettier — только проверка, без изменений
npm run format        # Prettier — с автоисправлением
npm run typecheck     # tsc -b --pretty false, без сборки
npm run test          # Vitest (unit, jsdom) — tests/unit/**
npm run test:watch    # Vitest в watch-режиме
npm run test:e2e      # Playwright (smoke/e2e) — tests/e2e/**, поднимает dev-сервер сам
```

```bash
npm run check
```

Агрегирующий скрипт: `format:check && lint && typecheck && test && build` — тот же набор проверок,
который ожидается перед тем как переводить задачу в `REVIEW` (см. Definition of Done в
`docs/ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md` §5 и `docs/ADDING_CONTENT.md`).

`test:e2e` поднимает свой собственный dev-сервер на `http://127.0.0.1:4173` (см.
`playwright.config.ts`) — не нужно запускать `npm run dev` заранее для e2e-тестов.

## Структура проекта

Актуальное состояние структуры `src/` и её соответствие целевой архитектуре описаны в
`docs/AUDITS/CURRENT_STATE.md`. Процесс добавления нового врага/способности/уровня — в
`docs/ADDING_CONTENT.md`.

## Документация

- `docs/ECLIPSE_PAWS_SCENARIO.md` — сюжет, персонажи, семь уровней, способности.
- `docs/ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md` — этапы работ, статусы задач, архитектурные
  требования, роли агентов.
- `docs/AUDITS/` — технические аудиты текущего состояния кода.
- `docs/HANDOFFS/` — отчёты по выполненным задачам (`TASK_ID.md`).
- `docs/ADDING_CONTENT.md` — как добавить нового врага/способность/уровень.
- `docs/ENVIRONMENT_ART_DIRECTION.md` — art direction фоновых окружений.
