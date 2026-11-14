import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang } from './arcade';
import { MinesweeperGame } from './MinesweeperGame';
import { neighbours } from './logic/board';
import { beginner, cell, key, mineCells, safeCells, stateOf } from './test/minefield';
import { setCoarsePointer } from './test/touchEnv';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('en', { silent: true });
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.25);
  setCoarsePointer(true);
  // jsdom has no scrolling; leaving the CSS full screen restores the scroll position.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const down = (el: Element, x = 10, y = 10) =>
  fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch', button: 0, clientX: x, clientY: y });
const up = (el: Element, x = 10, y = 10) =>
  fireEvent.pointerUp(el, { pointerId: 1, pointerType: 'touch', button: 0, clientX: x, clientY: y });
/** A touch tap: down, up and the click the browser sends after it. */
function tap(el: Element) {
  act(() => {
    down(el);
    up(el);
    fireEvent.click(el);
  });
}
function hold(el: Element, ms = 450) {
  act(() => {
    down(el);
  });
  act(() => vi.advanceTimersByTime(ms));
  act(() => {
    up(el);
    fireEvent.click(el);
  });
}

function started() {
  const view = render(<MinesweeperGame />);
  act(() => key(' '));
  tap(cell(view.container, 40));
  return view;
}
const firstHidden = () => beginner().cells.findIndex((c) => !c.open);

describe('Minesweeper touch controls', () => {
  it('the board sits in a tap frame that pans inside itself', () => {
    const { container } = render(<MinesweeperGame />);
    const frame = screen.getByTestId('ms-frame');
    expect(frame.classList.contains('arc-board-tap')).toBe(true);
    expect(frame.contains(container.querySelector('svg[data-topology]'))).toBe(true);
  });

  it('a tap opens a cell', () => {
    const { container } = started();
    expect(stateOf(container, 40)).toBe('open');
  });

  it('a long press (400 ms) flags without opening; a shorter press opens', () => {
    const { container } = started();
    const i = firstHidden();
    hold(cell(container, i), 420);
    expect(stateOf(container, i)).toBe('flag');
    hold(cell(container, i), 420);
    expect(stateOf(container, i)).toBe('hidden');
    const safe = safeCells(beginner()).find((k) => stateOf(container, k) === 'hidden')!;
    hold(cell(container, safe), 300);
    expect(stateOf(container, safe)).not.toBe('hidden');
  });

  it('a finger that drags (pans the board) neither flags nor opens', () => {
    const { container } = started();
    const i = firstHidden();
    const el = cell(container, i);
    act(() => {
      down(el, 10, 10);
      fireEvent.pointerMove(window, { pointerId: 1, pointerType: 'touch', clientX: 40, clientY: 12 });
    });
    act(() => vi.advanceTimersByTime(600));
    // The browser takes the gesture for scrolling: pointercancel, no click.
    act(() => {
      fireEvent.pointerCancel(el, { pointerId: 1, pointerType: 'touch' });
    });
    expect(stateOf(container, i)).toBe('hidden');
  });

  it('the Flag toggle makes a tap flag and a long press open', () => {
    const { container } = started();
    const toggle = screen.getByRole('button', { name: 'Flag' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    const i = firstHidden();
    tap(cell(container, i));
    expect(stateOf(container, i)).toBe('flag');
    tap(cell(container, i));
    expect(stateOf(container, i)).toBe('hidden');
    const safe = safeCells(beginner()).find((k) => stateOf(container, k) === 'hidden')!;
    hold(cell(container, safe), 420);
    expect(stateOf(container, safe)).not.toBe('hidden');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
  });

  it('a tap on a satisfied number chords, with long-press flags and in Flag mode too', () => {
    const b = beginner();
    const nb = (i: number) => neighbours('square', 9, 9, i);
    const target = b.cells.findIndex(
      (c, i) => c.open && c.adjacent > 0 && nb(i).some((k) => !b.cells[k]!.open && !b.cells[k]!.mine),
    );
    expect(target).toBeGreaterThanOrEqual(0);
    for (const flagMode of [false, true]) {
      localStorage.clear();
      const { container, unmount } = started();
      if (flagMode) fireEvent.click(screen.getByRole('button', { name: 'Flag' }));
      for (const k of nb(target)) {
        if (!b.cells[k]!.mine) continue;
        if (flagMode) tap(cell(container, k));
        else hold(cell(container, k), 420);
      }
      tap(cell(container, target));
      for (const k of nb(target)) expect(stateOf(container, k)).toBe(b.cells[k]!.mine ? 'flag' : 'open');
      unmount();
    }
  });

  it('a held mouse button stays a click (opens, never flags)', () => {
    const { container } = started();
    const safe = safeCells(beginner()).find((k) => stateOf(container, k) === 'hidden')!;
    const el = cell(container, safe);
    act(() => {
      fireEvent.pointerDown(el, { pointerId: 2, pointerType: 'mouse', button: 0 });
    });
    act(() => vi.advanceTimersByTime(800));
    act(() => {
      fireEvent.pointerUp(el, { pointerId: 2, pointerType: 'mouse', button: 0 });
      fireEvent.click(el);
    });
    expect(stateOf(container, safe)).not.toBe('hidden');
    expect(stateOf(container, safe)).not.toBe('flag');
  });

  it('a long press on a mine flags it and never explodes it', () => {
    const { container } = started();
    const mine = mineCells(beginner())[0]!;
    hold(cell(container, mine), 420);
    expect(stateOf(container, mine)).toBe('flag');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows touch help next to the (hidden) key help', () => {
    render(<MinesweeperGame />);
    expect(screen.getByRole('list', { name: 'Touch controls' }).textContent).toContain('Long press');
    expect(screen.getByText('Flag button')).toBeTruthy();
  });

  it('the full-screen button toggles the immersive mode', () => {
    render(<MinesweeperGame />);
    fireEvent.click(screen.getByRole('button', { name: /Full screen/ }));
    expect(document.documentElement.dataset.arcadeImmersive).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: /Exit full screen/ }));
    expect(document.documentElement.dataset.arcadeImmersive).toBeUndefined();
  });

  it('Escape in full screen pauses a live board but never resumes a paused one', () => {
    const { container } = started();
    fireEvent.click(screen.getByRole('button', { name: /Full screen/ }));
    act(() => key('p'));
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
    act(() => key('Escape'));
    expect(screen.getByRole('dialog', { name: 'Paused' })).toBeTruthy();
    expect(document.documentElement.dataset.arcadeImmersive).toBeUndefined();
    expect(stateOf(container, 40)).toBe('open');
  });
});
