import type { Level } from './modes';

/** Overall cap: classic tops out at 6000 (expert), time attack is clamped to 12000. */
export const MAX_SCORE = 12000;

/** Base points and par seconds per level (hex uses the same table). */
export const SCORE_TABLE: Record<Level, { base: number; par: number }> = {
  beginner: { base: 1000, par: 30 },
  intermediate: { base: 3000, par: 120 },
  expert: { base: 6000, par: 300 },
};

/** round(base * clamp(par / max(seconds, 1), 0.1, 1)) */
export function classicScore(level: Level, seconds: number): number {
  const { base, par } = SCORE_TABLE[level];
  const f = Math.min(1, Math.max(0.1, par / Math.max(seconds, 1)));
  return Math.round(base * f);
}
