import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSession } from './arcade';
import { MinesweeperGame, RESULT_DELAY_MS } from './MinesweeperGame';
import { neighbours, openCell } from './logic/board';
import { randomSeed } from './logic/seed';
import type { MinesweeperSession } from './logic/session';
import { startTimeAttack } from './logic/timeAttack';
import { beginner, cell, key, mineCells, openCount, safeCells, stateOf } from './test/minefield';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  // Every board of the run gets the same seed, so the test can rebuild the minefield.
  vi.spyOn(Math, 'random').mockReturnValue(0.25);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const board = () => screen.getByRole('group', { name: /Minefield/ });

function start(props: Parameters<typeof MinesweeperGame>[0] = {}) {
  const view = render(<MinesweeperGame {...props} />);
  act(() => key(' '));
  return view;
}

describe('<MinesweeperGame />', () => {
  it('starts from the idle overlay, the first click opens an area and the clock starts', () => {
    const onStatusChange = vi.fn();
    const { container } = render(<MinesweeperGame onStatusChange={onStatusChange} />);
    expect(screen.getByRole('dialog', { name: 'Minesweeper' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Beginner' }).getAttribute('aria-pressed')).toBe('true');
    act(() => key(' '));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
    expect(openCount(container)).toBe(0);
    act(() => fireEvent.click(cell(container, 40)));
    expect(stateOf(container, 40)).toBe('open');
    // The first click never hits a mine and opens at least its 3 x 3 block.
    expect(openCount(container)).toBeGreaterThanOrEqual(9);
    act(() => vi.advanceTimersByTime(2100));
    expect(container.querySelector('.arc-stats')?.textContent).toContain('00:02');
  });

  it('right-click flags and unflags a hidden cell; a flagged cell does not open', () => {
    const { container } = start();
    act(() => fireEvent.click(cell(container, 40)));
    const b = beginner();
    const hidden = b.cells.findIndex((c) => !c.open);
    act(() => fireEvent.contextMenu(cell(container, hidden)));
    expect(stateOf(container, hidden)).toBe('flag');
    expect(container.querySelector('.arc-stats')?.textContent).toMatch(/Mines\s*9/);
    act(() => fireEvent.click(cell(container, hidden)));
    expect(stateOf(container, hidden)).toBe('flag');
    act(() => fireEvent.contextMenu(cell(container, hidden)));
    expect(stateOf(container, hidden)).toBe('hidden');
  });

  it('a long press (500 ms) flags on touch screens without opening the cell', () => {
    const { container } = start();
    act(() => fireEvent.click(cell(container, 40)));
    const hidden = beginner().cells.findIndex((c) => !c.open);
    const el = cell(container, hidden);
    act(() => fireEvent.pointerDown(el, { pointerType: 'touch' }));
    act(() => vi.advanceTimersByTime(520));
    act(() => fireEvent.pointerUp(el, { pointerType: 'touch' }));
    act(() => fireEvent.click(el));
    expect(stateOf(container, hidden)).toBe('flag');
  });

  it('losing reveals every mine, shows the game-over card and does not call onGameOver', () => {
    const onGameOver = vi.fn();
    const onRunEnd = vi.fn();
    const { container } = start({ onGameOver, onRunEnd });
    act(() => fireEvent.click(cell(container, 40)));
    const b = beginner();
    const [first, ...rest] = mineCells(b);
    const wrong = safeCells(b).find((i) => !b.cells[i]!.open)!;
    act(() => fireEvent.contextMenu(cell(container, wrong)));
    act(() => fireEvent.click(cell(container, first!)));
    expect(stateOf(container, first!)).toBe('exploded');
    for (const m of rest) expect(stateOf(container, m)).toBe('mine');
    expect(stateOf(container, wrong)).toBe('wrong');
    act(() => vi.advanceTimersByTime(RESULT_DELAY_MS));
    expect(screen.getByRole('dialog', { name: 'Boom!' })).toBeTruthy();
    expect(onGameOver).not.toHaveBeenCalled();
    expect(onRunEnd).toHaveBeenCalledTimes(1);
    expect(onRunEnd).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'loss', score: 0 }));
    // "View board" hides the card so the revealed field can be studied.
    act(() => fireEvent.click(screen.getByRole('button', { name: 'View board' })));
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => fireEvent.click(cell(container, rest[0]!)));
    expect(onRunEnd).toHaveBeenCalledTimes(1);
  });

  it('clearing the field wins, flags the mines and reports the score once', () => {
    const onGameOver = vi.fn();
    const onRunEnd = vi.fn();
    const { container } = start({ onGameOver, onRunEnd });
    act(() => fireEvent.click(cell(container, 40)));
    const b = beginner();
    for (const i of safeCells(b)) {
      if (stateOf(container, i) === 'hidden') act(() => fireEvent.click(cell(container, i)));
    }
    // No time passed: par / max(seconds, 1) caps at 1, so the full beginner base.
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(1000);
    expect(onRunEnd).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'win', score: 1000 }));
    for (const m of mineCells(b)) expect(stateOf(container, m)).toBe('flag');
    act(() => vi.advanceTimersByTime(RESULT_DELAY_MS));
    expect(screen.getByRole('dialog', { name: 'Cleared!' }).textContent).toMatch(/1,000/);
  });

  it('a click on a satisfied number chords its hidden neighbours', () => {
    const { container } = start();
    act(() => fireEvent.click(cell(container, 40)));
    const b = beginner();
    const nb = (i: number) => neighbours('square', 9, 9, i);
    const target = b.cells.findIndex(
      (c, i) => c.open && c.adjacent > 0 && nb(i).some((k) => !b.cells[k]!.open && !b.cells[k]!.mine),
    );
    expect(target).toBeGreaterThanOrEqual(0);
    for (const k of nb(target)) if (b.cells[k]!.mine) act(() => fireEvent.contextMenu(cell(container, k)));
    act(() => fireEvent.click(cell(container, target)));
    for (const k of nb(target)) {
      expect(stateOf(container, k)).toBe(b.cells[k]!.mine ? 'flag' : 'open');
    }
  });

  it('arrow keys move the focus ring; Space opens and F flags the focused cell', () => {
    const { container } = start();
    expect(board().getAttribute('aria-activedescendant')).toBe(cell(container, 40).id);
    for (let i = 0; i < 4; i += 1) act(() => key('ArrowUp'));
    expect(board().getAttribute('aria-activedescendant')).toBe(cell(container, 4).id);
    expect(cell(container, 4).getAttribute('data-focus')).toBe('true');
    act(() => key('f'));
    expect(stateOf(container, 4)).toBe('flag');
    act(() => key(' '));
    expect(stateOf(container, 4)).toBe('flag');
    act(() => key('F'));
    act(() => key(' '));
    expect(stateOf(container, 4)).toBe('open');
    act(() => key('ArrowLeft'));
    expect(board().getAttribute('aria-activedescendant')).toBe(cell(container, 3).id);
  });

  it('plays on hexagonal cells with keyboard focus too', () => {
    const { container } = render(<MinesweeperGame />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Hexagonal' })));
    expect(board().getAttribute('data-topology')).toBe('hex');
    expect(container.querySelectorAll('[data-i] polygon')[0]?.getAttribute('points')?.split(' ')).toHaveLength(6);
    act(() => key(' '));
    act(() => key('ArrowDown'));
    expect(board().getAttribute('aria-activedescendant')).toBe(cell(container, 49).id);
    act(() => key(' '));
    expect(stateOf(container, 49)).toBe('open');
    // Hex flood fill opens at least the cell and its 6 neighbours.
    expect(openCount(container)).toBeGreaterThanOrEqual(7);
  });

  it('asks in-page before a mode switch abandons a running board', () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    const { container } = start();
    // Nothing opened yet: the switch is immediate.
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Intermediate' })));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(board().getAttribute('data-cols')).toBe('16');
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Beginner' })));
    act(() => fireEvent.click(cell(container, 40)));
    const opened = openCount(container);

    act(() => fireEvent.click(screen.getByRole('button', { name: 'Expert' })));
    expect(screen.getByRole('dialog', { name: 'Abandon this board?' })).toBeTruthy();
    act(() => fireEvent.click(screen.getByRole('button', { name: /Keep playing/ })));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(openCount(container)).toBe(opened);
    expect(board().getAttribute('data-cols')).toBe('9');

    act(() => fireEvent.click(screen.getByRole('button', { name: 'Expert' })));
    act(() => key('Enter'));
    expect(board().getAttribute('data-cols')).toBe('30');
    expect(container.querySelectorAll('[data-i]')).toHaveLength(480);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('time attack: a mine costs 15 s with visible feedback, a cleared board scores 150', () => {
    const onRunEnd = vi.fn();
    const { container } = render(<MinesweeperGame onRunEnd={onRunEnd} />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Time attack' })));
    act(() => key(' '));
    expect(container.querySelector('.arc-stats')?.textContent).toContain('03:00');
    const first = openCell(startTimeAttack(randomSeed()).board, 40);
    act(() => fireEvent.click(cell(container, 40)));
    act(() => fireEvent.click(cell(container, mineCells(first)[0]!)));
    expect(screen.getByTestId('ms-penalty').textContent).toBe('−15 s');
    expect(container.querySelector('[data-flash="mine"]')).toBeTruthy();
    expect(container.querySelector('.arc-stats')?.textContent).toContain('02:45');
    expect(openCount(container)).toBe(0); // a fresh board follows
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.queryByTestId('ms-penalty')).toBeNull();

    // The next board comes from a derived seed; rebuild it from the game's own board.
    act(() => fireEvent.click(cell(container, 40)));
    const env = (() => {
      act(() => vi.advanceTimersByTime(1100));
      return loadSession<MinesweeperSession>('minesweeper', 1);
    })();
    const live = env!.data.board;
    for (const i of safeCells(live)) {
      if (stateOf(container, i) === 'hidden') act(() => fireEvent.click(cell(container, i)));
    }
    const stats = container.querySelector('.arc-stats')?.textContent ?? '';
    expect(stats).toMatch(/Score\s*150/);
    expect(stats).toMatch(/Boards\s*1/);
    expect(screen.getByTestId('ms-bonus').textContent).toBe('+150');

    act(() => vi.advanceTimersByTime(180_000));
    act(() => vi.advanceTimersByTime(RESULT_DELAY_MS));
    expect(screen.getByRole('dialog', { name: "Time's up!" })).toBeTruthy();
    expect(onRunEnd).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'over', score: 150 }));
  });

  it('pauses with P, ignores clicks while paused and resumes', () => {
    const { container } = start();
    act(() => key('p'));
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
    act(() => fireEvent.click(cell(container, 40)));
    expect(openCount(container)).toBe(0);
    act(() => key('p'));
    act(() => fireEvent.click(cell(container, 40)));
    expect(openCount(container)).toBeGreaterThan(0);
  });

  it('autosaves the board and restores it paused with Welcome back', () => {
    const first = start();
    act(() => fireEvent.click(cell(first.container, 40)));
    act(() => fireEvent.contextMenu(cell(first.container, beginner().cells.findIndex((c) => !c.open))));
    act(() => vi.advanceTimersByTime(3200));
    const opened = openCount(first.container);
    first.unmount();
    const env = loadSession<MinesweeperSession>('minesweeper', 1);
    expect(env?.data.mode).toEqual({ kind: 'classic', level: 'beginner' });
    expect(env?.data.board.generated).toBe(true);

    const { container } = render(<MinesweeperGame />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    expect(openCount(container)).toBe(opened);
    expect(container.querySelectorAll('[data-state="flag"]')).toHaveLength(1);
    expect(container.querySelector('.arc-stats')?.textContent).toContain('00:03');
    act(() => key('p'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the expert boards rotated on a portrait phone', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: true,
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    try {
      const { container } = render(<MinesweeperGame />);
      act(() => fireEvent.click(screen.getByRole('button', { name: 'Expert' })));
      expect(board().getAttribute('data-cols')).toBe('16');
      expect(board().getAttribute('data-rows')).toBe('30');
      act(() => key(' '));
      const before = Number(cell(container, 0).id && board().getAttribute('aria-activedescendant')?.split('-').pop());
      act(() => key('ArrowRight'));
      // Screen right is the next logical row.
      expect(Number(board().getAttribute('aria-activedescendant')?.split('-').pop())).toBe(before + 30);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('a fast second click on a different cell still opens it (only a same-cell double-click is skipped)', () => {
    const { container } = start();
    act(() => fireEvent.click(cell(container, 40)));
    const b = beginner();
    const [a, c] = safeCells(b).filter((i) => !b.cells[i]!.open);
    act(() => fireEvent.click(cell(container, a!), { detail: 1 }));
    act(() => fireEvent.click(cell(container, c!), { detail: 2 }));
    expect(stateOf(container, a!)).not.toBe('hidden');
    expect(stateOf(container, c!)).not.toBe('hidden');
  });

  it('Space and Enter on a focused button belong to the button, not to the board', () => {
    const { container } = render(<MinesweeperGame />);
    act(() => fireEvent.keyDown(screen.getByRole('button', { name: 'Hexagonal' }), { key: ' ' }));
    expect(screen.getByRole('dialog', { name: 'Minesweeper' })).toBeTruthy();
    act(() => key(' '));
    for (let i = 0; i < 4; i += 1) act(() => key('ArrowUp'));
    act(() => fireEvent.keyDown(screen.getByRole('button', { name: 'Pause' }), { key: 'Enter' }));
    act(() => fireEvent.keyDown(screen.getByRole('button', { name: 'Pause' }), { key: ' ' }));
    expect(stateOf(container, 4)).toBe('hidden');
    act(() => key(' '));
    expect(stateOf(container, 4)).toBe('open');
  });

  it('does not autosave a classic board before the first open', () => {
    const view = start();
    act(() => vi.advanceTimersByTime(2500));
    view.unmount();
    expect(loadSession<MinesweeperSession>('minesweeper', 1)).toBeNull();
  });

  it('remembers the classic level when coming back from time attack', () => {
    render(<MinesweeperGame />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Expert' })));
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Time attack' })));
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Hexagonal' })));
    expect(screen.getByRole('button', { name: 'Expert' }).getAttribute('aria-pressed')).toBe('true');
    expect(board().getAttribute('data-cols')).toBe('24');
  });
});
