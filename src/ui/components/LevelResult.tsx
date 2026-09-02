interface LevelResultProps {
  onMenu: () => void;
  onReplay: () => void;
}

export function LevelResult({ onMenu, onReplay }: LevelResultProps) {
  return (
    <main className="level-result">
      <section className="result-card" aria-labelledby="result-title">
        <p className="result-card__eyebrow">Осколок Маятника найден</p>
        <h1 id="result-title">Уровень пройден!</h1>
        <div className="result-shard" aria-hidden="true">
          ✦
        </div>
        <p>Люма и Нокс восстановили первую часть цикла.</p>
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
