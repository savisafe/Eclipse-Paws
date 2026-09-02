interface LevelResultProps {
  elapsedMs: number;
  onMenu: () => void;
  onReplay: () => void;
  sparks: number;
  totalSparks: number;
}

export function LevelResult({
  elapsedMs,
  onMenu,
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
        <p className="result-card__eyebrow">Осколок Маятника найден</p>
        <h1 id="result-title">Уровень пройден!</h1>
        <div className="result-shard" aria-hidden="true">
          ✦
        </div>
        <p>Люма и Нокс восстановили первую часть цикла.</p>
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
        <button className="menu-button" onClick={onReplay} type="button">
          Пройти ещё раз
        </button>
        <button className="result-card__secondary" onClick={onMenu} type="button">
          В главное меню
        </button>
      </section>
    </main>
  );
}
