# Minesweeper Game — CLAUDE.md

## Project Facts

* **Repository**: https://github.com/ZoliQua/Minesweeper-Game (package `minesweeper-game`)
* **Portal**: https://github.com/ZoliQua/Arcade-Game-Center — arcade id **`minesweeper`**; the same `src/` is mirrored into `Arcade-Game-Center/apps/minesweeper/`.
* **Stack**: React 18.3, Vite 5.4, TypeScript 5.6, CSS Modules on the shared arcade tokens. No other runtime dependencies.
* **Package manager**: npm. **Node**: >=20.
* **Scripts**: `dev`, `build` (`tsc -b && vite build`), `typecheck`, `lint`, `test` (Vitest, jsdom), `check` (lint → typecheck → test → build, same as CI).
* **Engine** (`src/logic/`, pure, no React): `types.ts`, `grid.ts` (square 8-neighbourhood), `hex.ts` (odd-r offset rows, 6 neighbours, no wrap),
  `board.ts` (`createBoard`, `openCell`, `toggleFlag`, `chord`, `isSolved`), `rng.ts` (`mulberry32`). Mines are placed on the first open, avoiding the clicked cell and its neighbours.
* **Languages**: en / hu / de through the kit's `useMessages`; dental mode via `useDental()`. Never colour-only meaning.
* **Communication**: respond to the user in **Hungarian** in chat, even though this file and the codebase are in English.

**Priority order**: correctness → truthfulness → verification → small diffs → maintainability → polish.

The vendored kit in `src/arcade/` is never edited here; change it in Arcade-Game-Center and sync.

---

## Git & Commit Rules

- Commit **only** as `Zoltán Dul <zoltan.dul@gmail.com>` (the global git identity).
- **Never** add `Co-Authored-By: Claude …`, "Generated with Claude Code" or any AI attribution
  to commit messages or pull-request descriptions.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
