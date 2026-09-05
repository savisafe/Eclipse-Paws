# AUD-001..011 — Текущее состояние репозитория (baseline)

- Дата: 2026-09-05
- Baseline commit: `e8e1dab`
- Незакоммиченные изменения на момент аудита: правки `src/adapters/phaser/arena-decoration.ts`,
  `src/adapters/phaser/prototype-scene.ts`, `src/assets/environments/README.md`, новый
  `src/adapters/phaser/dream-environment-manifest.ts` и новый `docs/ENVIRONMENT_ART_DIRECTION.md`,
  плюс 7 пар PNG/JPG мастер-фонов под семь уровней нового сценария в
  `src/assets/environments/dream-*-v1.{png,jpg}`. Это активная работа art-агента по декорациям
  (уже соответствует семи локациям `ECLIPSE_PAWS_SCENARIO.md`) — не трогать и не откатывать.

## 1. Технологии (package.json)

| Категория          | Факт                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Игровой движок     | Phaser `3.90.0`, Arcade Physics                                                                                                                |
| UI                 | React `19.2.8` + Radix UI (dialog/dropdown/slider/switch)                                                                                      |
| UI state           | Zustand `5.0.15` (`session-store.ts`, `settings-store.ts`)                                                                                     |
| Мобильная оболочка | `@capacitor/*` в зависимостях, но **нигде не подключена**: нет `capacitor.config.*`, нет `ios/`/`android/`, 0 импортов `@capacitor/*` в `src/` |
| Сборка             | Vite `8.2.2`, TypeScript `6.0.3` (strict, `noUncheckedIndexedAccess`, `noImplicitOverride`)                                                    |
| Тесты              | Vitest `4.1.11` (unit/jsdom), Playwright `1.62.1` (e2e), Testing Library                                                                       |
| Линт/формат        | ESLint `10` (flat config), Prettier `3.9.6`                                                                                                    |
| Валидация схем     | Zod — **отсутствует**                                                                                                                          |
| RNG                | Seeded/детерминированный RNG — **отсутствует**, `Math.random` тоже нигде не используется                                                       |

Скрипты: `dev`, `build` (`tsc -b && vite build`), `preview`, `lint`, `format`/`format:check`,
`typecheck`, `test`, `test:watch`, `test:e2e`, `check` (агрегирует всё — уже готовый CI-гейт).

## 2. Структура src/ vs целевая архитектура плана

Фактическая структура уже на **~40-50% совпадает** с целевым деревом из
`ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md` §4:

```
src/core/         gameplay/ (11 файлов, ~648 строк), save/, state/   — но без подпапок
                    abilities/combat/entities/events/phase/progression/state-machine
src/application/  app-controller.ts, gameplay-controller.ts,
                    progress-service.ts, ports/                       — без подпапок
                    commands/queries/services
src/adapters/     phaser/ (27 файлов, ~3240 строк), input/, storage/, haptics/
src/content/      abilities/, dialogues/, enemies/, levels/            — нет characters/
src/ui/           components/ (16), hooks/, store/, styles/
src/shared/       index.ts — пустая заглушка
src/assets/       sprites/, environments/, concepts/ (~24 MB)
```

Названия каталогов верхнего уровня и направление зависимостей уже соответствуют плану.
Не хватает только внутренней декомпозиции `core` и `application` на подпапки — это
низкорисковое механическое перемещение файлов.

## 3. Архитектурные границы

- **`src/core` не импортирует Phaser/React/DOM** — подтверждено grep'ом (0 совпадений на
  `phaser|react|document\.|window\.`, кроме ложных срабатываний на "phase" в идентификаторах).
- **`localStorage`** используется ровно в одном месте — `src/ui/App.tsx:59`
  (`new ProgressService(new LocalStorageSaveRepository(window.localStorage))`), обёрнут портом
  `SaveRepository` (`src/application/ports/save-repository.ts`) — граница соблюдена.
- `application/*` зависит только от `@core` и своих портов; `adapters/phaser/*` зависит от
  `@application`/`@core`/`@content`/`@adapters/input`/`@adapters/haptics` — направление
  корректное, нарушений не найдено.
