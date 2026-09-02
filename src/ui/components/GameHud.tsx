import type { GameplayController } from '@application/index';
import { dominantCatForPhase } from '@core/index';
import { useGameplaySnapshot } from '@ui/hooks/use-gameplay-snapshot';
import { AbilityCooldowns } from './AbilityCooldowns';

interface GameHudProps {
  gameplay: GameplayController;
}

export function GameHud({ gameplay }: GameHudProps) {
  const snapshot = useGameplaySnapshot(gameplay);
  const seconds = Math.max(0, Math.ceil(snapshot.phaseRemainingMs / 1000));
  const enemiesRemaining = snapshot.enemies.filter((enemy) => enemy.health > 0).length;
  const dominantCat = dominantCatForPhase(snapshot.phase);

  return (
    <header className="game-hud" aria-label="Игровой интерфейс">
      <div className="hud-portraits" aria-label="Хранители">
        <div
          aria-label={`Люма: ${dominantCat === 'luma' ? 'усилена' : 'ослаблена'}`}
          aria-current={snapshot.activeCat === 'luma' ? 'true' : undefined}
          className={`hud-cat hud-cat--luma ${snapshot.activeCat === 'luma' ? 'is-active' : ''} ${dominantCat === 'luma' ? 'is-empowered' : 'is-weakened'}`}
        >
          <span className="hud-cat__face" aria-hidden="true">
            ☀
          </span>
          <span className="hud-cat__copy">
            <strong>Люма</strong>
            <small>{dominantCat === 'luma' ? 'СИЛА ×1.5' : 'СЛАБО ×0.25'}</small>
          </span>
        </div>
        <div
          aria-label={`Нокс: ${dominantCat === 'nox' ? 'усилен' : 'ослаблен'}`}
          aria-current={snapshot.activeCat === 'nox' ? 'true' : undefined}
          className={`hud-cat hud-cat--nox ${snapshot.activeCat === 'nox' ? 'is-active' : ''} ${dominantCat === 'nox' ? 'is-empowered' : 'is-weakened'}`}
        >
          <span className="hud-cat__face" aria-hidden="true">
            ☾
          </span>
          <span className="hud-cat__copy">
            <strong>Нокс</strong>
            <small>{dominantCat === 'nox' ? 'СИЛА ×1.5' : 'СЛАБО ×0.25'}</small>
          </span>
        </div>
      </div>

      <div className="phase-clock" role="status" aria-live="polite">
        <span className="phase-clock__icon" aria-hidden="true">
          {snapshot.phase === 'day' ? '☀' : '☾'}
        </span>
        <span>Фаза: {snapshot.phase === 'day' ? 'День' : 'Ночь'}</span>
        <strong>{seconds}</strong>
      </div>

      <div className="eclipse-meter" aria-label={`Затмение: ${Math.round(snapshot.eclipseMeter)}%`}>
        <span style={{ width: `${snapshot.eclipseMeter}%` }} />
        <strong>
          {snapshot.eclipseMeter >= snapshot.maxEclipseMeter ? 'X · ОБЪЯТИЕ' : 'R · 50%'}
        </strong>
      </div>

      <div className="hud-status">
        <div
          className="bond-health"
          aria-label={`Связь: ${snapshot.bondHealth} из ${snapshot.maxBondHealth}`}
        >
          {Array.from({ length: snapshot.maxBondHealth }, (_, index) => (
            <span
              className={index < snapshot.bondHealth ? 'is-full' : ''}
              key={index}
              aria-hidden="true"
            >
              ♥
            </span>
          ))}
        </div>
        <span className="enemy-counter">Монстры: {enemiesRemaining}</span>
        <span className="spark-counter">Искры: {snapshot.sparksCollected}/3</span>
      </div>

      {snapshot.checkpointRestartCount > 0 ? (
        <p className="restart-notice" role="status">
          Связь восстановлена у контрольной точки
        </p>
      ) : null}
      <AbilityCooldowns activeCat={snapshot.activeCat} cooldowns={snapshot.cooldowns} />
    </header>
  );
}
