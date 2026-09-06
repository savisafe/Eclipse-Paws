interface LevelResultProps {
  elapsedMs: number;
  levelTitle: string;
  nextLevelTitle?: string;
  onMenu: () => void;
  onNext?: () => void;
  onReplay: () => void;
  sparks: number;
  totalSparks: number;
}

export function LevelResult({
  elapsedMs,
  levelTitle,
  nextLevelTitle,
  onMenu,
  onNext,
  onReplay,
  sparks,
  totalSparks,
}: LevelResultProps) {
  const minutes = Math.floor(elapsedMs / 60_000);
  const seconds = Math.floor((elapsedMs % 60_000) / 1000)
    .toString()
    .padStart(2, '0');
  return (
    <main className="level-result">
      <section className="result-card" aria-labelledby="result-title">
        <p className="result-card__eyebrow">Ещё один след Элиаса найден</p>
        <h1 id="result-title">Уровень пройден!</h1>
        <div className="result-shard" aria-hidden="true" />
        <p>«{levelTitle}» завершён. Путь домой становится немного яснее.</p>
        <dl className="result-stats">
          <div>
            <dt>Время</dt>
            <dd>
              {minutes}:{seconds}
            </dd>
          </div>
          <div>
            <dt>Искры</dt>
            <dd>
              {sparks}/{totalSparks}
            </dd>
          </div>
        </dl>
        <button className="result-card__primary" onClick={onReplay} type="button">
          Пройти ещё раз
        </button>
        {onNext && nextLevelTitle ? (
          <button className="result-card__primary" onClick={onNext} type="button">
            Далее: {nextLevelTitle}
          </button>
        ) : null}
        <button className="result-card__secondary" onClick={onMenu} type="button">
          В главное меню
        </button>
      </section>
    </main>
  );
}