- **Нет инструментальной защиты границ** (`eslint-plugin-boundaries` и т.п.) — чистота держится
  на дисциплине, не на тулинге. Первая вещь, которая может незаметно сломаться при добавлении
  новых агентов/веток.
- `src/ui/App.tsx:61-68` держит копию прогресса героя в `useState` (`heroProgress`,
  `unlockedLevels`, `selectedLevel`) — по сути кэш из `ProgressService`. Не нарушение "core
  недоступен из UI", но размывает "ui не хранит gameplay state" — стоит формализовать через явный
  сервис/селектор.

## 4. State machine / bridge / save schema / content validation

| Требование плана                  | Статус                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State machine                     | Есть: `src/core/state/app-state-machine.ts` + `app-state.ts` (`APP_TRANSITIONS`, `canTransition`, `InvalidAppTransitionError`)                                                                                                                                                                                                                                                                                         |
| Event/command bridge Phaser↔React | Есть, но неформализован: `GameplayController` (`src/application/gameplay-controller.ts`) даёт команды/`drainEvents()`/`subscribeToEvents`, `PrototypeScene` транслирует Phaser input в вызовы контроллера (`prototype-scene.ts:180-235`) и подписывается на `GameEvent` (например `HeroLevelUp` → `prototype-scene.ts:321-344`). Нет отдельных `application/commands`/`application/queries` — всё методы одного класса |
| Save schema с versioning          | Есть: `SAVE_SCHEMA_VERSION = 2` (`src/core/save/save-game.ts:3`), `parseSaveGame()` + `migrateSave()` для 0/1→2, но валидация полностью ручная (`typeof`/`Array.isArray`), без схемной библиотеки                                                                                                                                                                                                                      |
| Content validation (Zod и т.п.)   | **Отсутствует полностью.** Все конфиги в `src/content/*` — typed object literals без runtime-проверки                                                                                                                                                                                                                                                                                                                  |

## 5. Игровой цикл / физика / контент — KEEP / REFACTOR / REPLACE / REMOVE

### KEEP (паттерн верный, переносить как есть)

- Fixed simulation step: `prototype-scene.ts:30,60,198-202` — `FIXED_STEP_MS = 1000/60`,
  аккумулятор с `Math.min(deltaMs, 250)` защитой от spiral-of-death, `while (accumulator >=
FIXED_STEP_MS) fixedUpdate(...)`. Полностью соответствует требованию плана.
- Декомпозиция сцены на небольшие системы: `player-movement-system.ts` (66 строк),
  `combat-ability-system.ts` (156), `tag-switch-system.ts` (116), `phase-bridge-system.ts` (42).
- `create-prototype-game.ts` (38 строк) — минимальная фабрика `Phaser.Game`.
- Формат декларативного контента уровней/абилок/врагов (`campaign-levels.ts` 395 строк,
  `prototype-abilities.ts`, `prototype-monsters.ts`) — переиспользовать структуру, добавив Zod
  поверх.
- Новый `dream-environment-manifest.ts` + `arena-decoration.ts` (в работе art-агента) — декларативная
  привязка уровень→фон/акцент/мотив уже сделана по образцу семи локаций сценария, конвейор
  preload (`preloadEnvironment`/`preloadSpriteAtlas`) стоит сохранить как паттерн.

### REFACTOR (логика верная, но перемешана с рендером/не декомпозирована)

- `prototype-scene.ts` (345 строк) — god-object: `create()` вручную конструирует и склеивает 5+
  систем через общие мутируемые поля (`#actionLockMs`, `#facing`, `#actors`). Нужно вынести
  композицию в фабрику в `adapters/phaser`, сцена должна остаться тонким host'ом.
- `platformer-enemy-system.ts` (455 строк, самый большой файл в проекте) — вероятно правила боя
  (радиус атаки, урон) перемешаны с Phaser-рендером. Требует построчного разбора и вынесения
  чистых правил в `core/combat`/`core/entities`. Самый рискованный участок рефакторинга.
- Cleanup сцены неполный: `PrototypeScene#shutdown()` (`prototype-scene.ts:313-319`) вызывает
  `destroy()` только у `combatSystem` и `tagSwitchSystem`. `#enemySystem`
  (`PlatformerEnemySystem`), `#levelMechanics` (`LevelMechanicsSystem`), `#playerMovement`,
  `#tutorialSystem` не имеют `destroy()` вовсе.
