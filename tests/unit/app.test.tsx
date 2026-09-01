import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@ui/App';
import { useSessionStore } from '@ui/store/session-store';

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

    expect(screen.getByRole('status')).toHaveTextContent('Пробуждаем Эйлару');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(screen.getByRole('heading', { name: 'Eclipse Paws' })).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Главное меню' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Новая игра' })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Продолжить/ })).toBeDisabled();
  });

  it('starts loading the prototype arena from New Game', async () => {
    render(<App />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Новая игра' }));

    expect(screen.getByText('Открываем Сад первой зари…')).toBeVisible();
  });
});
