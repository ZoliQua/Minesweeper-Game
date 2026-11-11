import { useEffect, useRef, useState } from 'react';
import { useDental, type ArcadeDemoProps } from '../arcade';
import { Board } from '../components/Board';
import { autoMove, autoStep } from '../logic/autopilot';
import { createBoard } from '../logic/board';
import { mulberry32 } from '../logic/rng';
import type { Board as BoardState, Topology } from '../logic/types';

export const DEMO_MOVE_MS = 160;
export const DEMO_RESTART_MS = 1600;

const demoBoard = (topology: Topology, rng: () => number): BoardState =>
  createBoard(topology, 9, 9, 10, Math.floor(rng() * 0x1_0000_0000) >>> 0);

/**
 * Attract mode for the portal landing page: the logic autopilot plays the real
 * engine on beginner boards, alternating square and hexagonal cells. It opens
 * what the numbers prove safe, flags what they prove to be mines and otherwise
 * guesses the lowest-risk cell. No input, no stats, no saves; frozen while
 * `active` is false.
 */
export function MinesweeperDemo({ active = true }: ArcadeDemoProps) {
  const rngRef = useRef<() => number>();
  if (!rngRef.current) rngRef.current = mulberry32((Date.now() ^ 0x5eed) >>> 0);
  const [round, setRound] = useState(0);
  const [board, setBoard] = useState(() => demoBoard('square', rngRef.current as () => number));
  const [dental] = useDental();
  const done = board.exploded !== null || autoMove(board, () => 0) === null;

  useEffect(() => {
    if (!active) return;
    const rng = rngRef.current as () => number;
    const id = window.setTimeout(
      () => {
        if (done) {
          const next = round + 1;
          setRound(next);
          setBoard(demoBoard(next % 2 === 0 ? 'square' : 'hex', rng));
          return;
        }
        setBoard((b) => {
          const move = autoMove(b, rng);
          return move ? autoStep(b, move) : b;
        });
      },
      done ? DEMO_RESTART_MS : DEMO_MOVE_MS,
    );
    return () => window.clearTimeout(id);
  }, [active, board, done, round]);

  return (
    <div className="arc-demo" aria-hidden="true">
      <Board board={board} dental={dental} variant="mini" />
    </div>
  );
}

export default MinesweeperDemo;