- `SaveGame` ручная валидация → перевести на Zod, сохранив текущую логику `migrateSave`.
- `garden-flower-puzzle.ts` (314), `animated-enemy-atlas.ts` (296), `platformer-effects.ts` (218) —
  разобрать по тому же принципу (core-правила отдельно от рендера) при подходе к соответствующим
  уровням.

### REPLACE (сюжет/контент меняется по новому сценарию, техническая обёртка может остаться)

- `campaign-dialogues.ts` (59 строк) — формат id/beat можно оставить, содержимое полностью
  переписывается под новую историю Элиаса/Лумуса/Нокса.
- Процедурная генерация спрайтов кодом (`sprite-atlas.ts` 174 строки,
  `garden-enemy-atlas.ts`/`stage4-enemy-atlas.ts`/`stage5-enemy-atlas.ts`) — со сменой арт-стиля,
  скорее всего, заменяется на настоящие ассеты/атласы вместо кодогенерации.
- Весь текущий сюжетный контент уровней (`campaign-levels.ts`) под новую тему семи локаций —
  геометрия/интерактивы перестраиваются под "Сад первой зари" и т.д., но формат данных остаётся.

### REMOVE / решить отдельно

- `@capacitor/*` зависимости — установлены, но 0 использований в `src/`, нет конфигов и нативных
  проектов. Либо удалить как мёртвый вес, либо довести до реального использования
  (`CapacitorHapticsAdapter`, `CapacitorStorageAdapter`) при планировании Фазы 14.
- Дублирующиеся форматы фонов: `src/assets/environments/*-v1.{jpg,png}` хранятся одновременно
  для всех 7 новых локаций — уточнить у art-агента/координатора, какой формат уходит в рантайм
  (вероятно WebP по `ART_BIBLE`/плану §7, JPG/PNG — временные экспортные копии).
- `WebHapticsAdapter` называется "Web", но `@capacitor/haptics` установлен и не используется —
  привести название/реализацию в соответствие фактическому состоянию.

## 6. Тесты

**Unit (`tests/unit/`, 13 файлов):** `app-state-machine`, `app.test.tsx`, `boss-phase-tracker`,
`campaign-levels`, `combat-rules`, `cooldown-tracker`, `eclipse-meter`, `enemy-ai-profile`,
`game-input-state`, `game-session`, `phase-cycle`, `save-game`, `sequence-puzzle`. Покрытие
сфокусировано на `core`/малой части `application`/`adapters/input` — правильная инвестиция
(тестируется логика, не Phaser-рендер). Ни один Phaser-адаптер не покрыт unit-тестами.

**E2E (`tests/e2e/`):** `boot-menu.spec.ts` (доступность, отсутствие overflow/console errors,
реальный игровой сценарий прыжка через платформу), `pwa.spec.ts` (manifest/service worker).

**Пробелы:** нет интеграционных тестов на полный переход между уровнями через state machine, не
подтверждено покрытие миграции `SaveGame` именно со старых версий 0/1→2 (нужно перечитать
`save-game.test.ts` отдельно).

## 7. KEEP/REFACTOR/REPLACE/REMOVE — сводная таблица

