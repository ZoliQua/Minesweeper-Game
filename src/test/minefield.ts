import { fireEvent } from '@testing-library/react';
import { createBoard, openCell } from '../logic/board';
import { randomSeed } from '../logic/seed';
import type { Board } from '../logic/types';

/** Helpers for component tests: `Math.random` is stubbed, so the game's minefield can be rebuilt here. */
export const key = (k: string) => fireEvent.keyDown(window, { key: k });
export const cell = (c: HTMLElement, i: number) => {
  const el = c.querySelector(`[data-i="${i}"]`);
  if (!el) throw new Error(`no cell ${i}`);
  return el;
};
export const stateOf = (c: HTMLElement, i: number) => cell(c, i).getAttribute('data-state');
export const openCount = (c: HTMLElement) => c.querySelectorAll('[data-state="open"]').length;
/** The beginner minefield the game builds after a first click on `first`. */
export const beginner = (first = 40): Board => openCell(createBoard('square', 9, 9, 10, randomSeed()), first);
export const safeCells = (b: Board) => b.cells.flatMap((c, i) => (c.mine ? [] : [i]));
export const mineCells = (b: Board) => b.cells.flatMap((c, i) => (c.mine ? [i] : []));
