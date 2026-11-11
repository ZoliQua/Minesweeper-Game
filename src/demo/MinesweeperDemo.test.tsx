import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readStats } from '../arcade';
import { DEMO_MOVE_MS, MinesweeperDemo } from './MinesweeperDemo';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const opened = (c: HTMLElement) => c.querySelectorAll('[data-state="open"]').length;

describe('<MinesweeperDemo />', () => {
  it('plays by itself on the real engine, starts new boards and writes nothing', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { container } = render(<MinesweeperDemo />);
    const demo = container.querySelector('.arc-demo');
    expect(demo?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('button, [tabindex]')).toBeNull();
    expect(opened(container)).toBe(0);
    act(() => vi.advanceTimersByTime(DEMO_MOVE_MS));
    expect(opened(container)).toBeGreaterThanOrEqual(9); // the safe first open floods an area
    let sawEnd = false;
    let sawRestart = false;
    for (let i = 0; i < 1500 && !sawRestart; i += 1) {
      act(() => vi.advanceTimersByTime(DEMO_MOVE_MS));
      const ended = container.querySelector('[data-state="exploded"]') !== null || opened(container) === 71;
      if (ended) sawEnd = true;
      if (sawEnd && opened(container) === 0) sawRestart = true;
    }
    expect(sawEnd).toBe(true);
    expect(sawRestart).toBe(true);
    expect(readStats('minesweeper').plays).toBe(0);
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });

  it('freezes when inactive', () => {
    const { container } = render(<MinesweeperDemo active={false} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(opened(container)).toBe(0);
  });
});
