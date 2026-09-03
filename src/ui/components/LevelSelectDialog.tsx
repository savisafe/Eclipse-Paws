import * as Dialog from '@radix-ui/react-dialog';
import { CAMPAIGN_LEVEL_ORDER, CAMPAIGN_LEVELS, type CampaignLevelId } from '@content/index';

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
                    <span>{level.index}</span>
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
