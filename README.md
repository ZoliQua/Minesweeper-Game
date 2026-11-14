# 💣 Minesweeper

A type-safe Minesweeper built with **React 18**, **Vite** and **TypeScript**: open the field, flag the mines, never guess more
than you must. Three ways to play: **Classic** square boards, **Hexagonal** cells with six neighbours, and **Time attack**
(as many beginner boards as you can clear in three minutes). The first click is always safe, numbers are drawn as digits
(colour is only a bonus) and the boards are seeded, so the engine is fully testable.
Runs on its own **and** as one of the fourteen games of **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)**:
play it at [dulzoltan.hu/arcade/#/play/minesweeper](https://dulzoltan.hu/arcade/#/play/minesweeper).

[![CI](https://github.com/ZoliQua/Minesweeper-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Minesweeper-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Table of contents

- [The Zoltan's Arcade family](#%EF%B8%8F-the-zoltans-arcade-family)
- [Features](#-features)
- [Quick start](#-quick-start)
- [Modes](#-modes)
- [Controls](#%EF%B8%8F-controls)
- [Scoring & stats](#-scoring--stats)
- [Autosave & resume](#-autosave--resume)
- [Embedding in Arcade-Game-Center](#-embedding-in-arcade-game-center)
- [Scripts](#-scripts)
- [Architecture](#%EF%B8%8F-architecture)
- [Contributing](#-contributing)
- [License](#%EF%B8%8F-license)

## 🕹️ The Zoltan's Arcade family

Every game is a standalone repo that also plugs into the portal. They share one design system, one scoring model and one save format through the vendored [`src/arcade/`](./src/arcade) kit.

| Game | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | All games in one place, live demos, stats, leaderboard |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Maze |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategy |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duel |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Paddle |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duel |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sorting |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Cards |
| 💣 **Minesweeper** (this repo) | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logic |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Cards |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Cards |

## ✨ Features

- 💣 **Three modes**: Classic (Beginner 9×9 / 10, Intermediate 16×16 / 40, Expert 30×16 / 99), Hexagonal (9×9 / 10, 14×14 / 36,
  24×14 / 80) and Time attack (3 minutes of beginner boards)
- ⬡ **Real hex boards**: odd-r offset rows drawn as SVG polygons, six neighbours, flood fill and chording on hexes too
- 🛟 **Safe first click**: mines are placed after the first open, never on the clicked cell or its neighbours, so it always opens an area
- 🚩 **Flags and chords**: right-click, long-press (500 ms) or **F** flags; a click (or double-click) on a number whose flags are all placed opens its other neighbours
- 💥 **Honest endings**: a loss reveals every mine and crosses wrong flags; a win flags the remaining mines
- ⏱️ **Time attack feedback**: a mine flashes the frame and shows **−15 s**, a cleared board shows **+150**, and a fresh board follows at once
- 👁️ **Colour-blind friendly**: numbers are digits, closed cells have a raised inner edge, the opened mine has a burst, wrong flags a cross; colour is never the only cue
- 📱 **Phone-friendly**: the expert boards (square and hex) turn to portrait (16×30, 14×24) on a portrait phone; long-press flags
- 🏆 **Unified arcade scoring**: a finished run is recorded once; Best, plays and wins are shared with the portal
- ⏸️ **Pause** (P / Esc, or automatically when the tab is hidden) freezes the board and the clock
- 💾 **Autosave & resume**: the board survives reloads and tab closes
- 🌗 **Dark / light theme** shared with every arcade game (press **T**)
- 🌍 **Three languages**: English, Hungarian (Aknakereső) and German; switch in the top bar or in the settings (also `?lang=en|hu|de` for link hand-off); numbers follow the locale's grouping
- 🦷 **Dental mode**: a „Fogas mód” / "Dental mode" / „Zahnmodus” toggle in the settings, off by default (or `?dental=1`), shared across the whole arcade: mines are decayed teeth and flags are toothbrushes; numbers stay digits; presentation only
- 🤖 **Attract-mode demo** (`<MinesweeperDemo />`): a logic autopilot plays square and hex beginner boards, opening what the numbers prove safe and guessing the lowest-risk cell otherwise
- ⌨️ **Keyboard-first and accessible**: arrow keys move a focus ring in both topologies, every cell has a label (`Row 3, column 5: 2`)
- 🧪 **Tested**: engine (square and hex), modes, scoring, time attack, the save validator, focus movement, the autopilot, the demo and component behaviour

## 🚀 Quick start

Requires **Node ≥ 20** and npm.

```bash
git clone https://github.com/ZoliQua/Minesweeper-Game.git
cd Minesweeper-Game
npm install
npm run dev          # http://localhost:5173
```

Production build: `npm run build && npm run preview`. The build uses relative asset paths, so `dist/` can be served from any sub-folder.

## 💣 Modes

| Mode | Level | Board | Mines |
| --- | --- | --- | --- |
| Classic | Beginner / Intermediate / Expert | 9×9 / 16×16 / 30×16 | 10 / 40 / 99 |
| Hexagonal | Beginner / Intermediate / Expert | 9×9 / 14×14 / 24×14 | 10 / 36 / 80 |
| Time attack | Beginner boards | 9×9 | 10 |

- **Classic and Hexagonal**: clear every safe cell. The clock starts with the first open. Opening a mine ends the run.
- **Time attack**: 3:00 on the clock from Start. Every cleared board scores and a new one follows; a mine costs **15 seconds**
  and also brings a new board. The run ends when the clock reaches zero.
- Switching the mode or starting a new game while a run is in progress asks first, in the page; the abandoned run is not scored.
  Your last mode is remembered (`minesweeper.mode`), and so is your Classic / Hexagonal level when you come back from
  Time attack (`minesweeper.level`).

## ⌨️ Controls

| Input | Action |
| --- | --- |
| 🖱️ Click / tap | Open a cell; on a number whose flags are all placed: open its other neighbours (chord) |
| 🖱️ Right-click / long-press (500 ms) | Flag / unflag |
| 🖱️ Double-click a number | Chord |
| **← → ↑ ↓** | Move the focus ring (follows the screen when the board is rotated) |
| **Space** / **Enter** | Open (or chord) the focused cell · start · resume · play again |
| **F** | Flag the focused cell |
| **P** / **Esc** | Pause / resume |
| **R** | New game (asks first during a run) |
| **T** | Toggle dark / light theme (standalone page) |

Hotkeys are ignored while you type in a form field or hold Cmd/Ctrl/Alt.

## 🎯 Scoring & stats

Classic and Hexagonal, for a cleared board (a loss scores 0 and is recorded as a `loss`):

```
score = round(base × clamp(par / max(seconds, 1), 0.1, 1))
```

| Level | Base | Par |
| --- | --- | --- |
| Beginner | 1 000 | 30 s |
| Intermediate | 3 000 | 120 s |
| Expert | 6 000 | 300 s |

Time attack: **150 points per cleared board**, capped at 12 000, recorded with outcome `over`. The arcade-wide score cap for
Minesweeper is 12 000 (a classic run tops out at 6 000).

The stat strip shows **Score**, **Best**, **Mines** left (mines − flags) and **Time**; in time attack **Boards** and **Time left**.
Every finished run is recorded by the kit under `arcade.stats.minesweeper` (`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, …).

## 💾 Autosave & resume

The session is the mode, the whole board (mines, numbers, opened and flagged cells), the play time and, in time attack, the time
left and the boards cleared (key `arcade.session.minesweeper`, schema-versioned). A strict validator rejects anything inconsistent:
dimensions that do not match the mode, numbers that do not match the mines, a wrong mine count, an exploded marker that does not
match, or a time attack save with an exploded board or no time left. A classic or hexagonal board is saved from its first open on (a fresh board holds no mines yet). It is saved about once a second, whenever the page is hidden
and when the game unmounts. Reloading shows **Welcome back** with the run paused. A finished board is never restored, so it
can never be recorded twice; **Discard** next to the *Autosaved* badge drops the save.

## 🧩 Embedding in Arcade-Game-Center

```tsx
import { MinesweeperGame, MinesweeperDemo } from '@arcade/minesweeper';

<MinesweeperGame
  embedded                                   // hide the page title; the portal shows it
  onGameOver={(score) => submitScore('minesweeper', score)}  // finished runs with points > 0
  onRunEnd={(run) => console.log(run.outcome, run.score)}    // every finished run
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<MinesweeperDemo active={cardIsVisible} />  // landing-page attract mode
```

Both components follow the shared `ArcadeGameProps` / `ArcadeDemoProps` contract from `src/arcade/types.ts`.
Status mapping: `idle` before the first run of a visit (Start card), `running` while a board is played, `paused` while suspended
(or restored, or while the in-page confirmation is open), `gameOver` once the run has a result.

## 🧪 Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logic + component tests) |
| `npm run check` | lint → typecheck → test → build (what CI runs) |

## 🏗️ Architecture

```
src/
  arcade/                 vendored Zoltan's Arcade kit — do not edit here (see its README)
  logic/                  pure game rules, no React
    types.ts grid.ts hex.ts  cells, square 8-neighbourhood, odd-r hex 6-neighbourhood
    board.ts              createBoard, openCell (safe first click, flood fill), toggleFlag, chord, isSolved
    modes.ts              MODES, modeDims, displayDims (portrait rotation)
    scoring.ts            classicScore, MAX_SCORE
    timeAttack.ts         3-minute run: tick, taOpen / taChord / taFlag, timeAttackScore
    session.ts            save shape and its strict validator
    focus.ts              arrow-key focus in screen space
    autopilot.ts          the demo's logic player (sure moves, then lowest risk)
    rng.ts seed.ts        mulberry32, fresh seeds
  components/             Board (SVG square + hex), ModeSelect, DentalToggle
  demo/MinesweeperDemo.tsx  landing-page attract mode
  MinesweeperGame.tsx     the embeddable game (ArcadeGameProps)
  i18n.ts                 en / hu / de strings
  App.tsx                 standalone page: <ArcadeShell><MinesweeperGame/></ArcadeShell>
  main.tsx                entry; loads the shared arcade.css once
  index.ts                package entry used by Arcade-Game-Center
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), the [Code of Conduct](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).
Contributors are listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md); changes in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ License

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Made with ❤️ by Zoltán Dul · part of <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
