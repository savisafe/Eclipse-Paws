interface PauseOverlayProps {
  onResume: () => void;
  onReturnToMenu: () => void;
  onStartTutorial?: () => void;
  tutorialCompleted?: boolean;
}

export function PauseOverlay({
  onResume,
  onReturnToMenu,
  onStartTutorial,
  tutorialCompleted,
}: PauseOverlayProps) {
  return (
    <section
      className="pause-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="pause-card">
        <p>Сон затаил дыхание</p>
        <h2 id="pause-title">Пауза</h2>
        <button autoFocus className="pause-card__primary" onClick={onResume} type="button">
          Продолжить
        </button>
        {onStartTutorial ? (
          <button className="pause-card__tutorial" onClick={onStartTutorial} type="button">
            <span aria-hidden="true">!</span>
            {tutorialCompleted ? 'Пройти обучение заново' : 'Начать обучение'}
          </button>
        ) : null}
        <button className="pause-card__secondary" onClick={onReturnToMenu} type="button">
          В главное меню
        </button>
      </div>
    </section>
  );
}
