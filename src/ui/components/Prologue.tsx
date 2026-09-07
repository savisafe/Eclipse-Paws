import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import type { SlidePanel } from '@content/index';
import { useSettingsStore } from '@ui/store/settings-store';

interface PrologueProps {
  onComplete: () => void;
  panels: readonly SlidePanel[];
}

const SCENE_NAMES = [
  'Башня Элиаса',
  'Кабинет целителя',
  'Невозможный вопрос',
  'Круг Сомниума',
  'Коллапс',
  'Между двумя ударами',
  'Дверь в сон',
  'Первый шаг',
] as const;

const AUTO_ADVANCE_MS = 10_500;

export function Prologue({ onComplete, panels }: PrologueProps) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const panel = panels[index];
  const isLast = index === panels.length - 1;

  const advance = useCallback(() => {
    if (isLast) onComplete();
    else setIndex((current) => Math.min(current + 1, panels.length - 1));
  }, [isLast, onComplete, panels.length]);

  useEffect(() => {
    if (!autoplay) return;
    const timeout = window.setTimeout(advance, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timeout);
  }, [advance, autoplay, index]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        onComplete();
        return;
      }
      if (event.code === 'Space' || event.code === 'ArrowRight' || event.code === 'Enter') {
        if (event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advance, onComplete]);

  const moveCamera = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    stageRef.current?.style.setProperty('--look-x', x.toFixed(3));
    stageRef.current?.style.setProperty('--look-y', y.toFixed(3));
  };

  if (!panel) return null;

  return (
    <main aria-label="Пролог: Между двумя ударами" className="prologue" data-panel={index + 1}>
      <div
        aria-hidden="true"
        className="prologue__stage"
        onClick={advance}
        onPointerMove={moveCamera}
        onPointerLeave={() => {
          stageRef.current?.style.setProperty('--look-x', '0');
          stageRef.current?.style.setProperty('--look-y', '0');
        }}
        ref={stageRef}
      >
        <div className="prologue__panel" key={panel.id}>
          <img className="prologue__layer prologue__layer--back" src={panel.imageUrl} alt="" />
          <img className="prologue__layer prologue__layer--middle" src={panel.imageUrl} alt="" />
          <img className="prologue__layer prologue__layer--front" src={panel.imageUrl} alt="" />
          <span className="prologue__light" />
          <span className="prologue__particles" />
        </div>
        {index === 7 ? <span className="prologue__logo">ECLIPSE PAWS</span> : null}
      </div>

      <section className="prologue__story" aria-live="polite" aria-atomic="true">
        <p className="prologue__eyebrow">Пролог · {SCENE_NAMES[index]}</p>
        {panel.caption ? (
          <p className="prologue__caption">{panel.caption}</p>
        ) : (
          <p className="prologue__caption prologue__caption--silent">Тишина.</p>
        )}
      </section>

      <nav className="prologue__controls" aria-label="Управление прологом">
        <span aria-label={`Сцена ${index + 1} из ${panels.length}`} className="prologue__progress">
          {index + 1} / {panels.length}
        </span>
        <button
          aria-pressed={autoplay}
          className="prologue__auto"
          onClick={() => setAutoplay((value) => !value)}
          type="button"
        >
          {autoplay ? 'Авто: вкл.' : 'Авто'}
        </button>
        <button className="prologue__next" onClick={advance} type="button">
          {isLast ? 'Начать уровень' : 'Далее'}
        </button>
        <button className="prologue__skip" onClick={onComplete} type="button">
          Пропустить
        </button>
      </nav>
    </main>
  );
}
