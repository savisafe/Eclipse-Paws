# Как добавить новую способность / врага / уровень

> `ARC-012` из `ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md` (Фаза 1). Описывает **текущий** production-
> процесс добавления контента, основанный на реально работающем коде на момент написания
> (проверено чтением исходников, не предположениями). Если код изменится, этот файл нужно
> обновить в той же задаче — иначе он быстро станет ложью.
>
> Контент, о котором говорит этот документ (`src/content/*`, `campaign-levels.ts` и т.д.),
> относится к старому канону (Кокс/Боня/Эйлара, «осколки», Сумеречник) и будет заменён по новому
> сценарию `ECLIPSE_PAWS_SCENARIO.md`. Сам **процесс** и файлы, которые нужно трогать, при этом не
> меняются — этот документ описывает механику добавления контента, а не то, что содержательно
> должно быть добавлено.

## Общая картина

```
content (декларативные данные, TS-объекты)
   → GameSession / core (правила: урон, кулдауны, health)
   → adapters/phaser (рендер, спрайты, VFX, коллизии)
   → ui (HUD/меню читают content только для отображения — id, cooldownMs, title и т.п.)
```

Все конфиги проходят через `validateCampaignContent()` (`src/content/schema.ts`), вызываемую при
импорте `src/content/levels/campaign-levels.ts`. Если конфиг сломан (например враг ссылается на
несуществующий `configId`), приложение и тесты упадут сразу с читаемым сообщением, а не тихо
подставят неправильные данные (`ARC-014`).

## Добавить нового врага

1. **Конфиг.** Добавить `EnemyConfig` в подходящий файл: `src/content/enemies/prototype-monsters.ts`
   (уровень 1) или `stage4-enemies.ts`/`stage5-enemies.ts` (остальные), либо создать новый файл
   уровня по аналогии — обязательные поля: `id`, `health`, `contactDamage`, `movement`
   (`'ground' | 'flying'`), `speed`, `telegraphMs`. Пример (`stage4-enemies.ts:14`):
   ```ts
   'thorn-stalker': enemy('thorn-stalker', 38, 105, 'ground', 360),
   ```
2. **Экспорт.** Добавить новый объект enemy-типов в `createLevelContent()`
   (`src/content/levels/campaign-levels.ts:382`), если это новый файл-реестр, либо просто
   добавить запись в уже импортируемый `*_ENEMIES` — ничего дополнительно менять не нужно.
3. **Расстановка в уровне.** Добавить спавн в массив `enemies` нужного
   `CampaignLevelDefinition` (`campaign-levels.ts`): `{ id: 'unique-spawn-id', configId:
'<id из шага 1>', x, y }`. `id` спавна — уникален в рамках уровня, `configId` — ссылается на
   `EnemyConfig.id`.
   - Если враг является боссом уровня, `bossId` уровня должен совпадать с `id` этого спавна
     (не с `configId`) — так проверяет `validateCampaignContent`.
4. **Валидация — бесплатно.** Просто запустить `npm run test` или `npm run build`: если
   `configId` не существует в объединённом реестре `enemyTypes`, `validateCampaignContent`
   выбросит понятную ошибку вида `level "...": enemy spawn "..." references unknown configId
"..."` при импорте модуля контента — раньше (до `ARC-014`) это тихо подставляло `health: 1`.
5. **Визуал (опционально, но обычно нужен).** Спрайт/анимация врага задаются отдельно от
   `EnemyConfig` — в `src/adapters/phaser/{garden,stage4,stage5}-enemy-atlas.ts`, в объекте
   `*_ENEMY_FRAMES: Record<string, AnimatedEnemyFrames>`, ключ — тот же `configId`. Без записи в
   этом объекте `PlatformerEnemySystem` (`platformer-enemy-system.ts:127`) не найдёт кадры анимации
   для нового врага (в проде это будет видно как отсутствие/поломка спрайта, тест на это не
   падает — атлас и content-схема сейчас не связаны валидацией, это известный пробел, см. раздел
   «Известные ограничения» ниже).
6. **Тесты.** `tests/unit/campaign-levels.test.ts` уже проверяет уникальность ростеров врагов между
   уровнями и наличие `bossId` среди спавнов — если новый враг ломает эти инварианты, тест упадёт
   с понятной причиной. Отдельный юнит-тест для самого врага не обязателен, если он не вносит
   новую механику (только конфиг).

