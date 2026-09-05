import * as Dialog from '@radix-ui/react-dialog';
import { CAMPAIGN_LEVEL_ORDER, CAMPAIGN_LEVELS, type CampaignLevelId } from '@content/index';
import gardenFirstDawn from '../../assets/ui/chapters/garden-first-dawn-v1.png?url';
import whisperingLanterns from '../../assets/ui/chapters/whispering-lanterns-v1.png?url';
import middayClockCity from '../../assets/ui/chapters/midday-clock-city-v1.png?url';
import unreadLettersSea from '../../assets/ui/chapters/unread-letters-sea-v1.png?url';
import forgottenSmilesCarnival from '../../assets/ui/chapters/forgotten-smiles-carnival-v1.png?url';
import lastStarField from '../../assets/ui/chapters/last-star-field-v1.png?url';
import eternalSleepHeart from '../../assets/ui/chapters/eternal-sleep-heart-v1.png?url';

const CHAPTER_ICONS: Record<CampaignLevelId, string> = {
  'garden-first-dawn': gardenFirstDawn,
  'whispering-lanterns': whisperingLanterns,
  'midday-clock-city': middayClockCity,
  'unread-letters-sea': unreadLettersSea,
  'forgotten-smiles-carnival': forgottenSmilesCarnival,
  'last-star-field': lastStarField,
  'eternal-sleep-heart': eternalSleepHeart,
};

interface LevelSelectDialogProps {
  onSelect: (levelId: CampaignLevelId) => void;
  unlockedLevels: readonly CampaignLevelId[];
}

export function LevelSelectDialog({ onSelect, unlockedLevels }: LevelSelectDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="menu-button" type="button">
          <span>Выбор уровня</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="settings-dialog level-select-dialog">
          <Dialog.Title>Выбор уровня</Dialog.Title>
          <Dialog.Description>Пройденный уровень открывает следующий.</Dialog.Description>
          <div className="level-select-list">
            {CAMPAIGN_LEVEL_ORDER.map((levelId) => {
              const level = CAMPAIGN_LEVELS[levelId];
              const unlocked = unlockedLevels.includes(levelId);
              return (
                <Dialog.Close asChild key={levelId}>
                  <button
                    className="level-select-button"
                    disabled={!unlocked}
                    onClick={() => onSelect(levelId)}
                    type="button"
                  >
                    <span
                      className="level-select-button__icon"
                      style={{
                        backgroundImage: unlocked ? `url(${CHAPTER_ICONS[levelId]})` : undefined,
                      }}
                    >
                      <em>{level.index}</em>
                    </span>
                    <strong>{level.title}</strong>
                    <small>{unlocked ? level.subtitle : 'Закрыто'}</small>
                  </button>
                </Dialog.Close>
              );
            })}
          </div>
          <Dialog.Close asChild>
            <button className="dialog-close" type="button">
              Закрыть
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
