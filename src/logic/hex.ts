/** Hex board, "odd-r" offset layout (odd rows shifted right): 6 neighbours, no wrap. */
const EVEN_ROW: ReadonlyArray<readonly [number, number]> = [
  [0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0],
];
const ODD_ROW: ReadonlyArray<readonly [number, number]> = [
  [0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1],
];

export function hexNeighbours(cols: number, rows: number, index: number): number[] {
  const r = Math.floor(index / cols);
  const c = index % cols;
  const out: number[] = [];
  for (const [dr, dc] of r % 2 === 0 ? EVEN_ROW : ODD_ROW) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(nr * cols + nc);
  }
  return out;
}
