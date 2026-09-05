import * as Dialog from '@radix-ui/react-dialog';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import { useSettingsStore } from '@ui/store/settings-store';

interface VolumeSliderProps {
  icon: 'music' | 'effects';
  label: string;
  onValueChange: (value: number) => void;
  value: number;
}

function VolumeSlider({ icon, label, onValueChange, value }: VolumeSliderProps) {
  return (
    <label className="setting-row setting-row--stacked">
      <span>
        <span aria-hidden="true" className={`setting-row__icon setting-row__icon--${icon}`} />
        {label} <output>{value}%</output>
      </span>
      <Slider.Root
        aria-label={label}
        className="volume-slider"
        max={100}
        onValueChange={([nextValue]) => onValueChange(nextValue ?? value)}
        step={5}
        value={[value]}
      >
        <Slider.Track className="volume-slider__track">
          <Slider.Range className="volume-slider__range" />
        </Slider.Track>
        <Slider.Thumb className="volume-slider__thumb" />
      </Slider.Root>
    </label>
  );
}

export function SettingsDialog() {
  const effectsVolume = useSettingsStore((state) => state.effectsVolume);
  const musicVolume = useSettingsStore((state) => state.musicVolume);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const vibration = useSettingsStore((state) => state.vibration);
  const setEffectsVolume = useSettingsStore((state) => state.setEffectsVolume);
  const setMusicVolume = useSettingsStore((state) => state.setMusicVolume);
  const setReducedMotion = useSettingsStore((state) => state.setReducedMotion);
  const setVibration = useSettingsStore((state) => state.setVibration);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="menu-button" type="button">
          <span>Настройки</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="settings-dialog">
          <Dialog.Title>Настройки</Dialog.Title>
          <Dialog.Description>
            Настройте звук, вибрацию и движение. Параметры сохраняются автоматически.
          </Dialog.Description>

          <div className="settings-dialog__controls">
            <VolumeSlider
              icon="music"
              label="Музыка"
              onValueChange={setMusicVolume}
              value={musicVolume}
            />
            <VolumeSlider
              icon="effects"
              label="Эффекты"
              onValueChange={setEffectsVolume}
              value={effectsVolume}
            />
            <label className="setting-row">
              <span>
                <span aria-hidden="true" className="setting-row__icon setting-row__icon--motion" />
                Уменьшить движение
              </span>
              <Switch.Root
                aria-label="Уменьшить движение"
                checked={reducedMotion}
                className="motion-switch"
                onCheckedChange={setReducedMotion}
              >
                <Switch.Thumb className="motion-switch__thumb" />
              </Switch.Root>
            </label>
            <label className="setting-row">
              <span>
                <span
                  aria-hidden="true"
                  className="setting-row__icon setting-row__icon--vibration"
                />
                Вибрация
              </span>
              <Switch.Root
                aria-label="Вибрация"
                checked={vibration}
                className="motion-switch"
                onCheckedChange={setVibration}
              >
                <Switch.Thumb className="motion-switch__thumb" />
              </Switch.Root>
            </label>
          </div>

          <Dialog.Close asChild>
            <button className="dialog-close" type="button">
              Готово
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