## Добавить новую способность

Способности организованы в три фиксированных слота на кота: `primary` (крик/наскок),
`special` (луч/иглы), `support` (щит/декой) — плюс отдельная совместная `ultimate`
(Затмение). План (`ECLIPSE_PAWS_SCENARIO.md`) жёстко ограничивает **максимум три основных
действия на кота** — новая способность почти всегда означает замену существующей способности в
слоте одного кота или её улучшение, а не добавление четвёртого слота.

1. **Конфиг.** `AbilityConfig` — `id`, `owner` (`CatId`), `baseDamage`, `cooldownMs`, `effect`,
   `range`. Добавляется в `src/content/abilities/prototype-abilities.ts`, в один из трёх словарей
   `PROTOTYPE_ABILITIES` / `PROTOTYPE_SPECIAL_ABILITIES` / `PROTOTYPE_SUPPORT_ABILITIES` (ключ —
   `CatId`, то есть на слот-кота ровно одна способность; замена — это правка существующей записи).
2. **HUD получает её бесплатно.** `AbilityCooldowns.tsx` (`src/ui/components/AbilityCooldowns.tsx`)
   рендерит кулдауны по `ability.id`/`ability.cooldownMs` из тех же трёх словарей — никакого
   дополнительного UI-кода не нужно.
3. **⚠ `effect` — декоративное поле, не рычаг.** Важно понимать: строка `effect` (например
   `'light-paw'`, `'lightning'`, `'shadow-spikes'`) **не читается** нигде в
   `src/adapters/phaser/*` для выбора визуала — рендер способности жёстко захардкожен по `catId`
   (`luma` / `nox`) в `combat-ability-system.ts` и `platformer-effects.ts`
   (`playPrimaryAttack`/`playSpecialAbility`), не по `ability.effect`. Значит: если вы просто
   меняете числа (`baseDamage`, `cooldownMs`, `range`) в существующей записи — это работает сразу.
   Если вы хотите **новый визуал/поведение** способности — нужно redактировать код в
   `platformer-effects.ts`/`combat-ability-system.ts` (ветки по `catId`), а не только content.
   `useSupport()`/`useUltimate()` в `core/game-session.ts` — тоже фиксированная логика (лечение
   или щит, разброс урона по площади), не параметризуется через content.
4. **Правила урона/кулдаунов — в core, не в content.** Расчёт урона (`powerModifierFor`,
   уровневый модификатор) находится в `src/core/game-session.ts` и `src/core/combat/combat-rules.ts`
   — content только поставляет числа (`baseDamage`, `cooldownMs`), а не формулы.
5. **Тесты.** `tests/unit/combat-rules.test.ts`/`tests/unit/game-session.test.ts` покрывают
   расчёт урона и кулдаунов — при изменении чисел способности стоит проверить, не сломался ли
   баланс, зафиксированный в существующих ожиданиях этих тестов.

## Добавить новый уровень

1. **`CampaignLevelDefinition`.** Добавить запись в `CAMPAIGN_LEVELS`
   (`src/content/levels/campaign-levels.ts`) — все обязательные поля (см. интерфейс в том же
   файле): `id` (уникальный kebab-case), `index`, `difficulty` (1-5), `title`/`subtitle`/`story`/
   `objective`, `background`, `mechanic`, `phaseDurationMs`, `worldWidth`, `bossId`, `platforms`,
   `phasePlatforms`, `coverZones`, `checkpoints` (ровно 3 — тип `[LevelPoint, LevelPoint,
LevelPoint]`), `sparks`, `hazards`, `enemies`.
2. **Порядок уровней.** Добавить `id` в `CAMPAIGN_LEVEL_ORDER` (тот же файл) — от этого зависит:
   разблокировка следующего уровня в `ProgressService#nextLevel()`
   (`src/application/services/progress-service.ts:56`, порядок **захардкожен отдельным массивом
   там же** — да, это дублирование источника истины, см. «Известные ограничения»), и переход
   «следующий уровень» в `App.tsx` (`CAMPAIGN_LEVEL_ORDER.indexOf(...)`).
