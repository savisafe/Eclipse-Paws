import { useEffect, useState } from 'react';
import { CAMPAIGN_DIALOGUES, type CampaignLevelId } from '@content/index';

interface DialogueOverlayProps {
  levelId: CampaignLevelId;
  reducedMotion: boolean;
}

function DialogueText({ reducedMotion, text }: { reducedMotion: boolean; text: string }) {
  const [visibleCharacters, setVisibleCharacters] = useState(reducedMotion ? text.length : 0);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setVisibleCharacters((current) => {
        if (current >= text.length) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 24);
    return () => window.clearInterval(interval);
  }, [reducedMotion, text]);

  return (
    <p>
      {text.slice(0, visibleCharacters)}
      <span aria-hidden="true">▍</span>
    </p>
  );
}

export function DialogueOverlay({ levelId, reducedMotion }: DialogueOverlayProps) {
  const beats = CAMPAIGN_DIALOGUES[levelId];
  const [beatIndex, setBeatIndex] = useState(0);
  const [open, setOpen] = useState(true);
  const beat = beats[beatIndex]!;

  if (!open) return null;
  const advance = () => {
    if (beatIndex < beats.length - 1) setBeatIndex((index) => index + 1);
    else setOpen(false);
  };

  return (
    <aside className={`dialogue-overlay dialogue-overlay--${beat.tone}`} aria-live="polite">
      <div className="dialogue-portrait" aria-hidden="true">
        {beat.tone === 'light' ? '☀' : beat.tone === 'shadow' ? '☾' : '✦'}
      </div>
      <div className="dialogue-copy">
        <strong>{beat.speaker}</strong>
        <DialogueText key={beatIndex} reducedMotion={reducedMotion} text={beat.text} />
      </div>
      <button onClick={advance} type="button">
        {beatIndex < beats.length - 1 ? 'Далее' : 'Закрыть'}
      </button>
    </aside>
  );
}
