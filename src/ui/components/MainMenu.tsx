import { CatSigil } from './CatSigil';
import { SettingsDialog } from './SettingsDialog';
import { LevelSelectDialog } from './LevelSelectDialog';
import type { CampaignLevelId } from '@content/index';

const menuItems = [{ label: 'Новая игра', disabled: false }] as const;

interface MainMenuProps {
  onContinue: () => void;
  onNewGame: () => void;
  onSelectLevel: (levelId: CampaignLevelId) => void;
  unlockedLevels: readonly CampaignLevelId[];
}

export function MainMenu({ onContinue, onNewGame, onSelectLevel, unlockedLevels }: MainMenuProps) {
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
          <button className="menu-button" disabled onClick={onContinue} type="button">
            <span>Продолжить</span>
            <small>В разработке</small>
          </button>
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
          <LevelSelectDialog onSelect={onSelectLevel} unlockedLevels={unlockedLevels} />
          <SettingsDialog />
        </nav>

        <p className="hero-panel__hint">Сильный защищает слабого. Вместе они вернут рассвет.</p>
      </section>
    </main>
  );
}
