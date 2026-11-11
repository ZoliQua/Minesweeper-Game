# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-11-11

### Added
- Engine: square (8 neighbours) and hexagonal (odd-r offset rows, 6 neighbours) boards, seeded mine placement on the first open
  that avoids the clicked cell and its neighbours, flood fill, flags and chording.
- Modes: Classic (Beginner 9×9 / 10, Intermediate 16×16 / 40, Expert 30×16 / 99), Hexagonal (9×9 / 10, 14×14 / 36, 24×14 / 80)
  and Time attack (3 minutes of beginner boards, 150 points per cleared board, a mine costs 15 seconds and brings a new board).
- Scoring: `round(base × clamp(par / max(seconds, 1), 0.1, 1))` with base / par 1000 / 30 s, 3000 / 120 s, 6000 / 300 s; a loss
  scores 0. Runs are recorded once through the arcade kit (`win`, `loss`, or `over` for time attack).
- SVG board for both topologies: digits for numbers (colour only as a bonus), raised closed cells, a burst on the opened mine,
  every mine revealed and wrong flags crossed on a loss, remaining mines flagged on a win.
- Input: click opens, right-click / long-press (500 ms) / **F** flags, a click or double-click on a satisfied number chords;
  arrow keys move a focus ring in both topologies, **Space** / **Enter** open, **P** / **Esc** pause, **R** new game.
- Expert boards turn to portrait on a portrait phone (layout only; the focus keys follow the screen).
- Time attack feedback: a mine flashes the frame and shows “−15 s”, a cleared board shows “+150”.
- Mode switches and new games during a run ask first with an in-page card; the last mode (`minesweeper.mode`) and the
  last Classic / Hexagonal level (`minesweeper.level`) are remembered.
- Autosave & resume (`arcade.session.minesweeper`) with a strict validator (dimensions, numbers, mine count, exploded marker;
  time attack saves need time left and a board that has not exploded); a finished board is never restored.
- English, Hungarian (Aknakereső) and German, following the shared arcade language; numbers use the locale's grouping.
- Dental mode (shared `arcade.dental`, off by default, toggle in Settings): mines are decayed teeth and flags are toothbrushes;
  numbers are unchanged. Presentation only.
- `MinesweeperDemo` attract mode: a logic autopilot (sure moves from single numbers and number pairs, else the lowest-risk guess)
  on square and hex beginner boards; it writes nothing to storage.
- Vitest + Testing Library suite, `npm run check`, GitHub Actions CI, community files and a mine-and-flag favicon.
