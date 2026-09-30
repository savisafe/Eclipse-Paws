import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RendererLostOverlay } from '@ui/components/RendererLostOverlay';

describe('RendererLostOverlay', () => {
  afterEach(cleanup);

  // The ordinary case: the phone reclaimed the memory, is about to hand it back, and the card
  // exists only so the hold does not read as a crash.
  it('says the wait is temporary and offers nothing to press', () => {
    render(<RendererLostOverlay onReload={vi.fn()} stalled={false} />);

    expect(screen.getByRole('alertdialog', { name: 'Графика приостановлена' })).toBeVisible();
    expect(screen.getByText(/освобождает память/)).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
  });

  // When the context never comes back a reload is the only way out, so the card has to say so
  // rather than leave the player waiting on something that is not coming.
  it('offers the reload once the context has not come back', () => {
    const onReload = vi.fn();
    render(<RendererLostOverlay onReload={onReload} stalled />);

    expect(screen.getByText(/не вернулась сама/)).toBeVisible();
    const reload = screen.getByRole('button', { name: 'Обновить страницу' });
    fireEvent.click(reload);

    expect(onReload).toHaveBeenCalledTimes(1);
  });
});
