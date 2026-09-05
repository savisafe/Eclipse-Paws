import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@ui/App';
import { useSessionStore } from '@ui/store/session-store';

vi.mock('@ui/components/GameCanvas', () => ({
  GameCanvas: () => <div data-testid="mock-game-canvas" />,
}));

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSessionStore.setState({ appState: 'boot' });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows boot then transitions to the accessible main menu', async () => {
    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('Открываем врата сна');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(screen.getByRole('heading', { name: 'Eclipse Paws' })).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Главное меню' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Новая игра' })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Продолжить/ })).toBeDisabled();
  });

  it('shows the story card before loading the prototype arena', async () => {
    render(<App />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Новая игра' }));

    expect(screen.getByRole('heading', { name: 'Сад первой зари' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Начать уровень' }));

    expect(screen.getByText('Открываем «Сад первой зари»…')).toBeVisible();
  });

  it('a debug launch query skips the menu and jumps straight into the requested level (ARC-015)', async () => {
    vi.resetModules();
    window.history.replaceState(null, '', '?level=whispering-lanterns&heroLevel=3');
    try {
      const { App: DebugLaunchApp } = await import('@ui/App');
      render(<DebugLaunchApp />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(screen.queryByRole('navigation', { name: 'Главное меню' })).not.toBeInTheDocument();
      expect(screen.getByText('Открываем «Лес шепчущих фонарей»…')).toBeVisible();
    } finally {
      window.history.replaceState(null, '', '');
    }
  });
});
