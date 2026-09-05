import { PRIMARY_ABILITIES, SPECIAL_ABILITIES, SUPPORT_ABILITIES } from '@content/index';
import { ABILITY_UNLOCK_LEVEL } from '@core/index';
import type { AbilityConfig, AbilitySlot, CatId, GameplaySnapshot } from '@core/index';

interface AbilityCooldownsProps {
  activeCat: CatId;
  cooldowns: GameplaySnapshot['cooldowns'];
  heroLevel: number;
}

type CooldownSlot = Exclude<AbilitySlot, 'ultimate'>;

// The key stays visible because it is what the player presses; the canon ability name (§12) is
// what they are meant to learn, so both are shown on the chip.
const SLOTS: readonly { key: CooldownSlot; label: string }[] = [
  { key: 'primary', label: '1' },
  { key: 'special', label: '2' },
  { key: 'support', label: '3' },
];

export function AbilityCooldowns({ activeCat, cooldowns, heroLevel }: AbilityCooldownsProps) {
  const abilitiesBySlot: Readonly<Record<CooldownSlot, AbilityConfig>> = {
    primary: PRIMARY_ABILITIES[activeCat],
    special: SPECIAL_ABILITIES[activeCat],
    support: SUPPORT_ABILITIES[activeCat],
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
          <div className="ability-slot" key={ability.id}>
            <div
              aria-label={
                locked
                  ? `${ability.name}: откроется на уровне ${unlockLevel}`
                  : `${ability.name}: ${remainingMs > 0 ? `${Math.ceil(remainingMs / 1000)} сек.` : 'готово'}`
              }
              className={`ability-chip ${remainingMs > 0 ? 'is-cooling' : ''} ${locked ? 'is-locked' : ''}`}
            >
              <span>{locked ? `LV ${unlockLevel}` : label}</span>
              <i aria-hidden="true" style={{ transform: `scaleY(${progress})` }} />
            </div>
            <small aria-hidden="true" className="ability-slot__name">
              {ability.name}
            </small>
          </div>
        );
      })}
    </div>
  );
}
