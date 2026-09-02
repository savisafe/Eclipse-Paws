# Eclipse Paws — Лапы затмения

Браузерный 2D action-platformer об охраняющих цикл дня и ночи котах Люме и Ноксе.
Текущий вертикальный прототип содержит платформенную арену, бой, смену героя и фазу суток.
Игровые модели используют локальный детализированный raster atlas по утверждённому concept art.

## Требования

- Node.js 20.19+ (рекомендуется актуальный LTS или новее)
- npm 11+

## Быстрый старт

```bash
npm install
npm run dev
```

Vite выведет локальный URL. Звук в будущих этапах будет запускаться только после жеста пользователя.

## Команды

| Команда                | Назначение                                           |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | локальная разработка                                 |
| `npm run build`        | строгая проверка TypeScript и production build       |
| `npm run preview`      | локальный просмотр production build                  |
| `npm run lint`         | ESLint без допустимых предупреждений                 |
| `npm run typecheck`    | строгая проверка TypeScript                          |
| `npm run test`         | unit/component тесты Vitest                          |
| `npm run test:e2e`     | Playwright smoke на desktop и mobile                 |
| `npm run format:check` | проверка Prettier                                    |
| `npm run check`        | format, lint, typecheck, unit и build одной цепочкой |

## Управление (для этапа 1+)

- `A` / `D` или стрелки — бег
- `W` / `Space` / стрелка вверх — прыжок
- ЛКМ — основная атака
- `Shift` — рывок/теневой шаг
- `Q` — щит Люмы или приманка Нокса
- `F` — молния Люмы или тьма Нокса из-под земли
- `R` — ручная смена фазы за 50% шкалы Затмения
- `X` — совместное «Объятие затмения» при полной шкале
- `E` — взаимодействие
- `Tab` — анимированная tag-смена кота в текущей позиции
- `T` — быстрый возврат к checkpoint
- `Esc` — пауза

Игровая логика оперирует абстрактным `GameAction`, а не конкретными клавишами.

## Архитектура

Зависимости направлены внутрь: `core` не знает о React, DOM, Phaser или Capacitor. Use cases
находятся в `application`; браузер, хранилище, ввод и Phaser — в `adapters`; React отвечает
только за UI и состояние интерфейса. Подробнее: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```text
src/
  core/          pure TypeScript rules and state
  application/   use cases and orchestration
  adapters/      Phaser, input, storage and haptics ports/adapters
  ui/            React screens, HUD and Zustand UI/session state
  content/       typed declarative game content
  assets/        local replaceable art/audio/font assets
  shared/        framework-independent utilities with real reuse
```

Основное ТЗ и статус находятся в [CODEX_GAME_MASTER_PLAN.md](CODEX_GAME_MASTER_PLAN.md).
