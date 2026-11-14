# 💣 Minesweeper

[English](README.md) · [Deutsch](README.de.md) · **Magyar**

Típusbiztos Aknakereső **React 18**, **Vite** és **TypeScript** alapokon: fedd fel a mezőt, jelöld meg az aknákat, és sose találgass
többet, mint amennyit muszáj. Háromféleképpen játszhatsz: **klasszikus** négyzetes táblán, **hatszögletű** mezőkön hat szomszéddal és
**időre** (annyi kezdő táblát, amennyit három perc alatt megoldasz). Az első kattintás mindig biztonságos, a számok számjegyként jelennek
meg (a szín csak ráadás), a táblák pedig seedből készülnek, így a játékmotor teljesen tesztelhető.
Önállóan is fut, **és** a **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** tizenöt játékának egyike:
játssz vele a [dulzoltan.hu/arcade/#/play/minesweeper](https://dulzoltan.hu/arcade/#/play/minesweeper) oldalon.

[![CI](https://github.com/ZoliQua/Minesweeper-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Minesweeper-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Tartalom

- [A Zoltan's Arcade család](#%EF%B8%8F-a-zoltans-arcade-család)
- [Funkciók](#-funkciók)
- [Gyors kezdés](#-gyors-kezdés)
- [Módok](#-módok)
- [Irányítás](#%EF%B8%8F-irányítás)
- [Pontozás és statisztika](#-pontozás-és-statisztika)
- [Automatikus mentés és folytatás](#-automatikus-mentés-és-folytatás)
- [Beágyazás az Arcade-Game-Centerbe](#-beágyazás-az-arcade-game-centerbe)
- [Szkriptek](#-szkriptek)
- [Felépítés](#%EF%B8%8F-felépítés)
- [Közreműködés](#-közreműködés)
- [Licenc](#%EF%B8%8F-licenc)

## 🕹️ A Zoltan's Arcade család

Minden játék önálló repó, amely a portálba is beépül. A mellékelt [`src/arcade/`](./src/arcade) készleten keresztül közös a dizájnrendszerük, a pontozásuk és a mentési formátumuk.

| Játék | Repó | Műfaj |
| --- | --- | --- |
| 🏠 **Arcade-portál** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Minden játék egy helyen, élő demók, statisztika, ranglista |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Fejtörő |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labirintus |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Stratégia |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Párbaj |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Ütős |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Lövöldözős |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Párbaj |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Rendezős |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Kártya |
| 💣 **Minesweeper** (ez a repó) | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logikai |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Kártya |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Kártya |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Kártya |

## ✨ Funkciók

- 💣 **Három mód**: Klasszikus (Kezdő 9×9 / 10, Haladó 16×16 / 40, Mester 30×16 / 99), Hatszögletű (9×9 / 10, 14×14 / 36,
  24×14 / 80) és Időre (3 percnyi kezdő tábla)
- ⬡ **Valódi hatszögletű tábla**: eltolt sorok (odd-r) SVG-sokszögekként, hat szomszéd, elárasztásos felfedés és szám körüli nyitás hatszögeken is
- 🛟 **Biztonságos első kattintás**: az aknák csak az első felfedés után kerülnek a táblára, sosem a kattintott mezőre vagy a szomszédaira, így az első kattintás mindig egy egész területet nyit meg
- 🚩 **Zászlók és szám körüli nyitás**: jobb klikk, hosszú érintés (400 ms) vagy **F** tűz zászlót; egy kattintás (vagy dupla kattintás) egy olyan számon, amely körül minden zászló a helyén van, felfedi a többi szomszédját
- 💥 **Őszinte befejezés**: vereségnél minden akna látszik, és a téves zászlók áthúzva jelennek meg; győzelemnél a maradék aknák zászlót kapnak
- ⏱️ **Visszajelzés időre játékban**: egy akna megvillantja a keretet, és **−15 mp** jelenik meg, egy megoldott tábla **+150**-et mutat, és azonnal jön a következő
- 👁️ **Színtévesztőbarát**: a számok számjegyek, a fedett mezőknek kiemelt belső pereme van, a felrobbant aknának csillaga, a téves zászlónak keresztje; a szín sosem az egyetlen jelzés
- 📱 **Telefonbarát**: a koppintás felfed, a hosszú érintés zászlót tűz, a **Zászló** gomb pedig zászlózásra állítja a koppintást;
  a tábla a keretéhez igazítja a méretét, a képernyőnél nagyobb tábla pedig a saját keretén belül mozdul el, sosem az oldal;
  a mestertáblák (négyzetes és hatszögletű) álló telefonon állóra fordulnak (16×30, 14×24)
- 📖 **Szabályok** gomb: a cél (egy számozott mező ábrájával), a játék menete, a szabályok, a pontozás minden számmal, a fogas mód és telefonon az érintéses irányítás
- 🏁 **Idő előtti befejezés**: megerősítés után lezárja a játékot; klasszikus vagy hatszögletű tábla 0 ponttal kerül a ranglistára, időre játékban az addig gyűjtött pontok számítanak
- ⛶ **Teljes képernyő**: a játék kitölti a képernyőt (iPhone-on teljes képernyős elrendezéssel; Megosztás → Főképernyőhöz adás elrejti a böngészősávokat)
- 🏆 **Egységes arcade-pontozás**: minden befejezett játékot pontosan egyszer rögzít; a rekordot, a játékok és a győzelmek számát a portállal közösen tartja nyilván
- ⏸️ **Szünet** (P / Esc, vagy magától, ha a lap rejtve van) megállítja a táblát és az órát
- 💾 **Automatikus mentés és folytatás**: a tábla túléli az újratöltést és a lap bezárását
- 🌗 **Sötét / világos téma**, közösen az összes arcade-játékkal (**T** billentyű)
- 🌍 **Három nyelv**: angol, magyar (Aknakereső) és német; a felső sávban vagy a beállításokban váltható (linkekhez `?lang=en|hu|de` is); a számok a nyelv számcsoportosítását követik
- 🦷 **Fogas mód**: „Fogas mód” / "Dental mode" / „Zahnmodus” kapcsoló a beállításokban, alapból kikapcsolva (vagy `?dental=1`), az egész arcade-ra érvényes: az aknák szuvas fogak, a zászlók fogkefék; a számok számjegyek maradnak; csak a megjelenés változik
- 🤖 **Bemutató mód** (`<MinesweeperDemo />`): egy logikai robotpilóta négyzetes és hatszögletű kezdő táblákon játszik, felfedi, amiről a számok bizonyítják, hogy biztonságos, egyébként pedig a legkisebb kockázatú mezőre tippel
- ⌨️ **Billentyűzetbarát és akadálymentes**: a nyilak mindkét táblatípuson fókuszgyűrűt mozgatnak, minden mezőnek van felirata (`3. sor, 5. oszlop: 2`)
- 🧪 **Tesztelve**: játékmotor (négyzetes és hatszögletű), módok, pontozás, időre játék, a mentés ellenőrzője, a fókuszmozgás, a robotpilóta, a bemutató és a komponensek viselkedése

## 🚀 Gyors kezdés

**Node ≥ 20** és npm szükséges.

```bash
git clone https://github.com/ZoliQua/Minesweeper-Game.git
cd Minesweeper-Game
npm install
npm run dev          # http://localhost:5173
```

Éles build: `npm run build && npm run preview`. A build relatív útvonalakat használ, így a `dist/` bármelyik almappából kiszolgálható.

## 💣 Módok

| Mód | Szint | Tábla | Aknák |
| --- | --- | --- | --- |
| Klasszikus | Kezdő / Haladó / Mester | 9×9 / 16×16 / 30×16 | 10 / 40 / 99 |
| Hatszögletű | Kezdő / Haladó / Mester | 9×9 / 14×14 / 24×14 | 10 / 36 / 80 |
| Időre | Kezdő táblák | 9×9 | 10 |

- **Klasszikus és Hatszögletű**: fedd fel az összes biztonságos mezőt. Az óra az első felfedéssel indul. Ha aknát nyitsz, véget ér a játék.
- **Időre**: Indítástól 3:00 van az órán. Minden megoldott tábla pontot ér, és jön a következő; egy akna **15 másodpercbe** kerül,
  és szintén új táblát hoz. A játék akkor ér véget, amikor az óra nullára fut.
- Ha játék közben módot váltasz vagy új játékot kezdesz, a játék előbb rákérdez, magán az oldalon; a félbehagyott játék nem kap pontot.
  A legutóbbi módodat megjegyzi (`minesweeper.mode`), és a klasszikus / hatszögletű szintedet is, amikor az Időre módból
  visszatérsz (`minesweeper.level`).

## ⌨️ Irányítás

| Bevitel | Művelet |
| --- | --- |
| 🖱️ Kattintás / koppintás | Mező felfedése; olyan számon, amely körül minden zászló a helyén van: a többi szomszéd felfedése (szám körüli nyitás) |
| 🖱️ Jobb klikk / hosszú érintés (400 ms) | Zászló ki / be |
| 🚩 **Zászló** gomb | Amíg be van kapcsolva, a kattintás / koppintás zászlót tűz, a hosszú érintés felfed |
| 🖱️ Dupla kattintás egy számon | Szám körüli nyitás |
| **← → ↑ ↓** | Fókuszgyűrű mozgatása (elforgatott táblán a képernyőt követi) |
| **Szóköz** / **Enter** | A fókuszált mező felfedése (vagy szám körüli nyitás) · indítás · folytatás · új játék |
| **F** | A fókuszált mező megjelölése |
| **P** / **Esc** | Szünet / folytatás |
| **R** | Új játék (játék közben előbb rákérdez) |
| **T** | Sötét / világos téma váltása (önálló oldalon) |

A gyorsbillentyűk nem működnek, amíg egy űrlapmezőbe gépelsz, vagy lenyomva tartod a Cmd/Ctrl/Alt billentyűt. Az **R** továbbra is
*Új játék*, ezért a **Szabályok** ablak csak a gombjával nyílik meg.

### 📱 Telefonon

Koppints egy mezőre a felfedéséhez, és tartsd rajta egy pillanatig (400 ms) az ujjad, ha zászlót tűznél ki vagy vennél le; ha az ujjad
húzni kezd, azzal a táblát mozgatod, így se zászló, se felfedés nem történik. A tábla fölötti **Zászló** gomb felcseréli a kettőt: amíg
be van kapcsolva, a koppintás zászlót tűz, a hosszú érintés felfed. Ha egy szám körül minden zászló a helyén van, egy koppintás rajta
felfedi a körülötte lévő többi mezőt. Érintőképernyőn egy mező legalább 32 px széles marad; az így a keretnél nagyobbra nőtt táblát a
keretén belül mozgathatod, az oldal közben áll. A Játék panel **Teljes képernyő** gombja a játékon kívül mindent elrejt, a
**Szabályok** *Mobilon* része pedig mindezt összefoglalja.

## 🎯 Pontozás és statisztika

Klasszikus és hatszögletű módban, megoldott tábla esetén (a vereség 0 pont, és `loss`-ként rögzül):

```
score = round(base × clamp(par / max(seconds, 1), 0.1, 1))
```

| Szint | Alappont | Szintidő |
| --- | --- | --- |
| Kezdő | 1 000 | 30 mp |
| Haladó | 3 000 | 120 mp |
| Mester | 6 000 | 300 mp |

Időre: **megoldott táblánként 150 pont**, legfeljebb 12 000, `over` eredménnyel rögzítve.

A **Befejezés** az oldalon megjelenő megerősítés után idő előtt lezárja a játékot (`finished` eredmény): klasszikus vagy hatszögletű
tábla ilyenkor 0 ponttal kerül a ranglistára, időre játékban az addig gyűjtött pontok számítanak. Az eredménykártyán
*Idő előtt befejezve* áll, a mentés pedig törlődik.

Az Aknakereső arcade-szintű pontplafonja 12 000 (egy klasszikus játék legfeljebb 6 000 pontot ér).

A statisztikasáv a **Pont**, **Rekord**, a hátralévő **Aknák** (aknák − zászlók) és az **Idő** értékét mutatja; időre játékban a
**Táblák** és a **Hátralévő idő** értékét. Minden befejezett játékot a készlet az `arcade.stats.minesweeper` kulcs alatt rögzít (`best`,
`plays`, `wins`, `totalScore`, `totalSeconds`, …).

## 💾 Automatikus mentés és folytatás

A mentés tartalmazza a módot, a teljes táblát (aknák, számok, felfedett és megjelölt mezők), a játékidőt, időre játékban pedig a
hátralévő időt és a megoldott táblák számát (kulcs: `arcade.session.minesweeper`, sémaverzióval). Egy szigorú ellenőrző minden
ellentmondásosat elutasít: a módhoz nem illő méreteket, az aknákhoz nem illő számokat, a hibás aknaszámot, a nem egyező robbanásjelet,
illetve az olyan időre játékos mentést, amelyben felrobbant a tábla vagy nincs hátralévő idő. Klasszikus vagy hatszögletű táblát az első
felfedéstől kezdve ment (egy friss táblán még nincsenek aknák). Nagyjából másodpercenként ment, valahányszor a lap rejtetté válik, és
amikor a játék lekerül az oldalról. Újratöltés után **Üdv újra!** fogad, szüneteltetett játékkal. Befejezett táblát sosem állít vissza,
így az sosem rögzülhet kétszer; az *Elmentve* jelzés melletti **Elvetés** törli a mentést.

## 🧩 Beágyazás az Arcade-Game-Centerbe

```tsx
import { MinesweeperGame, MinesweeperDemo } from '@arcade/minesweeper';

<MinesweeperGame
  embedded                                   // az oldalcím elrejtése; a portál mutatja
  onGameOver={(score, info) => submitScore('minesweeper', score, info)}  // 0-nál több pontos játékok és minden Befejezés ({ finished: true }, 0-nál is)
  onRunEnd={(run) => console.log(run.outcome, run.score)}    // minden befejezett játék
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<MinesweeperDemo active={cardIsVisible} />  // bemutató mód a nyitóoldalon
```

Mindkét komponens a közös `ArcadeGameProps` / `ArcadeDemoProps` szerződést követi (`src/arcade/types.ts`).
Állapotok: `idle` egy látogatás első játéka előtt (Indítás kártya), `running` amíg egy táblán játszol, `paused` szünet alatt (vagy
visszaállítás után, vagy amíg az oldalon megjelenő megerősítés vagy a Szabályok ablak nyitva van), `gameOver`, amint a játéknak
eredménye van.

## 🧪 Szkriptek

| Szkript | Cél |
| --- | --- |
| `npm run dev` | Vite fejlesztői szerver |
| `npm run build` | Típusellenőrzés (`tsc -b`) és éles build |
| `npm run preview` | Az éles build kiszolgálása |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logikai és komponenstesztek) |
| `npm run check` | lint → typecheck → test → build (ezt futtatja a CI) |

## 🏗️ Felépítés

```
src/
  arcade/                 mellékelt Zoltan's Arcade készlet — itt ne szerkeszd (lásd a README-jét)
  logic/                  tiszta játékszabályok, React nélkül
    types.ts grid.ts hex.ts  mezők, négyzetes 8-as szomszédság, odd-r hatszögletű 6-os szomszédság
    board.ts              createBoard, openCell (biztonságos első kattintás, elárasztás), toggleFlag, chord, isSolved
    modes.ts              MODES, modeDims, displayDims (álló elforgatás)
    scoring.ts            classicScore, MAX_SCORE
    timeAttack.ts         3 perces játék: tick, taOpen / taChord / taFlag, timeAttackScore
    session.ts            a mentés alakja és szigorú ellenőrzője
    focus.ts              nyilas fókusz képernyő-koordinátákban
    autopilot.ts          a bemutató logikai játékosa (biztos lépések, aztán a legkisebb kockázat)
    rng.ts seed.ts        mulberry32, friss seedek
  components/             Board (SVG négyzetes + hatszögletű, hosszú érintés), ModeSelect, DentalToggle
  rules.tsx               a Szabályok ablak részei és a számos ábra (a számok a pontozó függvényekből)
  demo/MinesweeperDemo.tsx  bemutató mód a nyitóoldalon
  MinesweeperGame.tsx     a beágyazható játék (ArcadeGameProps)
  i18n.ts                 en / hu / de szövegek
  App.tsx                 önálló oldal: <ArcadeShell><MinesweeperGame/></ArcadeShell>
  main.tsx                belépési pont; egyszer tölti be a közös arcade.css-t
  index.ts                csomag-belépési pont az Arcade-Game-Center számára
```

## 🤝 Közreműködés

Lásd: [CONTRIBUTING.md](./CONTRIBUTING.md), a [Magatartási kódex](./CODE_OF_CONDUCT.md) és a [SECURITY.md](./SECURITY.md).
A közreműködők listája a [CONTRIBUTORS.md](./CONTRIBUTORS.md)-ben, a változások a [CHANGELOG.md](./CHANGELOG.md)-ben találhatók.

## ⚖️ Licenc

[MIT](./LICENSE) © 2026 Dul Zoltán

---

<p align="center">❤️-tel készítette Dul Zoltán · a <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a> része</p>
