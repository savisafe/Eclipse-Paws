interface PauseOverlayProps {
  onResume: () => void;
  onReturnToMenu: () => void;
}

export function PauseOverlay({ onResume, onReturnToMenu }: PauseOverlayProps) {
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
        <button autoFocus className="menu-button" onClick={onResume} type="button">
          Продолжить
        </button>
        <button className="pause-card__secondary" onClick={onReturnToMenu} type="button">
          В главное меню
        </button>
      </div>
    </section>
  );
}
