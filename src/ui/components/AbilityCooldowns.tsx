import {
  PROTOTYPE_ABILITIES,
  PROTOTYPE_SPECIAL_ABILITIES,
  PROTOTYPE_SUPPORT_ABILITIES,
} from '@content/index';
import type { CatId, GameplaySnapshot } from '@core/index';

interface AbilityCooldownsProps {
  activeCat: CatId;
  cooldowns: GameplaySnapshot['cooldowns'];
}

const SLOT_LABELS = ['J', 'Q', 'F'] as const;

export function AbilityCooldowns({ activeCat, cooldowns }: AbilityCooldownsProps) {
  const abilities = [
    PROTOTYPE_ABILITIES[activeCat],
    PROTOTYPE_SUPPORT_ABILITIES[activeCat],
    PROTOTYPE_SPECIAL_ABILITIES[activeCat],
  ];

  return (
    <div className="ability-cooldowns" aria-label="Кулдауны способностей">
      {abilities.map((ability, index) => {
        const remainingMs = cooldowns[ability.id] ?? 0;
        const progress = Math.min(1, remainingMs / ability.cooldownMs);
        return (
          <div
            aria-label={`${ability.id}: ${remainingMs > 0 ? `${Math.ceil(remainingMs / 1000)} сек.` : 'готово'}`}
            className={`ability-chip ${remainingMs > 0 ? 'is-cooling' : ''}`}
            key={ability.id}
          >
            <span>{SLOT_LABELS[index]}</span>
            <i aria-hidden="true" style={{ transform: `scaleY(${progress})` }} />
          </div>
        );
      })}
    </div>
  );
}
