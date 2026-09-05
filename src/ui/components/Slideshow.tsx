import { useCallback, useEffect, useRef, useState } from 'react';
import type { SlidePanel } from '@content/index';

// COM-010A: single data-driven slideshow engine shared by the prologue and the epilogue
// (ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md Фаза 6/11) — takes a plain list of panels and knows
// nothing about which story it is telling. Supports manual advance, skip and always-on captions
// (plan §14 "Доступность": субтитры включены по умолчанию).

interface SlideshowProps {
  onComplete: () => void;
  panels: readonly SlidePanel[];
  title: string;
}

export function Slideshow({ onComplete, panels, title }: SlideshowProps) {
  const [index, setIndex] = useState(0);
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
        <div className="slideshow__meta">
          <span
            className="slideshow__progress"
            aria-label={`Слайд ${index + 1} из ${panels.length}`}
          >
            {index + 1} / {panels.length}
          </span>
        </div>
        <div className="slideshow__actions">
          <button className="slideshow__primary" onClick={advance} type="button">
            {isLast ? 'Продолжить' : 'Далее'}
          </button>
          <button className="result-card__secondary" onClick={onComplete} type="button">
            Пропустить
          </button>
        </div>
      </div>
    </main>
  );
}
