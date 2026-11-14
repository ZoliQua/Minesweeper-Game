import { chord, createBoard, isSolved, openCell, toggleFlag } from './board';
import { MODES } from './modes';
import { MAX_SCORE } from './scoring';
import type { Board } from './types';

export const TIME_ATTACK_MS = 180_000;
export const MINE_PENALTY_MS = 15_000;
export const POINTS_PER_BOARD = 150;

export interface TimeAttackState {
  remainingMs: number;
  solved: number;
  board: Board;
}

/** Deterministic next seed so a run is reproducible from its first seed. */
const nextSeed = (seed: number) => (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) + 1) >>> 0;

const fresh = (seed: number): Board => {
  const { cols, rows, mines } = MODES.timeAttack;
  return createBoard('square', cols, rows, mines, seed);
};

export function startTimeAttack(seed: number, remainingMs: number = TIME_ATTACK_MS): TimeAttackState {
  return { remainingMs, solved: 0, board: fresh(seed) };
}

export const isTimeUp = (s: TimeAttackState) => s.remainingMs <= 0;
export const timeAttackScore = (s: Pick<TimeAttackState, 'solved'>) =>
  Math.min(MAX_SCORE, POINTS_PER_BOARD * s.solved);

/** Advance the clock; never below 0. */
export function tick(s: TimeAttackState, elapsedMs: number): TimeAttackState {
  if (s.remainingMs <= 0 || !(elapsedMs > 0)) return s;
  return { ...s, remainingMs: Math.max(0, s.remainingMs - elapsedMs) };
}

/** Apply the result of a board action: solved => +1 and new board, mine => -15 s and new board. */
function settle(s: TimeAttackState, board: Board): TimeAttackState {
  if (board === s.board) return s;
  if (board.exploded !== null) {
    return { ...s, remainingMs: Math.max(0, s.remainingMs - MINE_PENALTY_MS), board: fresh(nextSeed(board.seed)) };
  }
  if (isSolved(board)) return { ...s, solved: s.solved + 1, board: fresh(nextSeed(board.seed)) };
  return { ...s, board };
}

export function taOpen(s: TimeAttackState, index: number): TimeAttackState {
  return isTimeUp(s) ? s : settle(s, openCell(s.board, index));
}
export function taChord(s: TimeAttackState, index: number): TimeAttackState {
  return isTimeUp(s) ? s : settle(s, chord(s.board, index));
}
export function taFlag(s: TimeAttackState, index: number): TimeAttackState {
  return isTimeUp(s) ? s : settle(s, toggleFlag(s.board, index));
}
