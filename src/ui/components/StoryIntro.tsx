interface StoryIntroProps {
  onBack: () => void;
  onStart: () => void;
}

export function StoryIntro({ onBack, onStart }: StoryIntroProps) {
  return (
    <main className="story-screen">
      <section className="story-card" aria-labelledby="story-title">
        <p>Осколок I · Сад первой зари</p>
        <h1 id="story-title">Маятник замолчал</h1>
        <blockquote>
          День застыл над древним садом. Люма чувствует зов солнечных цветов, а Нокс слышит тень под
          корнями.
        </blockquote>
        <div className="story-meow" aria-label="Коты готовы к путешествию">
          Люма: «Мяу!» · Нокс: «Мр-р.»
        </div>
        <button className="menu-button" onClick={onStart} type="button">
          Войти в сад
        </button>
        <button className="result-card__secondary" onClick={onBack} type="button">
          Назад
        </button>
      </section>
    </main>
  );
}
