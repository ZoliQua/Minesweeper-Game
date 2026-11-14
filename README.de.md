# 💣 Minesweeper

[English](README.md) · **Deutsch** · [Magyar](README.hu.md)

Ein typsicheres Minesweeper mit **React 18**, **Vite** und **TypeScript**: Öffne das Feld, markiere die Minen und rate nie mehr,
als du musst. Drei Spielweisen: **klassische** quadratische Spielfelder, **sechseckige** Felder mit sechs Nachbarn und **Gegen die Uhr**
(so viele Anfänger-Spielfelder, wie du in drei Minuten räumst). Der erste Klick ist immer sicher, Zahlen erscheinen als Ziffern
(Farbe ist nur eine Zugabe), und die Spielfelder werden aus einem Seed erzeugt, sodass die Spiellogik vollständig testbar ist.
Läuft eigenständig **und** als eines der fünfzehn Spiele von **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)**:
spiel es unter [dulzoltan.hu/arcade/#/play/minesweeper](https://dulzoltan.hu/arcade/#/play/minesweeper).

[![CI](https://github.com/ZoliQua/Minesweeper-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Minesweeper-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Inhalt

- [Die Zoltan's-Arcade-Familie](#%EF%B8%8F-die-zoltans-arcade-familie)
- [Funktionen](#-funktionen)
- [Schnellstart](#-schnellstart)
- [Modi](#-modi)
- [Steuerung](#%EF%B8%8F-steuerung)
- [Wertung und Statistik](#-wertung-und-statistik)
- [Automatisches Speichern und Fortsetzen](#-automatisches-speichern-und-fortsetzen)
- [Einbindung in Arcade-Game-Center](#-einbindung-in-arcade-game-center)
- [Skripte](#-skripte)
- [Aufbau](#%EF%B8%8F-aufbau)
- [Mitmachen](#-mitmachen)
- [Lizenz](#%EF%B8%8F-lizenz)

## 🕹️ Die Zoltan's-Arcade-Familie

Jedes Spiel ist ein eigenständiges Repository, das sich auch in das Portal einfügt. Alle teilen über das mitgelieferte Kit [`src/arcade/`](./src/arcade) ein Designsystem, ein Wertungsmodell und ein Speicherformat.

| Spiel | Repository | Genre |
| --- | --- | --- |
| 🏠 **Arcade-Portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Alle Spiele an einem Ort, Live-Demos, Statistik, Bestenliste |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reaktion |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labyrinth |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategie |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duell |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Schläger |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duell |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sortieren |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Karten |
| 💣 **Minesweeper** (dieses Repository) | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logik |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Karten |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Karten |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Karten |

## ✨ Funktionen

- 💣 **Drei Modi**: Klassisch (Anfänger 9×9 / 10, Fortgeschritten 16×16 / 40, Experte 30×16 / 99), Sechseckig (9×9 / 10, 14×14 / 36,
  24×14 / 80) und Gegen die Uhr (3 Minuten Anfänger-Spielfelder)
- ⬡ **Echte Sechseckfelder**: versetzte Reihen (odd-r) als SVG-Polygone, sechs Nachbarn, Flutfüllung und Akkord auch auf Sechsecken
- 🛟 **Sicherer erster Klick**: Die Minen werden erst nach dem ersten Öffnen gelegt, nie auf das angeklickte Feld oder seine Nachbarn – der erste Klick öffnet also immer eine Fläche
- 🚩 **Flaggen und Akkorde**: Rechtsklick, langes Drücken (400 ms) oder **F** setzt eine Flagge; ein Klick (oder Doppelklick) auf eine Zahl, um die alle Flaggen stehen, öffnet die übrigen Nachbarn
- 💥 **Ehrliches Ende**: Eine Niederlage zeigt alle Minen und streicht falsche Flaggen durch; ein Sieg markiert die übrigen Minen
- ⏱️ **Rückmeldung gegen die Uhr**: Eine Mine lässt den Rahmen blinken und zeigt **−15 s**, ein geräumtes Spielfeld zeigt **+150**, und sofort folgt ein neues
- 👁️ **Farbenblind-freundlich**: Zahlen sind Ziffern, verdeckte Felder haben eine erhabene Innenkante, die geöffnete Mine einen Stern, falsche Flaggen ein Kreuz; Farbe ist nie das einzige Merkmal
- 📱 **Handytauglich**: Tippen öffnet, langes Drücken setzt eine Flagge, und die Taste **„Fahne“** schaltet das Tippen auf Flaggen um;
  das Spielfeld richtet seine Größe nach seinem Rahmen, und ein Spielfeld, das größer als der Bildschirm ist, wird innerhalb dieses
  Rahmens verschoben, nie die Seite; die Experten-Spielfelder (quadratisch und sechseckig) stellen sich auf einem Handy im Hochformat hochkant (16×30, 14×24)
- 📖 **Regeln**-Taste: Ziel (mit einer Abbildung eines Zahlenfelds), so spielst du, die Regeln, die Wertung mit allen Zahlen, der Zahnmodus und auf dem Handy die Touch-Steuerung
- 🏁 **Vorzeitig beenden**: beendet die Runde nach einer Rückfrage; ein klassisches oder sechseckiges Spielfeld kommt mit 0 in die Bestenliste, gegen die Uhr zählen die bisherigen Punkte
- ⛶ **Vollbild**: Das Spiel füllt den Bildschirm (auf dem iPhone als Vollbild-Layout; Teilen → Zum Home-Bildschirm blendet die Browserleisten aus)
- 🏆 **Einheitliche Arcade-Wertung**: Eine beendete Runde wird genau einmal erfasst; Bestwert, Spiele und Siege teilt das Spiel mit dem Portal
- ⏸️ **Pause** (P / Esc oder automatisch, wenn der Tab verborgen ist) hält Spielfeld und Uhr an
- 💾 **Automatisches Speichern und Fortsetzen**: Das Spielfeld übersteht Neuladen und geschlossene Tabs
- 🌗 **Dunkles / helles Design**, gemeinsam mit allen Arcade-Spielen (Taste **T**)
- 🌍 **Drei Sprachen**: Englisch, Ungarisch (Aknakereső) und Deutsch; umschaltbar in der oberen Leiste oder in den Einstellungen (auch `?lang=en|hu|de` für Links); Zahlen folgen der Zifferngruppierung der Sprache
- 🦷 **Zahnmodus**: ein Schalter „Fogas mód” / "Dental mode" / „Zahnmodus” in den Einstellungen, standardmäßig aus (oder `?dental=1`), gilt für die ganze Arcade: Minen sind kariöse Zähne und Flaggen Zahnbürsten; Zahlen bleiben Ziffern; nur die Darstellung ändert sich
- 🤖 **Demo im Attract-Modus** (`<MinesweeperDemo />`): Ein Logik-Autopilot spielt quadratische und sechseckige Anfänger-Spielfelder, öffnet, was die Zahlen als sicher beweisen, und rät sonst das Feld mit dem geringsten Risiko
- ⌨️ **Tastatur zuerst und barrierearm**: Die Pfeiltasten bewegen einen Fokusring in beiden Topologien, jedes Feld hat eine Beschriftung (`Zeile 3, Spalte 5: 2`)
- 🧪 **Getestet**: Spiellogik (quadratisch und sechseckig), Modi, Wertung, Gegen die Uhr, der Speicher-Validator, die Fokusbewegung, der Autopilot, die Demo und das Verhalten der Komponenten

## 🚀 Schnellstart

Benötigt **Node ≥ 20** und npm.

```bash
git clone https://github.com/ZoliQua/Minesweeper-Game.git
cd Minesweeper-Game
npm install
npm run dev          # http://localhost:5173
```

Produktions-Build: `npm run build && npm run preview`. Der Build verwendet relative Pfade, daher kann `dist/` aus jedem Unterordner ausgeliefert werden.

## 💣 Modi

| Modus | Stufe | Spielfeld | Minen |
| --- | --- | --- | --- |
| Klassisch | Anfänger / Fortgeschritten / Experte | 9×9 / 16×16 / 30×16 | 10 / 40 / 99 |
| Sechseckig | Anfänger / Fortgeschritten / Experte | 9×9 / 14×14 / 24×14 | 10 / 36 / 80 |
| Gegen die Uhr | Anfänger-Spielfelder | 9×9 | 10 |

- **Klassisch und Sechseckig**: Öffne jedes sichere Feld. Die Uhr startet mit dem ersten Öffnen. Eine geöffnete Mine beendet die Runde.
- **Gegen die Uhr**: 3:00 auf der Uhr ab Start. Jedes geräumte Spielfeld bringt Punkte, und ein neues folgt; eine Mine kostet **15 Sekunden**
  und bringt ebenfalls ein neues Spielfeld. Die Runde endet, wenn die Uhr null erreicht.
- Wechselst du während einer laufenden Runde den Modus oder startest ein neues Spiel, fragt das Spiel zuerst nach, direkt auf der Seite;
  die abgebrochene Runde wird nicht gewertet. Dein letzter Modus wird gespeichert (`minesweeper.mode`), ebenso deine klassische /
  sechseckige Stufe, wenn du von Gegen die Uhr zurückkommst (`minesweeper.level`).

## ⌨️ Steuerung

| Eingabe | Aktion |
| --- | --- |
| 🖱️ Klick / Tippen | Feld öffnen; auf einer Zahl, um die alle Flaggen stehen: die übrigen Nachbarn öffnen (Akkord) |
| 🖱️ Rechtsklick / langes Drücken (400 ms) | Flagge setzen / entfernen |
| 🚩 Taste **„Fahne“** | Solange sie an ist, setzt Klick / Tippen eine Flagge und langes Drücken öffnet |
| 🖱️ Doppelklick auf eine Zahl | Akkord |
| **← → ↑ ↓** | Fokusring bewegen (folgt dem Bildschirm, wenn das Spielfeld gedreht ist) |
| **Leertaste** / **Enter** | Fokussiertes Feld öffnen (oder Akkord) · Start · Weiter · Nochmal spielen |
| **F** | Fokussiertes Feld markieren |
| **P** / **Esc** | Pause / weiter |
| **R** | Neues Spiel (fragt während einer Runde nach) |
| **T** | Dunkles / helles Design umschalten (eigenständige Seite) |

Tastenkürzel werden ignoriert, solange du in ein Formularfeld tippst oder Cmd/Strg/Alt hältst. **R** bleibt *Neues Spiel*, daher öffnet
sich der **Regeln**-Dialog nur über seine Taste.

### 📱 Auf dem Handy

Tippe ein Feld an, um es zu öffnen, und halte es einen Moment (400 ms) gedrückt, um eine Flagge zu setzen oder zu entfernen; ein Finger,
der zu ziehen beginnt, verschiebt das Spielfeld und setzt daher weder eine Flagge noch öffnet er ein Feld. Die Taste **„Fahne“** über dem
Spielfeld vertauscht beides: Solange sie an ist, setzt Tippen eine Flagge und langes Drücken öffnet. Ein Tippen auf eine Zahl, um die alle
Flaggen stehen, öffnet die übrigen Felder ringsum. Auf einem Touchscreen bleibt ein Feld mindestens 32 px breit; ein Spielfeld, das dadurch
größer als sein Rahmen wird, verschiebst du innerhalb des Rahmens, während die Seite stehen bleibt. **Vollbild** im Spiel-Bereich blendet
alles außer dem Spiel aus, und die **Regeln** haben einen Abschnitt *Auf dem Handy* mit all dem.

## 🎯 Wertung und Statistik

Klassisch und Sechseckig, für ein geräumtes Spielfeld (eine Niederlage bringt 0 Punkte und wird als `loss` erfasst):

```
score = round(base × clamp(par / max(seconds, 1), 0.1, 1))
```

| Stufe | Grundpunkte | Richtzeit |
| --- | --- | --- |
| Anfänger | 1 000 | 30 s |
| Fortgeschritten | 3 000 | 120 s |
| Experte | 6 000 | 300 s |

Gegen die Uhr: **150 Punkte pro geräumtem Spielfeld**, höchstens 12 000, erfasst mit dem Ergebnis `over`.

**Beenden** schließt eine Runde nach einer Rückfrage auf der Seite vorzeitig ab (Ergebnis `finished`): Ein klassisches oder sechseckiges
Spielfeld kommt dann mit 0 in die Bestenliste, gegen die Uhr zählen die bisher gesammelten Punkte. Die Ergebniskarte zeigt
*Vorzeitig beendet*, und der Spielstand wird verworfen.

Die Arcade-weite Punktobergrenze für Minesweeper liegt bei 12 000 (eine klassische Runde erreicht höchstens 6 000).

Die Statistikleiste zeigt **Punkte**, **Bestwert**, verbleibende **Minen** (Minen − Flaggen) und **Zeit**; gegen die Uhr **Spielfelder** und
**Restzeit**. Jede beendete Runde erfasst das Kit unter `arcade.stats.minesweeper` (`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, …).

## 💾 Automatisches Speichern und Fortsetzen

Der Spielstand umfasst den Modus, das ganze Spielfeld (Minen, Zahlen, geöffnete und markierte Felder), die Spielzeit und gegen die Uhr
die Restzeit und die geräumten Spielfelder (Schlüssel `arcade.session.minesweeper`, mit Schema-Version). Ein strenger Validator weist alles
Widersprüchliche zurück: Maße, die nicht zum Modus passen, Zahlen, die nicht zu den Minen passen, eine falsche Minenzahl, eine
Explosionsmarke, die nicht stimmt, oder einen Spielstand gegen die Uhr mit explodiertem Spielfeld oder ohne Restzeit. Ein klassisches oder
sechseckiges Spielfeld wird ab dem ersten Öffnen gespeichert (ein frisches Spielfeld enthält noch keine Minen). Gespeichert wird etwa einmal
pro Sekunde, immer wenn die Seite verborgen wird, und wenn das Spiel entfernt wird. Nach dem Neuladen erscheint **Willkommen zurück** mit
pausierter Runde. Ein beendetes Spielfeld wird nie wiederhergestellt und kann daher nie doppelt erfasst werden; **Verwerfen** neben dem
Hinweis *Automatisch gespeichert* löscht den Spielstand.

## 🧩 Einbindung in Arcade-Game-Center

```tsx
import { MinesweeperGame, MinesweeperDemo } from '@arcade/minesweeper';

<MinesweeperGame
  embedded                                   // Seitentitel ausblenden; das Portal zeigt ihn
  onGameOver={(score, info) => submitScore('minesweeper', score, info)}  // Runden mit Punkten > 0 und jedes Beenden ({ finished: true }, auch bei 0)
  onRunEnd={(run) => console.log(run.outcome, run.score)}    // jede beendete Runde
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<MinesweeperDemo active={cardIsVisible} />  // Attract-Modus auf der Startseite
```

Beide Komponenten folgen dem gemeinsamen Vertrag `ArcadeGameProps` / `ArcadeDemoProps` aus `src/arcade/types.ts`.
Status-Zuordnung: `idle` vor der ersten Runde eines Besuchs (Startkarte), `running` während ein Spielfeld gespielt wird, `paused` während
einer Unterbrechung (oder nach dem Wiederherstellen, oder solange die Rückfrage auf der Seite oder der Regeln-Dialog offen ist), `gameOver`,
sobald die Runde ein Ergebnis hat.

## 🧪 Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Vite-Entwicklungsserver |
| `npm run build` | Typprüfung (`tsc -b`) und Produktions-Build |
| `npm run preview` | Produktions-Build ausliefern |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (Logik- und Komponententests) |
| `npm run check` | lint → typecheck → test → build (das, was die CI ausführt) |

## 🏗️ Aufbau

```
src/
  arcade/                 mitgeliefertes Zoltan's-Arcade-Kit — hier nicht bearbeiten (siehe dessen README)
  logic/                  reine Spielregeln, ohne React
    types.ts grid.ts hex.ts  Felder, quadratische 8er-Nachbarschaft, odd-r-Sechseck-6er-Nachbarschaft
    board.ts              createBoard, openCell (sicherer erster Klick, Flutfüllung), toggleFlag, chord, isSolved
    modes.ts              MODES, modeDims, displayDims (Drehung im Hochformat)
    scoring.ts            classicScore, MAX_SCORE
    timeAttack.ts         3-Minuten-Runde: tick, taOpen / taChord / taFlag, timeAttackScore
    session.ts            Form des Spielstands und sein strenger Validator
    focus.ts              Pfeiltasten-Fokus im Bildschirmraum
    autopilot.ts          der Logikspieler der Demo (sichere Züge, dann geringstes Risiko)
    rng.ts seed.ts        mulberry32, frische Seeds
  components/             Board (SVG quadratisch + sechseckig, langes Drücken), ModeSelect, DentalToggle
  rules.tsx               Abschnitte des Regeln-Dialogs und die Zahlen-Abbildung (Zahlen aus den Wertungsfunktionen)
  demo/MinesweeperDemo.tsx  Attract-Modus der Startseite
  MinesweeperGame.tsx     das einbettbare Spiel (ArcadeGameProps)
  i18n.ts                 Texte auf en / hu / de
  App.tsx                 eigenständige Seite: <ArcadeShell><MinesweeperGame/></ArcadeShell>
  main.tsx                Einstieg; lädt das gemeinsame arcade.css einmal
  index.ts                Paketeinstieg für Arcade-Game-Center
```

## 🤝 Mitmachen

Siehe [CONTRIBUTING.md](./CONTRIBUTING.md), den [Verhaltenskodex](./CODE_OF_CONDUCT.md) und [SECURITY.md](./SECURITY.md).
Die Mitwirkenden stehen in [CONTRIBUTORS.md](./CONTRIBUTORS.md), die Änderungen in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ Lizenz

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Mit ❤️ gemacht von Zoltán Dul · Teil von <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
