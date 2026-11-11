import { describe, expect, it } from 'vitest';
import { createBoard, openCell, toggleFlag } from './board';
import { isMinesweeperSession, restoreTimeAttack, toSession } from './session';
import { startTimeAttack, taOpen, tick } from './timeAttack';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;
const roundTrip = <T,>(v: T): unknown => JSON.parse(JSON.stringify(v));

describe('session', () => {
  it('round-trips a classic game in progress', () => {
    let b = openCell(createBoard('square', 9, 9, 10, 4), 40);
    b = toggleFlag(b, b.cells.findIndex((c) => !c.open));
    const s = toSession({ kind: 'classic', level: 'beginner' }, b, 42);
    const back = roundTrip(s);
    expect(isMinesweeperSession(back)).toBe(true);
    expect(back).toEqual(s);
  });
  it('round-trips a fresh hex board and an exploded one', () => {
    const fresh = toSession({ kind: 'hex', level: 'intermediate' }, createBoard('hex', 14, 14, 36, 9), 0);
    expect(isMinesweeperSession(roundTrip(fresh))).toBe(true);
    let b = openCell(createBoard('hex', 9, 9, 10, 2), 0);
    const mine = b.cells.findIndex((c) => c.mine);
    b = openCell(b, mine);
    expect(b.exploded).toBe(mine);
    expect(isMinesweeperSession(roundTrip(toSession({ kind: 'hex', level: 'beginner' }, b, 3)))).toBe(true);
  });
  it('a resumed time attack keeps remainingMs and solved', () => {
    let ta = taOpen(startTimeAttack(8), 40);
    ta = tick(ta, 61234);
    const saved = roundTrip(toSession({ kind: 'timeAttack', level: 'beginner' }, ta.board, 61, ta));
    expect(isMinesweeperSession(saved)).toBe(true);
    if (!isMinesweeperSession(saved)) return;
    const resumed = restoreTimeAttack(saved)!;
    expect(resumed.remainingMs).toBe(180000 - 61234);
    expect(resumed.solved).toBe(0);
    expect(resumed.board).toEqual(ta.board);
  });
  it('rejects malformed or tampered saves', () => {
    const good = toSession({ kind: 'classic', level: 'beginner' }, openCell(createBoard('square', 9, 9, 10, 4), 40), 5);
    const bad = (f: (s: Loose) => void) => {
      const c: Loose = roundTrip(good);
      f(c);
      return isMinesweeperSession(c);
    };
    expect(isMinesweeperSession(null)).toBe(false);
    expect(isMinesweeperSession({})).toBe(false);
    expect(bad((s) => (s.v = 2))).toBe(false);
    expect(bad((s) => (s.mode.kind = 'nope'))).toBe(false);
    expect(bad((s) => (s.seconds = -1))).toBe(false);
    expect(bad((s) => s.board.cells.pop())).toBe(false);
    expect(bad((s) => (s.board.cols = 10))).toBe(false);
    expect(bad((s) => (s.board.cells[0].adjacent = 7))).toBe(false);
    expect(bad((s) => (s.timeAttack = { remainingMs: 1, solved: 0 }))).toBe(false);
    const ta: Loose = roundTrip(toSession({ kind: 'timeAttack', level: 'beginner' }, startTimeAttack(1).board, 0, startTimeAttack(1)));
    expect(isMinesweeperSession(ta)).toBe(true);
    ta.timeAttack.remainingMs = 999999;
    expect(isMinesweeperSession(ta)).toBe(false);
    delete ta.timeAttack;
    expect(isMinesweeperSession(ta)).toBe(false);
  });
  it('rejects a time attack save whose board exploded (the state never holds one)', () => {
    let ta = taOpen(startTimeAttack(8), 40);
    const mine = ta.board.cells.findIndex((c) => c.mine);
    const exploded = openCell(ta.board, mine);
    expect(exploded.exploded).toBe(mine);
    ta = { ...ta, board: exploded };
    const saved = roundTrip(toSession({ kind: 'timeAttack', level: 'beginner' }, exploded, 12, ta));
    expect(isMinesweeperSession(saved)).toBe(false);
  });
});
