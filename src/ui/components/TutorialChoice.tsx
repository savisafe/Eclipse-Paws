interface TutorialChoiceProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function TutorialChoice({ onAccept, onDecline }: TutorialChoiceProps) {
  return (
    <section
      className="tutorial-choice"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-choice-title"
    >
      <div className="tutorial-choice__card">
        <span className="tutorial-choice__mark" aria-hidden="true">
          !
        </span>
        <p>Сад первой зари</p>
        <h2 id="tutorial-choice-title">Хотите пройти обучение?</h2>
        <span className="tutorial-choice__description">
          Мы познакомим вас с героями, здоровьем, способностями и первыми объектами мира прямо во
          время игры.
        </span>
        <div className="tutorial-choice__actions">
          <button
            autoFocus
            className="tutorial-choice__button tutorial-choice__button--primary"
            onClick={onAccept}
            type="button"
          >
            Да, начать
          </button>
          <button
            className="tutorial-choice__button tutorial-choice__button--secondary"
            onClick={onDecline}
            type="button"
          >
            Нет, пропустить
          </button>
        </div>
        {/* No "по Escape": a touch player reaches the same menu through the HUD's pause button. */}
        <small>Обучение всегда можно запустить из меню паузы.</small>
      </div>
    </section>
  );
}
