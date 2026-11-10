import { describe, expect, it } from 'vitest';
import { chord, createBoard, isSolved, neighbours, openCell, toggleFlag } from './board';
import { mulberry32 } from './rng';
import type { Board } from './types';

const seeds = Array.from({ length: 100 }, (_, i) => i + 1);
const mineCount = (b: Board) => b.cells.filter((c) => c.mine).length;

describe('neighbours', () => {
  it('square corner has 3, edge 5, centre 8', () => {
    expect(neighbours('square', 5, 5, 0)).toHaveLength(3);
    expect(neighbours('square', 5, 5, 2)).toHaveLength(5);
    expect(neighbours('square', 5, 5, 12)).toHaveLength(8);
  });
  it('hex interior has 6 on even and odd rows', () => {
    expect(neighbours('hex', 7, 7, 3 * 7 + 3)).toHaveLength(6);
    expect(neighbours('hex', 7, 7, 2 * 7 + 3)).toHaveLength(6);
  });
  it('hex neighbours are valid, unique, symmetric, never self', () => {
    const cols = 6, rows = 5;
    for (let i = 0; i < cols * rows; i++) {
      const ns = neighbours('hex', cols, rows, i);
      expect(new Set(ns).size).toBe(ns.length);
      for (const n of ns) {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(cols * rows);
        expect(n).not.toBe(i);
        expect(neighbours('hex', cols, rows, n)).toContain(i);
      }
    }
  });
  it('hex corners contain no negative or out-of-range index and do not wrap', () => {
    expect(neighbours('hex', 7, 7, 0).sort()).toEqual([1, 7]);
    for (const i of [0, 6, 42, 48]) {
      for (const n of neighbours('hex', 7, 7, i)) expect(n >= 0 && n < 49).toBe(true);
    }
    expect(neighbours('hex', 7, 7, 7)).not.toContain(6); // odd row col 0 must not reach end of previous row
  });
});

describe('createBoard / generation', () => {
  it('places no mines until the first open', () => {
    const b = createBoard('square', 9, 9, 10, 1);
    expect(b.generated).toBe(false);
    expect(mineCount(b)).toBe(0);
  });
  it('Beginner first click always opens a 0 cell (100 seeds)', () => {
    for (const s of seeds) {
      const b = openCell(createBoard('square', 9, 9, 10, s), 40);
      expect(b.cells[40]!.adjacent).toBe(0);
      expect(b.cells[40]!.open).toBe(true);
      expect(b.exploded).toBeNull();
    }
  });
  it('hex first click also opens a 0 cell (100 seeds)', () => {
    for (const s of seeds) {
      const b = openCell(createBoard('hex', 12, 10, 15, s), 5 * 12 + 6);
      expect(b.cells[5 * 12 + 6]!.adjacent).toBe(0);
      expect(b.exploded).toBeNull();
    }
  });
  it('Expert corner first click never hits a mine (100 seeds)', () => {
    for (const s of seeds) {
      for (const corner of [0, 29, 30 * 15, 30 * 16 - 1]) {
        const b = openCell(createBoard('square', 30, 16, 99, s), corner);
        expect(b.exploded).toBeNull();
        expect(b.cells[corner]!.mine).toBe(false);
      }
    }
  });
  it('mine count equals the request, for both topologies', () => {
    for (const s of seeds.slice(0, 20)) {
      expect(mineCount(openCell(createBoard('square', 16, 16, 40, s), 3))).toBe(40);
      expect(mineCount(openCell(createBoard('hex', 14, 12, 30, s), 3))).toBe(30);
    }
  });
  it('adjacent matches neighbours', () => {
    for (const topology of ['square', 'hex'] as const) {
      const b = openCell(createBoard(topology, 10, 8, 14, 7), 11);
      b.cells.forEach((c, i) => {
        const n = neighbours(topology, 10, 8, i).filter((k) => b.cells[k]!.mine).length;
        expect(c.adjacent).toBe(n);
      });
    }
  });
  it('same seed gives the same board; different seed differs', () => {
    const a = openCell(createBoard('square', 16, 16, 40, 5), 100);
    const b = openCell(createBoard('square', 16, 16, 40, 5), 100);
    const c = openCell(createBoard('square', 16, 16, 40, 6), 100);
    expect(a).toEqual(b);
    expect(a.cells.map((x) => x.mine)).not.toEqual(c.cells.map((x) => x.mine));
  });
  it('too dense: avoids at least the clicked cell', () => {
    // 3x3 with 5 mines: 9-5=4 < 1+8 -> neighbours cannot all be safe
    for (const s of seeds) {
      const b = openCell(createBoard('square', 3, 3, 5, s), 4);
      expect(b.cells[4]!.mine).toBe(false);
      expect(mineCount(b)).toBe(5);
    }
    // exactly enough room keeps the whole neighbourhood safe: 9-0... 3x3 with 0 mines trivially; 4x4 corner
    const ok = openCell(createBoard('square', 4, 4, 12, 1), 0); // 4 safe = 1 + 3 neighbours
    expect(ok.cells.filter((c) => !c.mine)).toHaveLength(4);
    expect(ok.cells[0]!.adjacent).toBe(0);
  });
});

/** Hand-built board for deterministic rule tests. */
function manual(layout: string[], topology: 'square' = 'square'): Board {
  const rows = layout.length, cols = layout[0]!.length;
  const b = createBoard(topology, cols, rows, 0, 1);
  const cells = b.cells.map((c, i) => ({ ...c, mine: layout[Math.floor(i / cols)]![i % cols] === '*' }));
  cells.forEach((c, i) => {
    c.adjacent = neighbours(topology, cols, rows, i).filter((k) => cells[k]!.mine).length;
  });
  return { ...b, cells, generated: true, mines: cells.filter((c) => c.mine).length };
}

