import { describe, expect, it } from 'vitest';
import { createBoard, neighbours, openCell } from './board';
import { MAX_SCORE } from './scoring';
import { TIME_ATTACK_MS, startTimeAttack, taChord, taFlag, taOpen, tick, timeAttackScore, type TimeAttackState } from './timeAttack';
import type { Board } from './types';

function withBoard(s: TimeAttackState, layout: string[]): TimeAttackState {
  const rows = layout.length, cols = layout[0]!.length;
  const b = createBoard('square', cols, rows, 0, 7);
  const cells = b.cells.map((c, i) => ({ ...c, mine: layout[Math.floor(i / cols)]![i % cols] === '*' }));
  cells.forEach((c, i) => {
    c.adjacent = neighbours('square', cols, rows, i).filter((k) => cells[k]!.mine).length;
  });
  const board: Board = { ...b, cells, generated: true, mines: cells.filter((c) => c.mine).length };
  return { ...s, board };
}

describe('time attack', () => {
  it('starts at 180 s with no boards solved', () => {
    const s = startTimeAttack(5);
    expect(s.remainingMs).toBe(TIME_ATTACK_MS);
    expect(s.remainingMs).toBe(180000);
    expect(s.solved).toBe(0);
    expect(s.board.cols * s.board.rows).toBe(81);
    expect(s.board.mines).toBe(10);
  });
  it('tick subtracts and clamps at 0, then stops', () => {
    let s = startTimeAttack(1);
    s = tick(s, 1000);
    expect(s.remainingMs).toBe(179000);
    s = tick(s, 999999);
    expect(s.remainingMs).toBe(0);
    expect(tick(s, 10)).toBe(s);
  });
  it('a mine subtracts 15 000 ms and deals a new board', () => {
    const s = withBoard(startTimeAttack(1), ['*..', '...', '...']);
    const r = taOpen(s, 0);
    expect(r.remainingMs).toBe(TIME_ATTACK_MS - 15000);
    expect(r.solved).toBe(0);
    expect(r.board.generated).toBe(false);
    expect(r.board.exploded).toBeNull();
    expect(r.board.seed).not.toBe(s.board.seed);
  });
  it('the penalty never goes below 0', () => {
    let s = withBoard(startTimeAttack(1, 10000), ['*..', '...', '...']);
    s = taOpen(s, 0);
    expect(s.remainingMs).toBe(0);
    const t = startTimeAttack(1, 1);
    expect(taOpen(withBoard(t, ['*..', '...', '...']), 0).remainingMs).toBe(0);
  });
  it('solving a board scores 150 and deals a new one', () => {
    let s = withBoard(startTimeAttack(1), ['*..', '...', '...']);
    s = taOpen(s, 8);
    expect(s.solved).toBe(1);
    expect(timeAttackScore(s)).toBe(150);
    expect(s.board.generated).toBe(false);
    expect(s.remainingMs).toBe(TIME_ATTACK_MS);
  });
  it('the time-attack score is capped at MAX_SCORE (12000)', () => {
    expect(timeAttackScore({ solved: 79 })).toBe(11850);
    expect(timeAttackScore({ solved: 80 })).toBe(12000);
    expect(timeAttackScore({ solved: 100 })).toBe(12000);
    expect(timeAttackScore({ solved: 10000 })).toBe(MAX_SCORE);
  });
  it('real generated board can be solved via opening all safe cells', () => {
    let s = startTimeAttack(3);
    s = taOpen(s, 40);
    for (let i = 0; i < 81 && s.solved === 0 && s.board.exploded === null; i++) {
      if (!s.board.cells[i]!.mine) s = taOpen(s, i);
    }
    expect(s.solved).toBe(1);
  });
  it('ignores input once time is up; flags work before', () => {
    const s = startTimeAttack(1);
    const f = taFlag(s, 3);
    expect(f.board.cells[3]!.flag).toBe(true);
    const over = tick(f, TIME_ATTACK_MS);
    expect(taOpen(over, 0)).toBe(over);
    expect(taFlag(over, 4)).toBe(over);
    expect(taChord(over, 4)).toBe(over);
  });
  it('is pure', () => {
    const s = startTimeAttack(2);
    const snap = JSON.stringify(s);
    taOpen(s, 5);
    tick(s, 500);
    expect(JSON.stringify(s)).toBe(snap);
    expect(openCell(s.board, 5)).not.toBe(s.board);
  });
});
