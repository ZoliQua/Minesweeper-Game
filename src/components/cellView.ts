import type { Board as BoardState, Cell } from '../logic/types';

/** What a cell shows; also exposed as `data-state` for tests and styling. */
export type CellView = 'hidden' | 'flag' | 'open' | 'mine' | 'exploded' | 'wrong';

/**
 * Cell view after the rules: a lost board shows every mine (and crosses wrong
 * flags); a won board flags the remaining mines.
 */
export function cellView(board: BoardState, cell: Cell, won: boolean): CellView {
  const lost = board.exploded !== null;
  if (cell.open && cell.mine) return 'exploded';
  if (lost && cell.mine && !cell.flag) return 'mine';
  if (lost && cell.flag && !cell.mine) return 'wrong';
  if (cell.flag || (won && cell.mine)) return 'flag';
  return cell.open ? 'open' : 'hidden';
}
