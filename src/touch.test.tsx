import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang } from './arcade';
import { MinesweeperGame } from './MinesweeperGame';
import { createBoard, neighbours, openCell } from './logic/board';
import { randomSeed } from './logic/seed';
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

  it('hexagonal boards: a tap opens, a long press flags', () => {
    const { container } = render(<MinesweeperGame />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Hexagonal' })));
    act(() => key(' '));
    tap(cell(container, 40));
    expect(stateOf(container, 40)).toBe('open');
    const hex = openCell(createBoard('hex', 9, 9, 10, randomSeed()), 40);
    const hidden = hex.cells.findIndex((c) => !c.open);
    hold(cell(container, hidden), 420);
    expect(stateOf(container, hidden)).toBe('flag');
    expect(container.querySelector('svg[data-topology]')!.getAttribute('data-topology')).toBe('hex');
  });

  it('the frame takes the height left below it when the page is not scrolled, and follows resizes', () => {
    const rect = (top: number) => ({ top, bottom: top + 10, left: 0, right: 10, width: 10, height: 10, x: 0, y: top, toJSON: () => ({}) });
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return rect(this.dataset.testid === 'ms-frame' ? 300 : 0) as DOMRect;
    });
    window.innerHeight = 844;
    render(<MinesweeperGame />);
    const wrap = screen.getByTestId('ms-frame').parentElement!;
    // 844 − 300 − a 12 px bottom gap
    expect(wrap.style.getPropertyValue('--ms-frame-h')).toBe('532px');
    // A page scrolled by 200 px does not change the answer: the frame's resting place counts.
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 200 });
    spy.mockImplementation(function (this: HTMLElement) {
      return rect(this.dataset.testid === 'ms-frame' ? 100 : 0) as DOMRect;
    });
    window.innerHeight = 664;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(wrap.style.getPropertyValue('--ms-frame-h')).toBe('352px');
    // Never below the minimum on a very short screen.
    window.innerHeight = 380;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(wrap.style.getPropertyValue('--ms-frame-h')).toBe('160px');
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    window.innerHeight = 768;
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
