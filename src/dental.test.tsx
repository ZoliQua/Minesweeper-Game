import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang } from './arcade';
import { MinesweeperGame, RESULT_DELAY_MS } from './MinesweeperGame';
import { beginner, cell, key, mineCells, openCount, stateOf } from './test/minefield';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.25);
});
afterEach(() => {
  applyDental(false, { silent: true });
  applyLang('en', { silent: true });
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const board = () => screen.getByRole('group', { name: /Minefield/ });

/** Start, open the centre and flag the first hidden cell. Returns the flagged index. */
function playOpening() {
  const view = render(<MinesweeperGame />);
  act(() => key(' '));
  act(() => fireEvent.click(cell(view.container, 40)));
  const flagged = beginner().cells.findIndex((c) => !c.open);
  act(() => fireEvent.contextMenu(cell(view.container, flagged)));
  return { ...view, flagged };
}

describe('dental mode', () => {
  it('draws mines as decayed teeth and flags as toothbrushes; a loss reveals every tooth', () => {
    applyDental(true);
    const { container, flagged } = playOpening();
    expect(board().getAttribute('data-dental')).toBe('true');
    expect(cell(container, flagged).querySelector('[data-testid="ms-flag-brush"]')).toBeTruthy();
    expect(screen.queryByTestId('ms-flag')).toBeNull();
    const mines = mineCells(beginner());
    const target = mines.find((m) => m !== flagged)!;
    act(() => fireEvent.click(cell(container, target)));
    // Every unflagged mine is shown as a decayed tooth (the opened one included).
    const shown = mines.filter((m) => stateOf(container, m) !== 'flag').length;
    expect(screen.getAllByTestId('ms-mine-tooth')).toHaveLength(shown);
    expect(screen.queryByTestId('ms-mine')).toBeNull();
    act(() => vi.advanceTimersByTime(RESULT_DELAY_MS));
    expect(screen.getByRole('dialog', { name: 'Cavity!' })).toBeTruthy();
  });

  it('toggling dental mode mid-run keeps the board, the flags and the clock', () => {
    const { container, flagged } = playOpening();
    act(() => vi.advanceTimersByTime(3100));
    const opened = openCount(container);
    const stats = () => container.querySelector('.arc-stats')?.textContent ?? '';
    expect(stats()).toMatch(/Mines\s*9/);
    expect(stats()).toContain('00:03');

    act(() => fireEvent.click(screen.getByRole('checkbox', { name: /Dental mode/ })));
    expect(board().getAttribute('data-dental')).toBe('true');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(openCount(container)).toBe(opened);
    expect(stateOf(container, flagged)).toBe('flag');
    expect(cell(container, flagged).querySelector('[data-testid="ms-flag-brush"]')).toBeTruthy();
    expect(stats()).toMatch(/Decay\s*9/);
    expect(stats()).toContain('00:03');
    expect(cell(container, flagged).getAttribute('aria-label')).toMatch(/toothbrush/);
    expect(localStorage.getItem('arcade.dental')).toBe('1');

    act(() => applyDental(false));
    expect(board().getAttribute('data-dental')).toBe('false');
    expect(openCount(container)).toBe(opened);
    expect(cell(container, flagged).querySelector('[data-testid="ms-flag"]')).toBeTruthy();
  });

  it('with dental mode off the classic mines and flags are drawn; numbers stay digits either way', () => {
    const { container, flagged } = playOpening();
    expect(board().getAttribute('data-dental')).toBe('false');
    const mines = mineCells(beginner());
    act(() => fireEvent.click(cell(container, mines.find((m) => m !== flagged)!)));
    expect(screen.getAllByTestId('ms-mine').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('ms-mine-tooth')).toBeNull();
    const digits = Array.from(container.querySelectorAll('[data-state="open"] text')).map((n) => n.textContent);
    expect(digits.length).toBeGreaterThan(0);
    for (const d of digits) expect(d).toMatch(/^[1-8]$/);
  });
});