| Область                                 | Статус                                | Комментарий                                                             |
| --------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| Fixed-step game loop                    | KEEP                                  | Уже соответствует плану                                                 |
| State machine приложения                | KEEP                                  | `AppStateMachine` — корректно инкапсулирован                            |
| SaveRepository/localStorage изоляция    | KEEP                                  | Единственная точка доступа, порт соблюдён                               |
| Декомпозиция сцены на системы (паттерн) | KEEP (паттерн), REFACTOR (композиция) | Системы маленькие, но собираются вручную в `prototype-scene.ts`         |
| `platformer-enemy-system.ts`            | REFACTOR                              | Смешаны core-правила и рендер, самый большой файл                       |
| Cleanup/destroy() сцены                 | ~~REFACTOR~~ **ЗАКРЫТО** (`ARC-010`)  | Все 6 систем реализуют `Destroyable`; расследование показало, что Phaser сам чистит твины/таймеры/game-объекты на `SHUTDOWN` — реальной утечки не было, см. `docs/HANDOFFS/ARC-010.md` |
| SaveGame validation                     | REFACTOR                              | Ручная → Zod, логика миграции остаётся                                  |
| Content validation                      | REPLACE (добавить с нуля)             | Zod отсутствует полностью                                               |
| Seeded RNG                              | REPLACE (добавить с нуля)             | Не существует в проекте вовсе                                           |
| `campaign-dialogues.ts` содержимое      | REPLACE                               | Новый сюжет по сценарию, формат остаётся                                |
| Процедурные спрайт-атласы               | REPLACE                               | Смена арт-стиля вероятно требует настоящих ассетов                      |
| `campaign-levels.ts` геометрия/контент  | REPLACE                               | Новые 7 локаций по сценарию, формат данных остаётся                     |
| Environment backgrounds (в работе)      | KEEP (уже делается)                   | 7 мастер-фонов + `dream-environment-manifest.ts`, art-агент in progress |
| `@capacitor/*` зависимости              | REMOVE или довести                    | 0 использований, мёртвый вес                                            |
| Дубликаты `.jpg`/`.png` фонов           | REMOVE (после решения)                | Требует явного решения о финальном рантайм-формате                      |
| ESLint boundaries enforcement           | Добавить                              | Инструментальная защита архитектурных границ отсутствует                |

## 8. Первые конкретные шаги

> Важно: пункты ниже ссылаются на канонические `ARC-NNN` id из чек-листа Фазы 1 плана
> (`ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md` §9, «Фаза 1»), а не на новую нумерацию. Более того, при
> первом аудите часть этого чек-листа оказалась уже выполненной **до** начала работы над планом —
> см. отметки «уже выполнено» ниже. Там, где готового `ARC-NNN` для конкретного шага нет, шаг
> описан без номера, чтобы не создавать конфликт с существующей нумерацией.

Статус пунктов Фазы 1 на момент аудита (до правок этой сессии):

- `ARC-002` (strict TS/lint/format/typecheck), `ARC-003` (Vitest + характеризационные тесты),
  `ARC-004` (Playwright smoke), `ARC-005` (application state machine), `ARC-006` (event/command
  bridge Phaser↔React), `ARC-007` (абстрактный `GameAction` + input adapters), `ARC-008`
  (`SaveRepository` + версионированный save schema) — **уже реализованы** до начала этой сессии
  (см. `src/core/state-machine/*`, `src/application/services/gameplay-controller.ts`,
  `src/adapters/input/*`, `src/core/save/*`, существующие тесты).
- `ARC-001` (утвердить целевую архитектуру и dependency rules), `ARC-009` (content schema
  validation), `ARC-010` (scene lifecycle contract и leak test), `ARC-011` (перенести одну
  механику end-to-end как пример), `ARC-012` (описать добавление ability/enemy/level), `ARC-013`
  (единый composition root/DI), `ARC-014` (runtime-валидация Zod), `ARC-015` (debug launcher) —
  **не были реализованы**, ниже — конкретные первые шаги по ним.

1. **`ARC-001` — lint boundaries + целевая структура каталогов.** `no-restricted-imports`/
   `no-restricted-globals`/`no-restricted-properties` в `eslint.config.js`: `src/core/**` не
   импортирует `phaser`, `react`, `@adapters/**`, `@ui/**`, `@content/**`, `@application/**`;
   аналогичные правила для `application`/`content`/`adapters`. Плюс перенос `core/gameplay/*` и
   `core/state/*` в подпапки целевого дерева (`core/{combat,abilities,entities,events,phase,save,
state-machine}`, плюс обоснованная `core/puzzle/`) и `application/{app-controller,gameplay-
controller,progress-service}.ts` → `application/services/*`. Фиксация уже существующей чистоты
   и структуры, не создание с нуля. **Статус: реализовано этой сессией, см.
   `docs/HANDOFFS/ARC-001.md`.**
2. **`ARC-009`/`ARC-014` — content и save-game validation.** Внедрить Zod, схемы для
   `AbilityConfig`, `EnemyConfig`, `CampaignLevelDefinition`, `SaveGame` — переиспользовать
   текущие TS-интерфейсы как основу. `parseSaveGame` переводится на `z.safeParse` с сохранением
   логики `migrateSave`; content-схемы дополнительно проверяют ссылочную целостность (enemy
   `configId` → `enemyTypes`). **Статус: реализовано этой сессией, см.
   `docs/HANDOFFS/ARC-014.md`.**
