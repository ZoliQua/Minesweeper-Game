export type Direction = 'up' | 'down' | 'left' | 'right';

const DELTA: Record<Direction, readonly [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

/**
 * Move the keyboard focus one cell in screen space. `swapped` means the board
 * is shown rotated (logical rows are screen columns, see `displayDims`), so the
 * arrow keys keep following what the player sees. Works for square and hex
 * boards alike: hex rows are offset rows, so left/right stay in the row and
 * up/down keep the column index.
 */
export function moveFocus(index: number, dir: Direction, cols: number, rows: number, swapped: boolean): number {
  const total = cols * rows;
  const i = Math.min(total - 1, Math.max(0, index));
  const r = Math.floor(i / cols);
  const c = i % cols;
  const [dy, dx] = DELTA[dir];
  // Screen row / column and screen size.
  let sr = swapped ? c : r;
  let sc = swapped ? r : c;
  const screenRows = swapped ? cols : rows;
  const screenCols = swapped ? rows : cols;
  sr = Math.min(screenRows - 1, Math.max(0, sr + dy));
  sc = Math.min(screenCols - 1, Math.max(0, sc + dx));
  return swapped ? sc * cols + sr : sr * cols + sc;
}
