import { describe, expect, it } from 'vitest';
import { moveFocus } from './focus';

describe('moveFocus', () => {
  it('moves on the square grid and stops at the edges', () => {
    // 9 x 9, centre 40 = row 4, col 4
    expect(moveFocus(40, 'right', 9, 9, false)).toBe(41);
    expect(moveFocus(40, 'left', 9, 9, false)).toBe(39);
    expect(moveFocus(40, 'up', 9, 9, false)).toBe(31);
    expect(moveFocus(40, 'down', 9, 9, false)).toBe(49);
    expect(moveFocus(0, 'left', 9, 9, false)).toBe(0);
    expect(moveFocus(0, 'up', 9, 9, false)).toBe(0);
    expect(moveFocus(80, 'down', 9, 9, false)).toBe(80);
    expect(moveFocus(8, 'right', 9, 9, false)).toBe(8);
  });
  it('follows the screen when the board is shown rotated (rows become columns)', () => {
    // 30 x 16 board shown as 16 columns x 30 rows: screen right = next logical row
    expect(moveFocus(0, 'right', 30, 16, true)).toBe(30);
    expect(moveFocus(0, 'down', 30, 16, true)).toBe(1);
    expect(moveFocus(30, 'left', 30, 16, true)).toBe(0);
    expect(moveFocus(1, 'up', 30, 16, true)).toBe(0);
    expect(moveFocus(15 * 30, 'right', 30, 16, true)).toBe(15 * 30);
    expect(moveFocus(29, 'down', 30, 16, true)).toBe(29);
  });
  it('clamps a stale index into the board', () => {
    expect(moveFocus(500, 'left', 9, 9, false)).toBe(79);
    expect(moveFocus(-1, 'right', 9, 9, false)).toBe(1);
  });
});
