import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber, loadSession, saveSession } from './arcade';
import { MinesweeperGame } from './MinesweeperGame';
import { SESSION_SCHEMA, toSession } from './logic/session';
import { POINTS_PER_BOARD, startTimeAttack, timeAttackScore } from './logic/timeAttack';
import { randomSeed } from './logic/seed';
import { cell, key } from './test/minefield';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.25);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  applyLang('en', { silent: true });
});

const finishBtn = () => screen.queryByRole('button', { name: 'Befejezés' });
const stats = () => document.querySelector('.arc-stats')?.textContent ?? '';

/** A saved time attack with `solved` boards and 100 s left. */
function savedTimeAttack(solved: number) {
  const ta = { ...startTimeAttack(randomSeed()), remainingMs: 100_000, solved };
  const data = toSession({ kind: 'timeAttack', level: 'beginner' }, ta.board, 80, ta);
  saveSession('minesweeper', { schema: SESSION_SCHEMA, data, seconds: 80, score: timeAttackScore(ta) });
}

describe('Minesweeper finish early', () => {
  it('is hidden before the run starts and visible after the first open', () => {
    const { container } = render(<MinesweeperGame />);
    expect(finishBtn()).toBeNull();
    act(() => key(' '));
    // A classic board has not started before its first open (no clock, no mines yet).
    expect(finishBtn()).toBeNull();
    act(() => fireEvent.click(cell(container, 40)));
    expect(finishBtn()).toBeTruthy();
  });

  it('classic: confirms with the Score value 0, ranks it once, shows the finished card and drops the save', () => {
    const onGameOver = vi.fn();
    const { container } = render(<MinesweeperGame onGameOver={onGameOver} />);
    act(() => key(' '));
    act(() => fireEvent.click(cell(container, 40)));
    act(() => vi.advanceTimersByTime(2500));
    expect(loadSession('minesweeper', SESSION_SCHEMA)).not.toBeNull();
    expect(stats()).toMatch(/Pont\s*0/);
    fireEvent.click(finishBtn()!);
    expect(screen.getByRole('alertdialog').textContent).toContain('Befejezed a játékot? 0 pont kerül a ranglistára.');
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(0, { finished: true });
    expect(screen.getByRole('dialog', { name: 'Idő előtt befejezve' }).textContent).toContain('0 pont');
    expect(finishBtn()).toBeNull();
    act(() => vi.advanceTimersByTime(3000));
    expect(loadSession('minesweeper', SESSION_SCHEMA)).toBeNull();
    expect(onGameOver).toHaveBeenCalledTimes(1);
  });

  it('time attack: ranks the points so far', () => {
    savedTimeAttack(3);
    const score = 3 * POINTS_PER_BOARD;
    const onGameOver = vi.fn();
    render(<MinesweeperGame onGameOver={onGameOver} />);
    expect(screen.getByRole('dialog', { name: 'Üdv újra!' })).toBeTruthy();
    expect(stats()).toContain(formatNumber(score, 'hu'));
    fireEvent.click(finishBtn()!);
    expect(screen.getByRole('alertdialog').textContent).toContain(`${formatNumber(score, 'hu')} pont kerül a ranglistára`);
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(score, { finished: true });
    const card = screen.getByRole('dialog', { name: 'Idő előtt befejezve' });
    expect(card.textContent).toContain(`${formatNumber(3, 'hu')} tábla kész: ${formatNumber(score, 'hu')} pont`);
    expect(loadSession('minesweeper', SESSION_SCHEMA)).toBeNull();
  });

  it('Cancel changes nothing', () => {
    savedTimeAttack(2);
    const onGameOver = vi.fn();
    render(<MinesweeperGame onGameOver={onGameOver} />);
    const before = stats();
    fireEvent.click(finishBtn()!);
    fireEvent.click(screen.getByRole('button', { name: 'Mégse' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onGameOver).not.toHaveBeenCalled();
    expect(stats()).toBe(before);
    expect(screen.getByRole('dialog', { name: 'Üdv újra!' })).toBeTruthy();
  });

  it('stops the time-attack clock while the confirm is open', () => {
    savedTimeAttack(1);
    render(<MinesweeperGame />);
    act(() => key('p'));
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(finishBtn()!);
    const t1 = stats();
    act(() => vi.advanceTimersByTime(5000));
    expect(stats()).toBe(t1);
    fireEvent.click(screen.getByRole('button', { name: 'Mégse' }));
    act(() => vi.advanceTimersByTime(2000));
    expect(stats()).not.toBe(t1);
  });
});