describe('flood fill', () => {
  it('opens the whole zero region and its border, nothing else', () => {
    const b = openCell(manual(['....*', '.....', '.....', '*....']), 12);
    const open = b.cells.map((c) => (c.open ? 1 : 0));
    // every non-mine cell is reachable here through zeros except none left closed
    b.cells.forEach((c, i) => {
      if (c.mine) expect(open[i]).toBe(0);
    });
    expect(b.cells[12]!.open).toBe(true);
    expect(b.cells[0]!.open).toBe(true); // far corner (adjacent 0) reached
    expect(b.cells[3]!.open).toBe(true); // border number next to mine
    expect(b.cells[3]!.adjacent).toBeGreaterThan(0);
  });
  it('does not pass through numbers', () => {
    const b = openCell(manual(['..*..', '..*..', '..*..']), 0);
    expect(b.cells[0]!.open && b.cells[1]!.open).toBe(true);
    expect(b.cells[3]!.open).toBe(false);
    expect(b.cells[4]!.open).toBe(false);
  });
  it('flagged cells are not opened by the flood', () => {
    let b = manual(['.....', '.....', '....*']);
    b = toggleFlag(b, 1);
    b = openCell(b, 10);
    expect(b.cells[1]!.open).toBe(false);
    expect(b.cells[1]!.flag).toBe(true);
  });
});

describe('hex flood fill', () => {
  it('opens a connected zero region and its numbered border, leaves mines closed', () => {
    let b = createBoard('hex', 9, 9, 6, 11);
    b = openCell(b, 4 * 9 + 4);
    expect(b.exploded).toBeNull();
    const open = b.cells.filter((c) => c.open).length;
    expect(open).toBeGreaterThan(7); // more than the clicked cell and its ring
    b.cells.forEach((c, i) => {
      if (c.mine) expect(c.open).toBe(false);
      if (c.open && c.adjacent === 0) {
        for (const n of neighbours('hex', 9, 9, i)) expect(b.cells[n]!.open).toBe(true);
      }
    });
  });
});

describe('open / flag', () => {
  it('opening a mine explodes and freezes the board', () => {
    const b = openCell(manual(['*..', '...', '...']), 0);
    expect(b.exploded).toBe(0);
    expect(openCell(b, 8)).toBe(b);
  });
  it('flag toggles on closed cells, not on open ones, and blocks opening', () => {
    let b = manual(['*..', '...', '...']);
    b = toggleFlag(b, 0);
    expect(b.cells[0]!.flag).toBe(true);
    expect(openCell(b, 0).exploded).toBeNull();
    expect(toggleFlag(b, 0).cells[0]!.flag).toBe(false);
    b = openCell(manual(['*..', '...', '...']), 8);
    expect(toggleFlag(b, 8)).toBe(b);
  });
  it('opening a flagged cell on a fresh board does not generate it', () => {
    let b = createBoard('square', 9, 9, 10, 3);
    b = toggleFlag(b, 40);
    const r = openCell(b, 40);
    expect(r).toBe(b);
    expect(r.generated).toBe(false);
  });
  it('is pure: input board is not mutated', () => {
    const b = createBoard('square', 9, 9, 10, 3);
    const snap = JSON.stringify(b);
    openCell(b, 0);
    toggleFlag(b, 1);
    expect(JSON.stringify(b)).toBe(snap);
  });
});

describe('chord', () => {
  const layout = ['*..', '...', '...'];
  it('opens unflagged neighbours when flags equal the number', () => {
    let b = openCell(manual(layout), 4); // number 1
    expect(b.cells[4]!.adjacent).toBe(1);
    b = toggleFlag(b, 0);
    b = chord(b, 4);
    expect(b.exploded).toBeNull();
    expect(b.cells.every((c) => c.mine || c.open)).toBe(true);
    expect(isSolved(b)).toBe(true);
  });
  it('explodes with a wrong flag', () => {
    let b = openCell(manual(layout), 4);
    b = toggleFlag(b, 1);
    b = chord(b, 4);
    expect(b.exploded).toBe(0);
  });
  it('does nothing with 1 flag against a number of 2', () => {
    let b = openCell(manual(['*.*', '...', '...']), 4);
    expect(b.cells[4]!.adjacent).toBe(2);
    b = toggleFlag(b, 0);
    expect(chord(b, 4)).toBe(b);
  });
  it('does nothing when the flag count differs, or on closed / zero cells', () => {
    const b = openCell(manual(layout), 4);
    expect(chord(b, 4)).toBe(b);
    const c = manual(layout);
    expect(chord(c, 4)).toBe(c);
    const z = openCell(manual(['...', '...', '..*']), 0);
    expect(chord(z, 0)).toBe(z);
  });
});

describe('isSolved', () => {
  it('is true exactly when all safe cells are open', () => {
    let b = manual(['*..', '...', '...']);
    expect(isSolved(b)).toBe(false);
    b = openCell(b, 8);
    expect(isSolved(b)).toBe(true);
    const partial = openCell(manual(['*.*', '...', '*.*']), 4);
    expect(isSolved(partial)).toBe(false);
    let full = partial;
    for (const i of [1, 3, 5, 7]) full = openCell(full, i);
    expect(isSolved(full)).toBe(true);
  });
  it('is false before generation and after an explosion', () => {
    expect(isSolved(createBoard('square', 3, 3, 0, 1))).toBe(false);
    expect(isSolved(openCell(manual(['*.']), 0))).toBe(false);
  });
});

describe('mulberry32', () => {
  it('is deterministic and in [0,1)', () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x >= 0 && x < 1).toBe(true);
    }
  });
});
