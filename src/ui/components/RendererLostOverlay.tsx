interface RendererLostOverlayProps {
  onReload: () => void;
  stalled: boolean;
}

/**
 * Shown while the browser has taken the game's drawing surface away.
 *
 * Without it the player simply sees the picture stop: the scene is paused underneath, but nothing
 * on screen says so, and the freeze is indistinguishable from a crash. A phone takes the context
 * back when it needs the memory, usually hands it straight back, and the game carries on — so the
 * ordinary case is a card that explains itself and disappears. `stalled` marks the case where it
 * has not come back, which only a reload can fix.
 */
export function RendererLostOverlay({ onReload, stalled }: RendererLostOverlayProps) {
  return (
    <div className="renderer-lost" role="alertdialog" aria-label="Графика приостановлена">
      <div className="renderer-lost__card">
        <span className="renderer-lost__mark" aria-hidden="true" />
        <h2>Сон на мгновение потускнел</h2>
        {stalled ? (
          <p>
            Устройству не хватило памяти на картинку, и она не вернулась сама. Обновите страницу —
            прогресс сохранён у последней контрольной точки.
          </p>
        ) : (
          <p>Устройство освобождает память. Игра на паузе и продолжится сама через миг.</p>
        )}
        {stalled ? (
          <button autoFocus onClick={onReload} type="button">
            Обновить страницу
          </button>
        ) : null}
      </div>
    </div>
  );
}
