import { useCallback, useEffect, useRef, useState } from 'react';
import type { SlidePanel } from '@content/index';

// COM-010A: single data-driven slideshow engine shared by the prologue and the epilogue
// (ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md Фаза 6/11) — takes a plain list of panels and knows
// nothing about which story it is telling. Supports manual advance, optional auto-advance,
// skip and always-on captions (plan §14 "Доступность": субтитры включены по умолчанию).

interface SlideshowProps {
  autoAdvanceMs?: number;
  onComplete: () => void;
  panels: readonly SlidePanel[];
  title: string;
}

export function Slideshow({ autoAdvanceMs, onComplete, panels, title }: SlideshowProps) {
  const [index, setIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const panel = panels[index];
  const isLast = index >= panels.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((current) => Math.min(current + 1, panels.length - 1));
  }, [isLast, onComplete, panels.length]);

  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  useEffect(() => {
    if (!autoAdvance || !autoAdvanceMs) return;
    const timeoutId = window.setTimeout(() => advanceRef.current(), autoAdvanceMs);
    return () => window.clearTimeout(timeoutId);
  }, [autoAdvance, autoAdvanceMs, index]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowRight' || event.code === 'Enter') {
        event.preventDefault();
        advanceRef.current();
      } else if (event.code === 'Escape') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  if (!panel) return null;

  return (
    <main className="slideshow" aria-label={title}>
      <div className="slideshow__frame" onClick={advance} role="presentation">
        <img alt="" className="slideshow__image" src={panel.imageUrl} />
        {panel.caption ? (
          <p className="slideshow__caption" role="status">
            {panel.caption}
          </p>
        ) : null}
      </div>
      <div className="slideshow__controls">
        <span className="slideshow__progress" aria-hidden="true">
          {index + 1} / {panels.length}
        </span>
        {autoAdvanceMs ? (
          <label className="slideshow__auto-toggle">
            <input
              checked={autoAdvance}
              onChange={(event) => setAutoAdvance(event.target.checked)}
              type="checkbox"
            />
            Автопрокрутка
          </label>
        ) : null}
        <button className="menu-button" onClick={advance} type="button">
          {isLast ? 'Продолжить' : 'Далее'}
        </button>
        <button className="result-card__secondary" onClick={onComplete} type="button">
          Пропустить
        </button>
      </div>
    </main>
  );
}