3. **`ARC-011` (кандидат) — декомпозиция `platformer-enemy-system.ts`/`prototype-scene.ts`.**
   Вынести чистые правила боя в `core/combat`/`core/entities`, оставить в adapter только
   Phaser-рендер/физику — это естественный кандидат на роль «перенести одну малую механику
   end-to-end как архитектурный пример» из `ARC-011`. Требует предварительного расширения
   `game-session.test.ts`/`boot-menu.spec.ts` как safety net перед изменением — наибольший риск
   среди всех первых шагов, так как игровой баланс сейчас перемешан с Phaser API.
4. **`ARC-010` — scene lifecycle contract и leak test. Статус: ЗАКРЫТО, см.
   `docs/HANDOFFS/ARC-010.md`.** Единый интерфейс `Destroyable` для всех 6 Phaser-систем,
   централизованный вызов в `PrototypeScene#shutdown()`. Расследование перед реализацией показало,
   что Phaser 3.90 сам подписывается на `SHUTDOWN` сцены и уничтожает все твины/`delayedCall`/
   game-объекты — заявленная здесь «средняя-высокая» утечка не подтвердилась; контракт добавлен
   как архитектурная защита на будущее, а не исправление подтверждённого бага.
5. **Без номера (relates to Фаза 14, `MOB-001`) — решение по Capacitor.** Удалить неиспользуемые
   `@capacitor/*` зависимости либо довести до реального использования
   (`capacitor.config.ts`, native projects, недостающие адаптеры) — решение пользователя, влияет
   на Фазу 14, но не входит в чек-лист Фазы 1.
6. **Без номера (Фазы 5+, LV1-NNN/ART-NNN) — замена контента.** `src/assets/*` и `content/*` под
   новый сценарий; сохранить только конвейер загрузки как паттерн. Не относится к архитектурным
   `ARC-NNN` задачам Фазы 1.
7. **Без номера (упомянуто в §4 плана как архитектурное требование, не входит в явный чек-лист
   Фазы 1) — seeded RNG.** Порт `RandomPort` в `core`, внедрение через конструктор `GameSession`.
   Новая возможность, не рефакторинг — решить, где случайность нужна по новому сценарию, прежде
   чем проектировать интерфейс.

**Риск:** наибольший — шаг 3 (`platformer-enemy-system.ts`/`prototype-scene.ts`), там реальный
игровой баланс вперемешку с Phaser API. Рекомендуется не трогать без расширенного test safety
net.

## Gate 0 — чек-лист (см. план §9, Фаза 0)

- [x] `AUD-001` Git status проверен, пользовательские изменения (декорации art-агента)
      идентифицированы и не тронуты.
- [x] `AUD-006` Инвентаризация scenes/components/systems/assets выполнена (см. §1-2 выше).
- [x] `AUD-007` Импорты проверены на архитектурные нарушения (см. §3) — циклических зависимостей
      между core/application/adapters не обнаружено.
- [x] `AUD-008` Gameplay rules внутри React/Phaser scenes найдены и зафиксированы (см. §5,
      `platformer-enemy-system.ts`, `prototype-scene.ts`).
- [x] `AUD-009` localStorage/save schema инвентаризированы (см. §3-4).
- [x] `AUD-011` Таблица `KEEP/REFACTOR/REPLACE/REMOVE` составлена (см. §7).
- [x] `AUD-012` Существующий контент сопоставлен с новым сценарием (см. §5 REPLACE).
- [ ] `AUD-002` Baseline tag/commit — не создавался в рамках этого аудита (нужно решение
      пользователя, помечать ли текущий `e8e1dab` тегом).
- [ ] `AUD-003/004/005/010/013/014/015` — не выполнялись в рамках этой сессии (видео
      прохождения, скриншоты экранов, замер производительности, regression checklist, known bugs
      list, feature flags) — вне scope технического аудита, требуют отдельных задач.

Gate 0 не закрыт полностью: техническая часть аудита готова, но часть Фазы 0 (видео/скриншоты
baseline, performance-профиль, feature flags) требует отдельного решения — не входит в
"техническую часть", о которой просил пользователь.
