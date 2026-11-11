import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang, LANGS } from './arcade';
import { MESSAGES } from './i18n';
import { MinesweeperGame, RESULT_DELAY_MS } from './MinesweeperGame';
import { beginner, cell, key, openCount, safeCells, stateOf } from './test/minefield';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.25);
});
afterEach(() => {
  act(() => applyLang('en'));
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Minesweeper i18n', () => {
  it('has every key in en, hu and de with a non-empty value', () => {
    const keys = Object.keys(MESSAGES.en).sort();
    expect(keys.length).toBeGreaterThan(0);
    for (const lang of LANGS) {
      expect(Object.keys(MESSAGES[lang]).sort()).toEqual(keys);
      for (const k of keys) expect((MESSAGES[lang] as Record<string, string>)[k].trim()).not.toBe('');
    }
  });

  it('renders the German start card, modes and levels after applyLang("de")', () => {
    applyLang('de');
    render(<MinesweeperGame />);
    expect(screen.getByRole('dialog', { name: 'Minesweeper' }).textContent).toMatch(/Der erste Klick ist immer sicher/);
    expect(screen.getByRole('button', { name: 'Klassisch' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Sechseckig' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Zeitangriff' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Anfänger' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Fortgeschritten' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Experte' })).toBeTruthy();
    expect(screen.getByRole('group', { name: /^Minenfeld/ })).toBeTruthy();
  });

  it('uses the Hungarian game, mode and level names', () => {
    applyLang('hu');
    render(<MinesweeperGame />);
    expect(screen.getByRole('dialog', { name: 'Aknakereső' })).toBeTruthy();
    for (const name of ['Klasszikus', 'Hatszöges', 'Időre', 'Kezdő', 'Haladó', 'Mester']) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
  });

  it('switching to Hungarian mid-board keeps the board, the flags and the run', () => {
    const { container } = render(<MinesweeperGame />);
    act(() => key(' '));
    act(() => fireEvent.click(cell(container, 40)));
    const flagged = beginner().cells.findIndex((c) => !c.open);
    act(() => fireEvent.contextMenu(cell(container, flagged)));
    act(() => vi.advanceTimersByTime(2100));
    const opened = openCount(container);

    act(() => applyLang('hu'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(openCount(container)).toBe(opened);
    expect(stateOf(container, flagged)).toBe('flag');
    expect(screen.getByRole('status').textContent).toBe('Játékban');
    const stats = container.querySelector('.arc-stats')?.textContent ?? '';
    expect(stats).toMatch(/Aknák\s*9/);
    expect(stats).toContain('00:02');
    expect(cell(container, flagged).getAttribute('aria-label')).toMatch(/zászló$/);
  });

  it('formats the score with the language grouping', () => {
    applyLang('de');
    const { container } = render(<MinesweeperGame />);
    act(() => key(' '));
    act(() => fireEvent.click(cell(container, 40)));
    for (const i of safeCells(beginner())) {
      if (stateOf(container, i) === 'hidden') act(() => fireEvent.click(cell(container, i)));
    }
    act(() => vi.advanceTimersByTime(RESULT_DELAY_MS));
    expect(screen.getByRole('dialog', { name: 'Geräumt!' }).textContent).toMatch(/1\.000 Punkte/);
  });
});
