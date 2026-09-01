# Архитектура Eclipse Paws

## Направление зависимостей

```text
UI (React/Zustand) ─┐
Phaser adapter ─────┼──> application ──> core
input/storage ──────┘
```

`core` — чистый TypeScript. Он не импортирует DOM, React, Phaser, Zustand, localStorage или
Capacitor. `application` координирует сценарии и принимает зависимости через конструкторы.
Адаптеры переводят платформенные события в типизированные команды. React подписывается на
состояние приложения и будущие события через мост, не получая прямых ссылок на сцены Phaser.

## Слои

- `src/core`: модели, правила, state machines, cooldown/damage/phase и доменные события.
- `src/application`: запуск уровня, смена фазы, сохранение прогресса и orchestration.
- `src/adapters/phaser`: side-scrolling сцены, платформы, камера, physics, rendering, particles и audio.
- `src/adapters/input`: keyboard/pointer/touch → `GameAction`.
- `src/adapters/storage`: `SaveRepository`; только реализации имеют доступ к localStorage.
- `src/adapters/haptics`: web no-op и будущий Capacitor adapter.
- `src/ui`: React menus/HUD/dialogs и Zustand только для UI/session state.
- `src/content`: типизированные декларативные конфигурации уровней, врагов и способностей.

## Состояние приложения

Текущий pure state machine поддерживает:

```text
boot → main-menu → loading-level → playing ↔ paused → level-result → credits
```

Каждый переход перечислен явно. Повторный или невозможный переход выбрасывает типизированную
ошибку и не меняет состояние. На этапе 1 рендеринг будет получать изменения через типизированный
event bridge.

## Simulation и ownership

- Gameplay использует fixed simulation step; частота рендера не меняет правила.
- Gameplay state принадлежит core/application, не Zustand.
- Сцена владеет своими listeners, timers, physics bodies и освобождает их при shutdown.
- RNG, влияющий на тесты, передаётся как seeded dependency.
- Публичные поверхности модулей малы; импорты направлены внутрь без циклов.

## Проверка границ

До появления нескольких реальных реализаций не добавляются лишние generic abstractions. Новая
механика сначала оформляется в core/config, затем адаптер визуализирует события, а UI получает
только подготовленный snapshot.
