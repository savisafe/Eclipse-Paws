export function BootScreen() {
  return (
    <main className="boot-screen" aria-label="Загрузка Eclipse Paws">
      <div className="boot-mark" aria-hidden="true">
        <span className="boot-mark__sun" />
        <span className="boot-mark__moon" />
      </div>
      <p className="boot-screen__title">Eclipse Paws</p>
      <p className="boot-screen__status" role="status">
        Открываем врата сна…
      </p>
    </main>
  );
}
