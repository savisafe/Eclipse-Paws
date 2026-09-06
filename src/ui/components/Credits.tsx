interface CreditsProps {
  onMenu: () => void;
}

export function Credits({ onMenu }: CreditsProps) {
  return (
    <main className="credits-screen">
      <section className="credits-card" aria-labelledby="credits-title">
        <div className="credits-eclipse" aria-hidden="true">
          ☀ ☾
        </div>
        <p>Свет и тьма снова в равновесии</p>
        <h1 id="credits-title">Eclipse Paws</h1>
        <blockquote>
          Рассвет пришёл не вместо ночи, а вслед за ней. Люмус и Нокс свернулись рядом и впервые
          услышали, как ровно бьётся сердце их хозяина.
        </blockquote>
        <div className="credits-names">
          <span>Люмус · Хранитель света</span>
          <span>Нокс · Хранитель теней</span>
        </div>
        <button className="menu-button" onClick={onMenu} type="button">
          Вернуться в главное меню
        </button>
      </section>
    </main>
  );
}
