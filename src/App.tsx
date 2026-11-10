import { ArcadeShell } from './arcade';
import { MinesweeperGame } from './MinesweeperGame';

export default function App() {
  return (
    <ArcadeShell gameId="minesweeper">
      <MinesweeperGame />
    </ArcadeShell>
  );
}
