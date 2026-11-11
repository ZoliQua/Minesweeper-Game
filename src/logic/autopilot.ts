import { isSolved, neighbours, openCell, toggleFlag } from './board';
import type { Board } from './types';

export type AutoMove = {
  kind: 'open' | 'flag';
  index: number;
  /** True when the move follows from the numbers; false for a guess. */
  sure: boolean;
};

type Constraint = { cells: number[]; need: number };

const isUnknown = (b: Board, i: number) => !b.cells[i]!.open && !b.cells[i]!.flag;

/** Every open number as "these unknown neighbours hold `need` mines" (assumes the flags are right). */
function constraints(b: Board): Constraint[] {
  const out: Constraint[] = [];
  b.cells.forEach((c, i) => {
    if (!c.open || c.adjacent === 0) return;
    const around = neighbours(b.topology, b.cols, b.rows, i);
    const cells = around.filter((k) => isUnknown(b, k));
    if (cells.length === 0) return;
    const flags = around.reduce((n, k) => n + (b.cells[k]!.flag ? 1 : 0), 0);
    out.push({ cells, need: c.adjacent - flags });
  });
  return out;
}

/** Sure moves: single-number rules first, then the subset rule over pairs of numbers. */
function deduce(cons: Constraint[]): AutoMove | null {
  for (const c of cons) if (c.need === 0) return { kind: 'open', index: c.cells[0]!, sure: true };
  for (const c of cons) if (c.need === c.cells.length) return { kind: 'flag', index: c.cells[0]!, sure: true };
  for (const a of cons) {
    const setA = new Set(a.cells);
    for (const b of cons) {
      if (a === b || b.cells.length <= a.cells.length) continue;
      if (!a.cells.every((k) => b.cells.includes(k))) continue;
      const rest = b.cells.filter((k) => !setA.has(k));
      if (b.need === a.need) return { kind: 'open', index: rest[0]!, sure: true };
      if (b.need - a.need === rest.length) return { kind: 'flag', index: rest[0]!, sure: true };
    }
  }
  return null;
}

/**
 * The demo's player: the centre first, then any move the numbers prove,
 * else the unknown cell with the lowest estimated risk (ties broken by `rng`).
 * Returns null once the board is decided.
 */
export function autoMove(b: Board, rng: () => number): AutoMove | null {
  if (b.exploded !== null || isSolved(b)) return null;
  if (!b.generated) return { kind: 'open', index: Math.floor(b.rows / 2) * b.cols + Math.floor(b.cols / 2), sure: true };
  const cons = constraints(b);
  const sure = deduce(cons);
  if (sure) return sure;

  const unknown = b.cells.flatMap((_, i) => (isUnknown(b, i) ? [i] : []));
  if (unknown.length === 0) return null;
  const flags = b.cells.reduce((n, c) => n + (c.flag ? 1 : 0), 0);
  const density = Math.max(0, b.mines - flags) / unknown.length;
  const risk = new Map<number, number>();
  for (const c of cons) {
    const p = c.need / c.cells.length;
    for (const k of c.cells) risk.set(k, Math.max(risk.get(k) ?? 0, p));
  }
  let best: number[] = [];
  let bestRisk = Infinity;
  for (const i of unknown) {
    const r = risk.get(i) ?? density;
    if (r < bestRisk - 1e-9) {
      bestRisk = r;
      best = [i];
    } else if (Math.abs(r - bestRisk) <= 1e-9) best.push(i);
  }
  return { kind: 'open', index: best[Math.floor(rng() * best.length)]!, sure: false };
}

/** Apply an autopilot move through the engine. */
export function autoStep(b: Board, move: AutoMove): Board {
  return move.kind === 'flag' ? toggleFlag(b, move.index) : openCell(b, move.index);
}
