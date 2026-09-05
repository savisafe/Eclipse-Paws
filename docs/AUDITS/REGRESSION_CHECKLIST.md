# AUD-013 — Regression checklist старой playable-версии (черновик)

> Статус: **черновик, требует прогона живым человеком**. `AUD-013` формально зависит от `AUD-004`
> (видео полного текущего прохождения), которое не выполнялось — этот документ составлен по
> факту чтения существующих e2e/unit тестов и UI-компонентов, а не по записанному видео. Каждый
> пункт помечен источником: `[АВТО]` — уже покрыт автоматическим тестом (пройти
> `npm run test`/`npm run test:e2e`, отдельно руками проверять не нужно, если тесты зелёные);
> `[РУЧНОЕ]` — нет автоматического покрытия, нужна ручная проверка человеком перед каждым
> milestone. Список описывает **текущую (старую) playable-версию** — 5 уровней, старый канон
> (Кокс/Боня/Эйлара) — как baseline для сравнения после реконструкции, а не финальный regression
> suite нового сценария (тот см. в `ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md` §13).

## Загрузка и меню

- [АВТО] Главное меню загружается без layout overflow и без console errors —
  `tests/e2e/boot-menu.spec.ts` → `'boots into a keyboard-accessible menu without layout overflow'`.
- [АВТО] Кнопка «Новая игра» доступна с клавиатуры (focus работает) — тот же тест.
- [АВТО] Boot-экран показывает статус и переходит в меню — `tests/unit/app.test.tsx` →
  `'shows boot then transitions to the accessible main menu'`.
- [АВТО] Кнопка «Продолжить» задизейблена при отсутствии сохранения — тот же unit-тест.
- [РУЧНОЕ] Выбор уровня (`LevelSelectDialog.tsx`) визуально показывает разблокированные/
  заблокированные уровни корректно — нет автотеста на этот диалог.
- [РУЧНОЕ] Диалог настроек (`SettingsDialog.tsx`): слайдеры громкости музыки/эффектов, тумблеры
  reduced motion/вибрация — визуально проверить, что значения применяются и не сбрасываются при
  переключении экранов (persistence через `ProgressService.saveSettings` покрыта только
  косвенно — см. «Сохранение» ниже).

## Сюжетное вступление и переход в уровень

- [АВТО] Карточка истории (`StoryIntro`) показывает нужный заголовок/сюжет уровня перед стартом —
  `tests/unit/app.test.tsx` → `'shows the story card before loading the prototype arena'`.
- [АВТО] Debug-launch (`?level=`) корректно пропускает меню и грузит запрошенный уровень —
  `tests/unit/app.test.tsx` → тест `ARC-015`.

## Прохождение уровня (платформинг, бой, фазы)

- [АВТО] Игрок пересекает первую платформу прыжком с buffer'ом (jump buffer работает) —
  `tests/e2e/boot-menu.spec.ts` → `'crosses the first platform with a forgiving buffered jump'`.
- [АВТО] Смена дневной/ночной фазы автоматически отражается в HUD (`.phase-clock`) —
  `tests/e2e/boot-menu.spec.ts` → `'reflects the automatic phase change in the HUD'`.
- [АВТО] Финиш уровня показывает экран результата («Уровень пройден!») —
  `tests/e2e/boot-menu.spec.ts` → `'reaches the finish and shows a level result'`.
- [АВТО] Полное прохождение всех пяти кампанейских уровней подряд, включая переходы между ними и
  выход в титры — `tests/e2e/boot-menu.spec.ts` → `'completes all five campaign levels and reaches
the credits'` (самый длинный и ценный e2e-тест в проекте, `test.setTimeout(90_000)`).
- [АВТО] Бой (primary/special ability, переключение активного кота `Tab`), пауза и рестарт с
  чекпоинта — `tests/e2e/boot-menu.spec.ts` → `'plays the platformer through combat, pause and
checkpoint restart'`.
- [АВТО] Расчёт урона, кулдаунов, XP/level-up, сбор spark/loot, shield charges, bond health,
  eclipse meter — `tests/unit/game-session.test.ts`, `tests/unit/combat-rules.test.ts`,
  `tests/unit/cooldown-tracker.test.ts`, `tests/unit/eclipse-meter.test.ts`.
- [АВТО] Обнаружение цели врагом через укрытие/тень (день/ночь стелс) —
  `tests/unit/enemy-perception.test.ts` (см. `ARC-011`).
