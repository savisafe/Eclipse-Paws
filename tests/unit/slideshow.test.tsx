import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Slideshow } from '@ui/components/Slideshow';

const PANELS = [
  { id: 'p1', imageUrl: '/p1.png', caption: 'One' },
  { id: 'p2', imageUrl: '/p2.png', caption: 'Two' },
  { id: 'p3', imageUrl: '/p3.png' },
];

describe('Slideshow (COM-010A)', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows the first panel and its caption', () => {
    render(<Slideshow onComplete={vi.fn()} panels={PANELS} title="Test story" />);
    expect(screen.getByText('One')).toBeVisible();
    expect(screen.getByText('1 / 3')).toBeVisible();
  });

  it('advances on click and hides the caption for a panel without one', () => {
    render(<Slideshow onComplete={vi.fn()} panels={PANELS} title="Test story" />);
    fireEvent.click(screen.getByRole('button', { name: 'Далее' }));
    expect(screen.getByText('Two')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Далее' }));
    expect(screen.queryByText('One')).not.toBeInTheDocument();
    expect(screen.queryByText('Two')).not.toBeInTheDocument();
    expect(screen.getByText('3 / 3')).toBeVisible();
  });

  it('calls onComplete after the last panel instead of advancing further', () => {
    const onComplete = vi.fn();
    render(<Slideshow onComplete={onComplete} panels={PANELS} title="Test story" />);
    fireEvent.click(screen.getByRole('button', { name: 'Далее' }));
    fireEvent.click(screen.getByRole('button', { name: 'Далее' }));
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('skip button completes immediately from the first panel', () => {
    const onComplete = vi.fn();
    render(<Slideshow onComplete={onComplete} panels={PANELS} title="Test story" />);
    fireEvent.click(screen.getByRole('button', { name: 'Пропустить' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('advances on ArrowRight/Space and skips on Escape', () => {
    const onComplete = vi.fn();
    render(<Slideshow onComplete={onComplete} panels={PANELS} title="Test story" />);
    fireEvent.keyDown(window, { code: 'ArrowRight' });
    expect(screen.getByText('Two')).toBeVisible();
    fireEvent.keyDown(window, { code: 'Escape' });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
