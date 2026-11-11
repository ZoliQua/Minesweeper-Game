import { describe, expect, it } from 'vitest';
import { autoMove, autoStep } from './autopilot';
import { createBoard, isSolved, openCell } from './board';
import { mulberry32 } from './rng';
import type { Board } from './types';

/** Play a whole board with the autopilot; checks every sure move against the hidden truth. */
function playOut(board: Board, seed: number) {
  const rng = mulberry32(seed);
  let b = board;
  let sureMistakes = 0;
  for (let n = 0; n < 2000 && b.exploded === null && !isSolved(b); n += 1) {
    const move = autoMove(b, rng);
    if (!move) break;
    if (move.sure && b.generated) {
      const truth = b.cells[move.index]!.mine;
      if ((move.kind === 'open') === truth) sureMistakes += 1;
    }
    b = autoStep(b, move);
  }
  return { board: b, sureMistakes };
}

describe('autopilot', () => {
  it('opens the centre of a fresh board', () => {
    expect(autoMove(createBoard('square', 9, 9, 10, 1), mulberry32(1))).toEqual({ kind: 'open', index: 40, sure: true });
  });

  it('opens a cell that a satisfied number proves safe', () => {
    // One row: [flag][1][?]: the 1 already has its flag, so index 2 is safe.
    let b = createBoard('square', 3, 1, 1, 7);
    b = {
      ...b,
      generated: true,
      cells: [
        { mine: true, adjacent: 0, open: false, flag: true },
        { mine: false, adjacent: 1, open: true, flag: false },
        { mine: false, adjacent: 0, open: false, flag: false },
      ],
    };
    expect(autoMove(b, mulberry32(1))).toEqual({ kind: 'open', index: 2, sure: true });
  });

  it('flags a cell that a number proves to be a mine', () => {
    // One row: [1][?][?]: the 1 has a single unknown neighbour, so index 1 is a mine.
    let b = createBoard('square', 3, 1, 1, 7);
    b = {
      ...b,
      generated: true,
      cells: [
        { mine: false, adjacent: 1, open: true, flag: false },
        { mine: true, adjacent: 0, open: false, flag: false },
        { mine: false, adjacent: 1, open: false, flag: false },
      ],
    };
    expect(autoMove(b, mulberry32(1))).toEqual({ kind: 'flag', index: 1, sure: true });
  });

  it('never gets a sure move wrong and clears many boards, square and hex', () => {
    let wins = 0;
    let mistakes = 0;
    for (let seed = 1; seed <= 30; seed += 1) {
      const topology = seed % 2 === 0 ? 'hex' : 'square';
      const r = playOut(createBoard(topology, 9, 9, 10, seed * 7919), seed);
      mistakes += r.sureMistakes;
      if (isSolved(r.board)) wins += 1;
      else expect(r.board.exploded).not.toBeNull(); // it only stops on a result
    }
    expect(mistakes).toBe(0);
    expect(wins).toBeGreaterThanOrEqual(15);
  });

  it('autoStep applies opens and flags through the engine', () => {
    const b = createBoard('square', 9, 9, 10, 3);
    const opened = autoStep(b, { kind: 'open', index: 40, sure: true });
    expect(opened).toEqual(openCell(b, 40));
    const flagIndex = opened.cells.findIndex((c) => !c.open);
    expect(autoStep(opened, { kind: 'flag', index: flagIndex, sure: false }).cells[flagIndex]!.flag).toBe(true);
  });
});
