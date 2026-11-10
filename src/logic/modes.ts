import type { Topology } from './types';

export type Level = 'beginner' | 'intermediate' | 'expert';
export type ModeKind = 'classic' | 'hex' | 'timeAttack';

export interface Dims {
  cols: number;
  rows: number;
  mines: number;
}

export const LEVELS: readonly Level[] = ['beginner', 'intermediate', 'expert'];
export const MODE_KINDS: readonly ModeKind[] = ['classic', 'hex', 'timeAttack'];

export const MODES = {
  classic: {
    beginner: { cols: 9, rows: 9, mines: 10 },
    intermediate: { cols: 16, rows: 16, mines: 40 },
    expert: { cols: 30, rows: 16, mines: 99 },
  },
  hex: {
    beginner: { cols: 9, rows: 9, mines: 10 },
    intermediate: { cols: 14, rows: 14, mines: 36 },
    expert: { cols: 24, rows: 14, mines: 80 },
  },
  /** Beginner square boards, played against a clock. */
  timeAttack: { cols: 9, rows: 9, mines: 10 },
} as const satisfies Record<ModeKind, Record<Level, Dims> | Dims>;

export interface ModeSelection {
  kind: ModeKind;
  /** Always 'beginner' for time attack. */
  level: Level;
}

export function modeDims(sel: ModeSelection): Dims {
  return sel.kind === 'timeAttack' ? MODES.timeAttack : MODES[sel.kind][sel.level];
}

export function modeTopology(kind: ModeKind): Topology {
  return kind === 'hex' ? 'hex' : 'square';
}

/** Portrait phones show the expert 30x16 board as 16x30: layout swap only, same board. */
export function displayDims(dims: Dims, portrait: boolean): Dims {
  return portrait && dims.cols > dims.rows ? { ...dims, cols: dims.rows, rows: dims.cols } : dims;
}
