import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Prologue } from '@ui/components/Prologue';
import { useSettingsStore } from '@ui/store/settings-store';

const PANELS = Array.from({ length: 8 }, (_, index) => ({
  id: `panel-${index + 1}`,
  imageUrl: `/panel-${index + 1}.png`,
  caption: `Scene ${index + 1}`,
}));

describe('Prologue live staging', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSettingsStore.setState({ reducedMotion: false });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('supports an optional timed advance while keeping captions announced', async () => {
    render(<Prologue onComplete={vi.fn()} panels={PANELS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Авто' }));
    expect(screen.getByRole('button', { name: 'Авто: вкл.' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await act(async () => vi.advanceTimersByTimeAsync(10_500));
    expect(screen.getByText('Scene 2')).toBeVisible();
    expect(screen.getByText('2 / 8')).toBeVisible();
  });

  it('starts loading the level immediately after the last panel', () => {
    const onComplete = vi.fn();
    render(<Prologue onComplete={onComplete} panels={PANELS} />);
    for (let index = 0; index < 7; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Далее' }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Начать уровень' }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('honours reduced motion and always offers an immediate skip', () => {
    const onComplete = vi.fn();
    useSettingsStore.setState({ reducedMotion: true });
    const { rerender } = render(<Prologue onComplete={onComplete} panels={PANELS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Пропустить' }));
    expect(onComplete).toHaveBeenCalledOnce();

    onComplete.mockClear();
    rerender(<Prologue onComplete={onComplete} panels={[PANELS[7]!]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Начать уровень' }));
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
