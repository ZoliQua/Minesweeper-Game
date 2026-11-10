import { neighbours } from './board';
import { LEVELS, MODE_KINDS, modeDims, modeTopology, type ModeSelection } from './modes';
import { TIME_ATTACK_MS, type TimeAttackState } from './timeAttack';
import type { Board } from './types';

export const SESSION_SCHEMA = 1;

export interface SavedTimeAttack {
  remainingMs: number;
  solved: number;
}

export interface MinesweeperSession {
  v: 1;
  mode: ModeSelection;
  board: Board;
  seconds: number;
  timeAttack?: SavedTimeAttack;
}

const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNonNegInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

function isBoardFor(v: unknown, mode: ModeSelection): v is Board {
  if (!isRec(v)) return false;
  const dims = modeDims(mode);
  const topology = modeTopology(mode.kind);
  if (v.topology !== topology || v.cols !== dims.cols || v.rows !== dims.rows || v.mines !== dims.mines) return false;
  if (!isNonNegInt(v.seed) || typeof v.generated !== 'boolean') return false;
  const total = dims.cols * dims.rows;
  if (!Array.isArray(v.cells) || v.cells.length !== total) return false;
  if (!(v.exploded === null || (isNonNegInt(v.exploded) && v.exploded < total))) return false;
  let mines = 0;
  for (let i = 0; i < total; i++) {
    const c: unknown = v.cells[i];
    if (!isRec(c)) return false;
    if (typeof c.mine !== 'boolean' || typeof c.open !== 'boolean' || typeof c.flag !== 'boolean') return false;
    if (!isNonNegInt(c.adjacent) || c.adjacent > 8) return false;
    if (c.open && c.flag) return false;
    if (c.mine) mines++;
  }
  const cells = v.cells as Board['cells'];
  if (!v.generated) {
    return mines === 0 && v.exploded === null && cells.every((c) => !c.open && c.adjacent === 0);
  }
  if (mines !== dims.mines) return false;
  for (let i = 0; i < total; i++) {
    const expected = neighbours(topology, dims.cols, dims.rows, i).filter((k) => cells[k]!.mine).length;
    if (cells[i]!.adjacent !== expected) return false;
  }
  const openedMines = cells.flatMap((c, i) => (c.mine && c.open ? [i] : []));
  if (v.exploded === null ? openedMines.length > 0 : openedMines.length !== 1 || openedMines[0] !== v.exploded) {
    return false;
  }
  return true;
}

export function isMinesweeperSession(v: unknown): v is MinesweeperSession {
  if (!isRec(v) || v.v !== 1 || !isRec(v.mode)) return false;
  const { kind, level } = v.mode;
  if (!MODE_KINDS.includes(kind as never) || !LEVELS.includes(level as never)) return false;
  const mode = v.mode as unknown as ModeSelection;
  if (mode.kind === 'timeAttack' && mode.level !== 'beginner') return false;
  if (typeof v.seconds !== 'number' || !Number.isFinite(v.seconds) || v.seconds < 0) return false;
  if (!isBoardFor(v.board, mode)) return false;
  if (mode.kind === 'timeAttack') {
    const t = v.timeAttack;
    if (!isRec(t) || !isNonNegInt(t.solved)) return false;
    if (typeof t.remainingMs !== 'number' || !Number.isFinite(t.remainingMs)) return false;
    if (t.remainingMs <= 0 || t.remainingMs > TIME_ATTACK_MS) return false;
    return true;
  }
  return v.timeAttack === undefined;
}

export function toSession(mode: ModeSelection, board: Board, seconds: number, ta?: TimeAttackState): MinesweeperSession {
  const s: MinesweeperSession = { v: 1, mode, board, seconds };
  if (ta) s.timeAttack = { remainingMs: ta.remainingMs, solved: ta.solved };
  return s;
}

/** Resume a time attack run: keeps the saved remaining time and solved count. */
export function restoreTimeAttack(s: MinesweeperSession): TimeAttackState | null {
  if (s.mode.kind !== 'timeAttack' || !s.timeAttack) return null;
  return { remainingMs: s.timeAttack.remainingMs, solved: s.timeAttack.solved, board: s.board };
}
