import { CatSigil } from './CatSigil';
import { SettingsDialog } from './SettingsDialog';

const menuItems = [
  { label: 'Продолжить', disabled: true },
  { label: 'Новая игра', disabled: false },
  { label: 'Выбор уровня', disabled: true },
] as const;

interface MainMenuProps {
  onNewGame: () => void;
}

export function MainMenu({ onNewGame }: MainMenuProps) {
  return (
    <main className="main-menu">
      <div className="sky-orb sky-orb--sun" aria-hidden="true" />
      <div className="sky-orb sky-orb--moon" aria-hidden="true" />

      <section className="hero-panel" aria-labelledby="game-title">
        <p className="hero-panel__eyebrow">Сказочное приключение</p>
        <h1 id="game-title">Eclipse Paws</h1>
        <p className="hero-panel__subtitle">Лапы затмения</p>

        <div className="guardians" aria-label="Хранители дня и ночи">
          <CatSigil kind="luma" />
          <div className="guardians__eclipse" aria-hidden="true">
            <span>✦</span>
          </div>
          <CatSigil kind="nox" />
        </div>

        <nav className="menu-actions" aria-label="Главное меню">
          {menuItems.map((item) => (
            <button
              className="menu-button"
              disabled={item.disabled}
              key={item.label}
              onClick={item.label === 'Новая игра' ? onNewGame : undefined}
              type="button"
            >
              <span>{item.label}</span>
              {item.disabled ? <small>Скоро</small> : null}
            </button>
          ))}
          <SettingsDialog />
        </nav>

        <p className="hero-panel__hint">Сильный защищает слабого. Вместе они вернут рассвет.</p>
      </section>
    </main>
  );
}
