interface StoryIntroProps {
  onBack: () => void;
  onStart: () => void;
  story: string;
  subtitle: string;
  title: string;
}

export function StoryIntro({ onBack, onStart, story, subtitle, title }: StoryIntroProps) {
  return (
    <main className="story-screen">
      <section className="story-card" aria-labelledby="story-title">
        <p>{subtitle}</p>
        <h1 id="story-title">{title}</h1>
        <blockquote>{story}</blockquote>
        <div className="story-meow" aria-label="Коты готовы к путешествию">
          Люмус: «Мяу!» · Нокс: «Мр-р.»
        </div>
        <button className="menu-button" onClick={onStart} type="button">
          Начать уровень
        </button>
        <button className="result-card__secondary" onClick={onBack} type="button">
          Назад
        </button>
      </section>
    </main>
  );
}
