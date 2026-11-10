import { describe, expect, it } from 'vitest';
import { MODES, displayDims, modeDims } from './modes';

describe('MODES', () => {
  it('has the classic, hex and time attack dimensions', () => {
    expect(MODES.classic.beginner).toEqual({ cols: 9, rows: 9, mines: 10 });
    expect(MODES.classic.intermediate).toEqual({ cols: 16, rows: 16, mines: 40 });
    expect(MODES.classic.expert).toEqual({ cols: 30, rows: 16, mines: 99 });
    expect(MODES.hex.beginner).toEqual({ cols: 9, rows: 9, mines: 10 });
    expect(MODES.hex.intermediate).toEqual({ cols: 14, rows: 14, mines: 36 });
    expect(MODES.hex.expert).toEqual({ cols: 24, rows: 14, mines: 80 });
    expect(modeDims({ kind: 'timeAttack', level: 'beginner' })).toEqual(MODES.classic.beginner);
  });
  it('portrait swaps expert layout only', () => {
    expect(displayDims(MODES.classic.expert, true)).toEqual({ cols: 16, rows: 30, mines: 99 });
    expect(displayDims(MODES.classic.expert, false)).toEqual(MODES.classic.expert);
    expect(displayDims(MODES.classic.beginner, true)).toEqual(MODES.classic.beginner);
  });
});