3. **Диалоги (опционально).** Добавить запись в `CAMPAIGN_DIALOGUES`
   (`src/content/dialogues/campaign-dialogues.ts`) с тем же `id` уровня — иначе для уровня просто
   не будет диалоговых реплик (не ошибка, ключ опционален по типу `Record<CampaignLevelId, ...>`
   технически обязателен — все существующие уровни его имеют).
4. **Враги.** См. раздел «Добавить нового врага» — добавить спавны в `enemies` уровня и (если
   нужны новые типы врагов) конфиги в `content/enemies/*`.
5. **Фон/декорации.** Уровень получает фон через `dream-environment-manifest.ts`
   (`src/adapters/phaser/dream-environment-manifest.ts`) — это сейчас в активной работе
   art-агента, не редактировать параллельно без синхронизации.
6. **Атлас врагов для уровня — ручное условие по индексу.** `PrototypeScene`
   (`src/adapters/phaser/prototype-scene.ts:94,102`) выбирает, какой enemy-атлас
   preload/prepare-ить, по жёсткому условию `if (this.#level.index === 1) ...` (аналогично для
   индексов других уровней в других местах того же файла) — **не** по названию/полю уровня.
   Добавление нового уровня с новыми врагами почти всегда требует правки этого файла — а он сейчас
   активно редактируется art-агентом, поэтому это связывающая точка, требующая координации.
7. **Валидация.** Как и с врагами — `validateCampaignContent()` проверит структуру нового уровня
   при следующем запуске `npm run test`/`npm run build` и укажет конкретную причину, если что-то
   не так (отсутствующий `configId`, `bossId` без совпадения, неверная форма чекпоинтов и т.д.).
8. **Тесты.** `tests/unit/campaign-levels.test.ts` проверяет уникальность layout-сигнатур
   платформ, монотонность `difficulty`, уникальность ростеров врагов между соседними уровнями —
   новый уровень должен проходить эти инварианты или тест нужно осознанно обновить (не просто
   ослабить, если инвариант всё ещё имеет смысл).

## Definition of Ready / Done (см. план §5-6)

Перед тем как передавать `TASK_ID` в `REVIEW`, для любого из трёх сценариев выше:

- [ ] `npm run lint` — 0 нарушений (границы core/application/content/adapters, см. `ARC-001`).
- [ ] `npm run typecheck` — 0 ошибок.
- [ ] `npm run test` — новый/задетый контент проходит `validateCampaignContent` неявно (через
      импорт `campaign-levels.ts` в тестах) и явные unit-тесты не сломаны.
- [ ] `npm run build` — production build проходит (тот же неявный прогон валидации content).
- [ ] Если добавлен новый враг/уровень с визуалом — проверено визуально в браузере (dev-сервер),
      а не только по прохождению тестов.
- [ ] Обновлён этот файл, если изменился сам **процесс** добавления контента (не разово контент).

## Известные ограничения (актуально на момент написания)

- `AbilityConfig.effect` не используется ни в одном месте `src/adapters/phaser/*` для выбора
  визуала — рендер способности жёстко связан с `catId`, а не с содержимым `effect`. Смена
  визуала способности требует правки кода, а не только content.
- `LEVEL_MONSTER_ROSTERS` (`src/content/levels/monster-rosters.ts`) экспортируется из
  `content/index.ts`, но **нигде не потребляется** в текущем коде (проверено grep — только
  ре-экспорт) — это, вероятно, задел под будущий bestiary-экран. Не полагаться на него как на
  источник истины по ростеру уровня; источник истины — массив `enemies` в
  `CampaignLevelDefinition`.
- Порядок уровней продублирован в двух местах: `CAMPAIGN_LEVEL_ORDER`
  (`src/content/levels/campaign-levels.ts`) и локальный массив внутри
  `ProgressService#nextLevel()` (`src/application/services/progress-service.ts:57-63`). Новый
  уровень нужно добавить в оба места — рассинхронизация не поймается ни линтом, ни
  `validateCampaignContent` (это разные слои: content vs application).
- Атлас врагов выбирается в `prototype-scene.ts` по `level.index` через ручные условные ветки, а
  не по декларативной привязке в content — при росте числа уровней это стоит вынести в
  декларативную таблицу `index → atlas loader`, но это отдельная задача, не входящая в scope
  `ARC-012` (сам процесс добавления контента на сегодняшний день таков, каким описан выше).
