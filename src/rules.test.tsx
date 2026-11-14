import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber } from './arcade';
import { MinesweeperGame } from './MinesweeperGame';
import { neighbours } from './logic/board';
import { LEVELS, MODES } from './logic/modes';
import { classicScore, MAX_SCORE, SCORE_TABLE } from './logic/scoring';
import { MINE_PENALTY_MS, POINTS_PER_BOARD, TIME_ATTACK_MS } from './logic/timeAttack';
import { cell, key, openCount } from './test/minefield';
import { setCoarsePointer } from './test/touchEnv';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.25);
  setCoarsePointer(false);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  applyLang('en', { silent: true });
});

const hu = (n: number) => formatNumber(n, 'hu');
const openRules = () => fireEvent.click(screen.getByRole('button', { name: /Szabályok/ }));
const dialog = () => screen.getByRole('dialog', { name: /szabályok/ });
const headings = () =>
  within(dialog())
    .getAllByRole('heading', { level: 3 })
    .map((h) => h.textContent);
const LEVEL_HU = { beginner: 'Kezdő', intermediate: 'Haladó', expert: 'Mester' } as const;

describe('Minesweeper rules dialog', () => {
  it('shows a Rules button; opening mid-run pauses and closing leaves it paused', () => {
    const onStatusChange = vi.fn();
    const { container } = render(<MinesweeperGame onStatusChange={onStatusChange} />);
    expect(screen.getByRole('button', { name: /Szabályok/ })).toBeTruthy();
    act(() => key(' '));
    act(() => fireEvent.click(cell(container, 40)));
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
    openRules();
    expect(screen.getByRole('dialog', { name: 'Aknakereső — szabályok' })).toBeTruthy();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bezárás' }));
    expect(screen.getByRole('dialog', { name: 'Szünet' })).toBeTruthy();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
  });

  it('keeps R for a new game: the Rules dialog has no R hotkey', () => {
    render(<MinesweeperGame />);
    expect(screen.getByRole('button', { name: /Szabályok/ }).getAttribute('aria-keyshortcuts')).toBeNull();
    act(() => key('r'));
    expect(screen.queryByRole('dialog', { name: /szabályok/ })).toBeNull();
  });

  it('lists goal, play, rules, scoring, dental in order; mobile only on touch, with the touch rows', () => {
    const { unmount } = render(<MinesweeperGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód']);
    expect(dialog().textContent).toContain('jobb klikkel vagy F-fel zászlót tűzöl');
    unmount();
    setCoarsePointer(true);
    render(<MinesweeperGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód', 'Mobilon']);
    const text = dialog().textContent ?? '';
    expect(text).toContain('Koppints egy mezőre a felfedéséhez');
    expect(text).toContain('Koppintás: felfedi a mezőt (vagy egy kész szám körül a többit).');
    expect(text).toContain('Hosszú érintés: zászlót tűz ki vagy vesz le.');
    expect(text).toContain('Zászló gomb: amíg be van kapcsolva, a koppintás zászlót tűz, a hosszú érintés felfed.');
    expect(text).toContain('Nagy tábla: a keretén belül húzással mozoghatsz rajta, az oldal közben áll.');
    expect(text).toContain('Teljes képernyő gomb: a játék kitölti az egész képernyőt.');
  });

  it('prints every scoring number from the real scoring helpers', () => {
    render(<MinesweeperGame />);
    openRules();
    const text = dialog().textContent ?? '';
    for (const level of LEVELS) {
      const { par } = SCORE_TABLE[level];
      expect(text).toContain(
        `${LEVEL_HU[level]}: ${hu(classicScore(level, par))} pont ${hu(par)} másodpercig, ` +
          `${hu(par * 2)} másodpercnél ${hu(classicScore(level, par * 2))} pont, ` +
          `de legalább ${hu(classicScore(level, Number.MAX_SAFE_INTEGER))} pont.`,
      );
    }
    expect(text).toContain(
      `Időre: megoldott táblánként ${hu(POINTS_PER_BOARD)} pont, legfeljebb ${hu(MAX_SCORE)} pont ` +
        `(${hu(MAX_SCORE / POINTS_PER_BOARD)} tábla). Ha idő előtt befejezed, az addig gyűjtött pontjaid kerülnek a ranglistára.`,
    );
    expect(text).toContain('Aknára lépve 0 pontot kapsz, és ennyit ér az idő előtt befejezett klasszikus vagy hatszögletű tábla is.');
    expect(text).toContain(
      `Időre: ${hu(TIME_ATTACK_MS / 60_000)} percen át kezdő táblák. Egy megoldott tábla után jön a következő; ` +
        `egy akna ${hu(MINE_PENALTY_MS / 1000)} másodpercbe kerül, és új táblát hoz.`,
    );
    const size = (d: { cols: number; rows: number; mines: number }) => `${hu(d.cols)} × ${hu(d.rows)}, ${hu(d.mines)} aknával`;
    expect(text).toContain(
      `Klasszikus: Kezdő ${size(MODES.classic.beginner)}; Haladó ${size(MODES.classic.intermediate)}; Mester ${size(MODES.classic.expert)}.`,
    );
    expect(text).toContain(
      `Hatszögletű: Kezdő ${size(MODES.hex.beginner)}; Haladó ${size(MODES.hex.intermediate)}; Mester ${size(MODES.hex.expert)}.`,
    );
    const most = (t: 'square' | 'hex') => hu(neighbours(t, 5, 5, 12).length);
    expect(text).toContain(`négyzetes táblán legfeljebb ${most('square')}, hatszögletűn legfeljebb ${most('hex')}.`);
  });

  it('the time-attack hints show the real clock and penalty', () => {
    render(<MinesweeperGame />);
    fireEvent.click(screen.getByRole('button', { name: 'Időre' }));
    expect(screen.getByRole('dialog', { name: 'Aknakereső' }).textContent).toContain(
      `Oldj meg annyi kezdő táblát, amennyit csak tudsz ${hu(TIME_ATTACK_MS / 60_000)} perc alatt. Minden akna ${hu(MINE_PENALTY_MS / 1000)} másodpercbe kerül.`,
    );
    expect(screen.getByText(/^Kezdő táblák/).textContent).toBe(
      `Kezdő táblák ${hu(TIME_ATTACK_MS / 60_000)} percig: táblánként ${hu(POINTS_PER_BOARD)} pont, egy akna ${hu(MINE_PENALTY_MS / 1000)} másodpercbe kerül.`,
    );
  });

  it('has a described number diagram that follows dental mode', () => {
    const { unmount } = render(<MinesweeperGame />);
    openRules();
    const img = within(dialog()).getByRole('img', { name: /Ábra/ });
    expect(img.getAttribute('aria-label')).toBe(
      'Ábra: egy felfedett mező, rajta 2, körülötte 8 fedett szomszéd; közülük 2 alatt akna van, ezeket aknajel mutatja.',
    );
    expect(img.querySelectorAll('[data-testid="ms-mine"]')).toHaveLength(2);
    expect(img.textContent).toContain('2');
    expect(dialog().textContent).toContain('A 2 a körülötte lévő 2 aknát számolja, így a többi 6 szomszéd biztonságos.');
    unmount();
    applyDental(true, { silent: true });
    render(<MinesweeperGame />);
    openRules();
    const tooth = within(dialog()).getByRole('img', { name: /Ábra/ });
    expect(tooth.getAttribute('aria-label')).toContain('szuvas fog');
    expect(tooth.querySelectorAll('[data-testid="ms-mine-tooth"]')).toHaveLength(2);
  });

  it('keeps the run when the language changes inside the rules', () => {
    const { container } = render(<MinesweeperGame />);
    act(() => key(' '));
    act(() => fireEvent.click(cell(container, 40)));
    const opened = openCount(container);
    openRules();
    act(() => applyLang('de'));
    expect(screen.getByRole('heading', { level: 2, name: 'Minesweeper — Regeln' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Ziel' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(screen.getByRole('dialog', { name: 'Pausiert' })).toBeTruthy();
    expect(openCount(container)).toBe(opened);
  });
});
