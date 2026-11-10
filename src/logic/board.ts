import { squareNeighbours } from './grid';
import { hexNeighbours } from './hex';
import { mulberry32 } from './rng';
import type { Board, Cell, Topology } from './types';

export function neighbours(topology: Topology, cols: number, rows: number, index: number): number[] {
  return topology === 'hex' ? hexNeighbours(cols, rows, index) : squareNeighbours(cols, rows, index);
}

const emptyCell = (): Cell => ({ mine: false, adjacent: 0, open: false, flag: false });

export function createBoard(topology: Topology, cols: number, rows: number, mines: number, seed: number): Board {
  const total = cols * rows;
  return {
    topology,
    cols,
    rows,
    mines: Math.max(0, Math.min(mines, total)),
    cells: Array.from({ length: total }, emptyCell),
    seed,
    generated: false,
    exploded: null,
  };
}

function nb(board: Board, index: number): number[] {
  return neighbours(board.topology, board.cols, board.rows, index);
}

/** Place mines (seeded), avoiding `index` and its neighbours when the board has room, else at least `index`. */
function generate(board: Board, index: number): Board {
  const total = board.cols * board.rows;
  const around = nb(board, index);
  const roomy = total - board.mines >= 1 + around.length;
  const banned = new Set<number>([index]);
  if (roomy) for (const n of around) banned.add(n);
  const pool: number[] = [];
  for (let i = 0; i < total; i++) if (!banned.has(i)) pool.push(i);
  const rng = mulberry32(board.seed);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const cells = board.cells.map((c) => ({ ...c, mine: false, adjacent: 0 }));
  for (const m of pool.slice(0, board.mines)) cells[m]!.mine = true;
  for (let i = 0; i < total; i++) {
    cells[i]!.adjacent = nb(board, i).reduce((n, k) => n + (cells[k]!.mine ? 1 : 0), 0);
  }
  return { ...board, cells, generated: true };
}

/** Open `start` (and flood zeros) in place on a cell copy. Returns the exploded index or null. */
function floodOpen(board: Board, cells: Cell[], start: number): number | null {
  const stack = [start];
  while (stack.length) {
    const i = stack.pop()!;
    const cell = cells[i]!;
    if (cell.open || cell.flag) continue;
    cells[i] = { ...cell, open: true };
    if (cell.mine) return i;
    if (cell.adjacent === 0) for (const n of nb(board, i)) stack.push(n);
  }
  return null;
}

export function openCell(board: Board, index: number): Board {
  if (board.exploded !== null || index < 0 || index >= board.cells.length) return board;
  let b = board;
  if (!b.generated) b = generate(b, index);
  const target = b.cells[index]!;
  if (target.open || target.flag) return b === board ? board : b;
  const cells = b.cells.slice();
  const hit = floodOpen(b, cells, index);
  return { ...b, cells, exploded: hit };
}

export function toggleFlag(board: Board, index: number): Board {
  if (board.exploded !== null || index < 0 || index >= board.cells.length) return board;
  const cell = board.cells[index]!;
  if (cell.open) return board;
  const cells = board.cells.slice();
  cells[index] = { ...cell, flag: !cell.flag };
  return { ...board, cells };
}

/** Chord an open number: if flags around it equal its count, open every unflagged neighbour. */
export function chord(board: Board, index: number): Board {
  if (board.exploded !== null || !board.generated) return board;
  const cell = board.cells[index];
  if (!cell || !cell.open || cell.adjacent === 0) return board;
  const around = nb(board, index);
  const flags = around.reduce((n, k) => n + (board.cells[k]!.flag ? 1 : 0), 0);
  if (flags !== cell.adjacent) return board;
  const cells = board.cells.slice();
  let exploded: number | null = null;
  for (const n of around) {
    const c = cells[n]!;
    if (c.open || c.flag) continue;
    const hit = floodOpen(board, cells, n);
    if (hit !== null && exploded === null) exploded = hit;
  }
  return exploded === null && cells.every((c, i) => c === board.cells[i]) ? board : { ...board, cells, exploded };
}

export function isSolved(board: Board): boolean {
  return board.generated && board.exploded === null && board.cells.every((c) => c.mine || c.open);
}