- [АВТО] AI-профиль врага масштабируется по уровню (агрессия/прыжки/telegraph) —
  `tests/unit/enemy-ai-profile.test.ts`.
- [АВТО] Уникальность enemy-ростеров и layout между уровнями, монотонность сложности —
  `tests/unit/campaign-levels.test.ts`.
- [РУЧНОЕ] Реальная **читаемость** ночи (не только факт смены фазы, а действительно ли игрок
  видит, куда идти) — план §4/§8 явно требует "настоящую ночь", это ощущение не измеряется
  юнит/е2е-тестами.
- [РУЧНОЕ] Визуальная и звуковая обратная связь боя (hit feedback, screen shake, SFX) — есть код
  (`platformer-effects.ts`, `SfxSynth`), но "чувствуется ли бой правильным" — вопрос ручного
  плейтеста, не теста.
- [РУЧНОЕ] Головоломки (`SequencePuzzle` — руны сада) — юнит-покрыта логика
  (`tests/unit/sequence-puzzle.test.ts`), но интеграция с реальными объектами в сцене (садовые
  колокольчики и т.п.) не покрыта e2e.

## Сохранение и прогрессия

- [АВТО] Миграция сохранения со старых версий схемы (0/1 → 2) — `tests/unit/save-game.test.ts`.
- [АВТО] Повреждённый JSON в localStorage не роняет приложение, а тихо сбрасывается —
  `tests/unit/save-game.test.ts` → `'clears corrupted JSON instead of crashing'`.
- [АВТО] `SaveGame` с некорректными типами полей (текущая версия схемы) отклоняется, а не
  принимается молча — `tests/unit/save-game.test.ts` (добавлено в `ARC-014`).
- [АВТО] Завершение уровня сохраняет лучшее время/спарки и разблокирует следующий уровень —
  `tests/unit/save-game.test.ts` → `'saves best result and unlocks the next level'`.
- [РУЧНОЕ] Реальное сохранение переживает **закрытие вкладки/обновление страницы** — юнит-тесты
  работают с `LocalStorageSaveRepository` напрямую в jsdom, но полный browser-refresh цикл (план
  §13: «settings и save переживают reload») не проверяется e2e.
- [РУЧНОЕ] Известное ограничение (см. `docs/AUDITS/KNOWN_ISSUES.md` #3): порядок уровней
  продублирован в `CAMPAIGN_LEVEL_ORDER` и `ProgressService#nextLevel()` — специально проверить
  разблокировку **каждого** уровня по цепочке при регрессионном прогоне, не только первого.

## PWA / мобильность

- [АВТО] `manifest.webmanifest` и `sw.js` отдаются корректно (`display: standalone`, `orientation:
landscape`, иконки 192/512) — `tests/e2e/pwa.spec.ts`.
- [АВТО] На мобильном viewport все touch-controls ≥ 44×44px (accessibility/Fitts's law) —
  `tests/e2e/pwa.spec.ts` → `'keeps every visible touch control at least 44 pixels'`.
- [РУЧНОЕ] Реальное поведение offline (service worker кэш) при потере сети — тест только проверяет,
  что `sw.js` отдаётся, не что офлайн-режим реально работает.
- [РУЧНОЕ] Реальное устройство iOS/Android (эмуляция viewport в Playwright — не то же самое, что
  живой Safari/Chrome с реальными touch-событиями, safe area, haptics).

## Что не покрыто нигде (ни авто, ни явно ручным пунктом выше)

- Долгая сессия (10+ минут) на утечки памяти/растущее число listeners — план §8 явно требует
  такую проверку («десятиминутный loop не увеличивает listeners или память»), но ни один
  существующий тест этого не измеряет (соответствует известной проблеме #6 в
  `docs/AUDITS/KNOWN_ISSUES.md` — неполный cleanup сцены).
- Производительность (FPS, bundle size, loading time) — см. отдельно `AUD-010` (не выполнялась,
  требует профилирования в реальном браузере).
- Локализация/раскладка при другом языке интерфейса — в проекте только русский текст, пункт не
  применим на данный момент.

## Как использовать

Перед каждым milestone (`Gate N` в плане): прогнать `npm run test && npm run test:e2e` (покрывает
все пункты `[АВТО]`), затем пройти пункты `[РУЧНОЕ]` вручную одним игроком. Обновлять этот
документ при добавлении нового авто-теста, покрывающего ранее ручной пункт — переносить его из
`[РУЧНОЕ]` в `[АВТО]` со ссылкой на тест.
