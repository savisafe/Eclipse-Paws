import {
  PROTOTYPE_ABILITIES,
  PROTOTYPE_SPECIAL_ABILITIES,
  PROTOTYPE_SUPPORT_ABILITIES,
} from '@content/index';
import { ABILITY_UNLOCK_LEVEL } from '@core/index';
import type { AbilityConfig, AbilitySlot, CatId, GameplaySnapshot } from '@core/index';

interface AbilityCooldownsProps {
  activeCat: CatId;
  cooldowns: GameplaySnapshot['cooldowns'];
  heroLevel: number;
}

type CooldownSlot = Exclude<AbilitySlot, 'ultimate'>;

const SLOTS: readonly { key: CooldownSlot; label: string }[] = [
  { key: 'primary', label: '1' },
  { key: 'special', label: '2' },
  { key: 'support', label: '3' },
];

export function AbilityCooldowns({ activeCat, cooldowns, heroLevel }: AbilityCooldownsProps) {
  const abilitiesBySlot: Readonly<Record<CooldownSlot, AbilityConfig>> = {
    primary: PROTOTYPE_ABILITIES[activeCat],
    special: PROTOTYPE_SPECIAL_ABILITIES[activeCat],
    support: PROTOTYPE_SUPPORT_ABILITIES[activeCat],
  };

  return (
    <div className="ability-cooldowns" aria-label="Кулдауны способностей">
      {SLOTS.map(({ key, label }) => {
        const ability = abilitiesBySlot[key];
        const unlockLevel = ABILITY_UNLOCK_LEVEL[key];
        const locked = heroLevel < unlockLevel;
        const remainingMs = locked ? 0 : (cooldowns[ability.id] ?? 0);
        const progress = Math.min(1, remainingMs / ability.cooldownMs);
        return (
          <div
            aria-label={
              locked
                ? `${ability.id}: откроется на уровне ${unlockLevel}`
                : `${ability.id}: ${remainingMs > 0 ? `${Math.ceil(remainingMs / 1000)} сек.` : 'готово'}`
            }
            className={`ability-chip ${remainingMs > 0 ? 'is-cooling' : ''} ${locked ? 'is-locked' : ''}`}
            key={ability.id}
          >
            <span>{locked ? `LV ${unlockLevel}` : label}</span>
            <i aria-hidden="true" style={{ transform: `scaleY(${progress})` }} />
          </div>
        );
      })}
    </div>
  );
}
