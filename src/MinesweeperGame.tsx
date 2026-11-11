import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ARCADE_KEYS,
  clearSession,
  formatClock,
  formatNumber,
  gameName,
  GameOverlay,
  isKey,
  KeyHelp,
  readJSON,
  SaveBadge,
  shouldIgnoreKey,
  StatPanel,
  useArcadeRun,
  useDental,
  useKitMessages,
  useLang,
  useMessages,
  useRestoredSession,
  useRunTimer,
  useSessionAutosave,
  writeJSON,
  type ArcadeGameProps,
  type ArcadeStatus,
  type OverlayAction,
  type RunOutcome,
} from './arcade';
import { Board } from './components/Board';
import { DentalToggle } from './components/DentalToggle';
import type { CellView } from './components/cellView';
import { ModeSelect } from './components/ModeSelect';
import { KIND_KEY, LEVEL_KEY, MESSAGES, type MessageKey } from './i18n';
import { chord, createBoard, isSolved, openCell, toggleFlag } from './logic/board';
import { moveFocus, type Direction } from './logic/focus';
import { displayDims, LEVELS, MODE_KINDS, modeDims, modeTopology, type Level, type ModeSelection } from './logic/modes';
import { classicScore } from './logic/scoring';
import { randomSeed } from './logic/seed';
import { isMinesweeperSession, restoreTimeAttack, SESSION_SCHEMA, toSession, type MinesweeperSession } from './logic/session';
import {
  isTimeUp,
  MINE_PENALTY_MS,
  POINTS_PER_BOARD,
  startTimeAttack,
  taChord,
  taFlag,
  taOpen,
  tick,
  TIME_ATTACK_MS,
  timeAttackScore,
  type TimeAttackState,
} from './logic/timeAttack';
import type { Board as BoardState, Cell } from './logic/types';
import styles from './MinesweeperGame.module.css';

const GAME = 'minesweeper' as const;

/** Lets the revealed mines (or the last opened cells) show before the result card covers the board. */
export const RESULT_DELAY_MS = 900;
/** How long the time-attack "−15 s" / "+150" feedback stays. */
export const FEEDBACK_MS = 1200;
const TA_TICK_MS = 100;
const MODE_PREF = 'minesweeper.mode';
const LEVEL_PREF = 'minesweeper.level';
const DEFAULT_MODE: ModeSelection = { kind: 'classic', level: 'beginner' };
const PORTRAIT_QUERY = '(orientation: portrait) and (max-width: 700px)';

/**
 * UI phase: `idle` before a run (Start card), `live` while playing, `paused`
 * while suspended (or restored), `over` once the run has a result.
 */
type Phase = 'idle' | 'live' | 'paused' | 'over';
type Pending = { kind: 'mode'; mode: ModeSelection } | { kind: 'restart' };
type Result = { outcome: RunOutcome; score: number; seconds: number };
type Feedback = { kind: 'mine' | 'solved'; n: number };
type Action = 'open' | 'flag' | 'chord';

/** All modes share one state shape; classic and hex simply ignore the clock fields. */
type Play = TimeAttackState;

const KEYS: [string, MessageKey][] = [
  ['← → ↑ ↓', 'keyMove'],
  ['Space Enter', 'keyOpen'],
  ['F', 'keyFlag'],
  ['P Esc', 'keyPause'],
  ['R', 'keyNew'],
];

const ARROWS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

function isModeSelection(v: unknown): v is ModeSelection {
  if (typeof v !== 'object' || v === null) return false;
  const { kind, level } = v as Record<string, unknown>;
  if (!MODE_KINDS.includes(kind as never) || !LEVELS.includes(level as never)) return false;
  return kind !== 'timeAttack' || level === 'beginner';
}

const readModePref = (): ModeSelection => {
  const v = readJSON<unknown>(MODE_PREF, null);
  return isModeSelection(v) ? v : DEFAULT_MODE;
};

const readLevelPref = (): Level => {
  const v = readJSON<unknown>(LEVEL_PREF, null);
  return LEVELS.includes(v as never) ? (v as Level) : 'beginner';
};

/** Elements that answer Space / Enter themselves; the global hotkeys leave them alone. */
function handlesActivationKeys(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  return el.tagName === 'BUTTON' || el.tagName === 'SUMMARY' || (el.tagName === 'A' && el.hasAttribute('href'));
}

function freshPlay(mode: ModeSelection): Play {
  if (mode.kind === 'timeAttack') return startTimeAttack(randomSeed());
  const { cols, rows, mines } = modeDims(mode);
  return { board: createBoard(modeTopology(mode.kind), cols, rows, mines, randomSeed()), remainingMs: TIME_ATTACK_MS, solved: 0 };
}

const centreOf = (mode: ModeSelection) => {
  const { cols, rows } = modeDims(mode);
  return Math.floor(rows / 2) * cols + Math.floor(cols / 2);
};

const sameMode = (a: ModeSelection, b: ModeSelection) => a.kind === b.kind && a.level === b.level;

/** True on a portrait phone: the expert boards are then shown rotated. */
function usePortrait(): boolean {
  const query = () => {
    try {
      return window.matchMedia?.(PORTRAIT_QUERY) ?? null;
    } catch {
      return null;
    }
  };
  const [portrait, setPortrait] = useState(() => query()?.matches ?? false);
  useEffect(() => {
    const mql = query();
    if (!mql) return;
    const onChange = () => setPortrait(mql.matches);
    onChange();
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);
  return portrait;
}

const CELL_KEY: Record<CellView, [MessageKey, MessageKey]> = {
  hidden: ['cellHidden', 'cellHidden'],
  flag: ['cellFlag', 'cellFlagDental'],
  open: ['cellEmpty', 'cellEmpty'],
  mine: ['cellMine', 'cellMineDental'],
  exploded: ['cellExploded', 'cellExplodedDental'],
  wrong: ['cellWrong', 'cellWrongDental'],
};

export function MinesweeperGame(props: ArcadeGameProps = {}) {
  const { embedded = false } = props;
  const t = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const [dental] = useDental();
  const portrait = usePortrait();

  const restoredEnv = useRestoredSession<MinesweeperSession>(GAME, SESSION_SCHEMA, isMinesweeperSession);
  // A finished board (lost or cleared) is never resumed: it has already been recorded.
  const [init] = useState(() => {
    const data = restoredEnv?.data;
    const usable = data && data.board.exploded === null && !isSolved(data.board) ? data : null;
    const mode = usable?.mode ?? readModePref();
    const play: Play = usable
      ? (restoreTimeAttack(usable) ?? { board: usable.board, remainingMs: TIME_ATTACK_MS, solved: 0 })
      : freshPlay(mode);
    return { restored: usable, mode, play };
  });
  const restored = init.restored;

  const [mode, setMode] = useState<ModeSelection>(init.mode);
  // Time attack is always beginner; coming back to Classic / Hexagonal restores this level.
  const [lastLevel, setLastLevel] = useState<Level>(() =>
    init.mode.kind !== 'timeAttack' ? init.mode.level : readLevelPref(),
  );
  const [play, setPlay] = useState<Play>(init.play);
  const [phase, setPhase] = useState<Phase>(restored ? 'paused' : 'idle');
  const [welcomeBack, setWelcomeBack] = useState(restored !== null);
  const [runKey, setRunKey] = useState(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hideResult, setHideResult] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [focus, setFocus] = useState(() => centreOf(init.mode));
  const [showFocus, setShowFocus] = useState(false);
  const feedbackSeq = useRef(0);

  const isTA = mode.kind === 'timeAttack';
  const dims = modeDims(mode);
  const shown = displayDims(dims, portrait);
  const swapped = shown.cols !== dims.cols;
  const board = play.board;

  const interactive = phase === 'live' && pending === null;
  const inProgress = (phase === 'live' || phase === 'paused') && (isTA || board.generated);
  // Classic and hex clocks start with the first open, like the original.
  const clockRunning = interactive && (isTA || board.generated);
  const seconds = useRunTimer(clockRunning, runKey, runKey === 0 && restored ? restored.seconds : 0);
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;

  const status: ArcadeStatus =
    phase === 'idle' ? 'idle' : phase === 'over' ? 'gameOver' : phase === 'paused' || pending ? 'paused' : 'running';

  const liveScore = isTA ? timeAttackScore(play) : 0;
  const score = result?.score ?? liveScore;

  const stats = useArcadeRun({
    gameId: GAME,
    status,
    score,
    seconds: result?.seconds ?? seconds,
    runKey,
    outcome: () => result?.outcome ?? 'over',
    ranked: true,
    props,
  });

  const sessionData = useMemo(
    () => toSession(mode, play.board, seconds, isTA ? play : undefined),
    [mode, play, seconds, isTA],
  );
  const savedAt = useSessionAutosave({
    gameId: GAME,
    schema: SESSION_SCHEMA,
    // A classic / hex board is worth saving only after its first open (mines are placed then);
    // a fresh run also drops the previous run's save.
    enabled: (phase === 'live' || phase === 'paused') && (isTA || board.generated),
    discard: phase === 'idle' || phase === 'over' || (!isTA && !board.generated),
    data: sessionData,
    seconds,
    score: liveScore,
  });

  // ── Run lifecycle ──────────────────────────────────────────
  const finish = useCallback((outcome: RunOutcome, finalScore: number) => {
    setResult({ outcome, score: finalScore, seconds: secondsRef.current });
    setPhase('over');
    setShowResult(false);
    setHideResult(false);
  }, []);

  const resetTo = useCallback((m: ModeSelection, next: Phase) => {
    setPlay(freshPlay(m));
    setResult(null);
    setShowResult(false);
    setHideResult(false);
    setFeedback(null);
    setPending(null);
    setWelcomeBack(false);
    setFocus(centreOf(m));
    setPhase(next);
    setRunKey((n) => n + 1);
  }, []);

  const newRun = useCallback(() => resetTo(mode, 'live'), [mode, resetTo]);

  const applyMode = useCallback(
    (m: ModeSelection) => {
      setMode(m);
      writeJSON(MODE_PREF, m);
      if (m.kind !== 'timeAttack') {
        setLastLevel(m.level);
        writeJSON(LEVEL_PREF, m.level);
      }
      // A level switch mid-session keeps playing; time attack waits for Start (its clock is ticking).
      const live = (phase === 'live' || phase === 'paused') && m.kind !== 'timeAttack';
      resetTo(m, live ? 'live' : 'idle');
    },
    [phase, resetTo],
  );

  const changeMode = useCallback(
    (m: ModeSelection) => {
      if (sameMode(m, mode)) return;
      if (inProgress) setPending({ kind: 'mode', mode: m });
      else applyMode(m);
    },
    [mode, inProgress, applyMode],
  );

  const requestNew = useCallback(() => {
    if (inProgress) setPending({ kind: 'restart' });
    else newRun();
  }, [inProgress, newRun]);

  const confirmPending = useCallback(() => {
    if (!pending) return;
    if (pending.kind === 'mode') applyMode(pending.mode);
    else newRun();
  }, [pending, applyMode, newRun]);
  const cancelPending = useCallback(() => setPending(null), []);

  const togglePause = useCallback(() => {
    if (pending) return;
    setWelcomeBack(false);
    setPhase((p) => (p === 'live' ? 'paused' : p === 'paused' ? 'live' : p));
  }, [pending]);

  const discardSave = useCallback(() => {
    clearSession(GAME);
    resetTo(mode, 'idle');
  }, [mode, resetTo]);

  // ── Moves ──────────────────────────────────────────────────
  const act = useCallback(
    (i: number, action: Action) => {
      if (!interactive) return;
      const cell = board.cells[i];
      if (!cell) return;
      setFocus(i);
      const chording = action === 'chord' || (action === 'open' && cell.open && cell.adjacent > 0);
      if (isTA) {
        let next: Play;
        let raw: BoardState;
        if (action === 'flag') {
          next = taFlag(play, i);
          raw = next.board;
        } else {
          raw = chording ? chord(board, i) : openCell(board, i);
          next = chording ? taChord(play, i) : taOpen(play, i);
        }
        if (next === play) return;
        // The state just swaps in a fresh board, so the hit or the clear is shown here.
        if (raw.exploded !== null) setFeedback({ kind: 'mine', n: ++feedbackSeq.current });
        else if (action !== 'flag' && isSolved(raw)) setFeedback({ kind: 'solved', n: ++feedbackSeq.current });
        setPlay(next);
        return;
      }
      const next = action === 'flag' ? toggleFlag(board, i) : chording ? chord(board, i) : openCell(board, i);
      if (next === board) return;
      setPlay({ ...play, board: next });
      if (next.exploded !== null) finish('loss', 0);
      else if (isSolved(next)) finish('win', classicScore(mode.level, secondsRef.current));
    },
    [interactive, board, isTA, play, mode.level, finish],
  );

  // Time-attack clock.
  useEffect(() => {
    if (!isTA || !interactive) return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      setPlay((p) => tick(p, dt));
    }, TA_TICK_MS);
    return () => window.clearInterval(id);
  }, [isTA, interactive, runKey]);

  useEffect(() => {
    if (isTA && phase === 'live' && isTimeUp(play)) finish('over', timeAttackScore(play));
  }, [isTA, phase, play, finish]);

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => window.clearTimeout(id);
  }, [feedback]);

  useEffect(() => {
    if (phase !== 'over') return;
    const id = window.setTimeout(() => setShowResult(true), RESULT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [phase, runKey]);

  // Leaving the tab pauses the run, so no clock runs unseen.
  useEffect(() => {
    if (phase !== 'live') return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setPhase((p) => (p === 'live' ? 'paused' : p));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [phase]);

  // ── Input ──────────────────────────────────────────────────
  const primary = useCallback(() => {
    if (phase === 'idle' || phase === 'over') newRun();
    else if (phase === 'paused') togglePause();
    else act(focus, 'open');
  }, [phase, newRun, togglePause, act, focus]);

  const api = useRef({ act, primary, togglePause, requestNew, confirmPending, cancelPending, pending, interactive, focus, dims, swapped });
  api.current = { act, primary, togglePause, requestNew, confirmPending, cancelPending, pending, interactive, focus, dims, swapped };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreKey(e)) return;
      const a = api.current;
      if (a.pending) {
        if (e.key === 'Enter') {
          e.preventDefault();
          a.confirmPending();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          a.cancelPending();
        }
        return;
      }
      const dir = ARROWS[e.key];
      if (dir) {
        if (!a.interactive) return;
        e.preventDefault();
        setFocus(moveFocus(a.focus, dir, a.dims.cols, a.dims.rows, a.swapped));
        setShowFocus(true);
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        // A focused button, link or summary handles these keys itself (keyboard users activate it).
        if (handlesActivationKeys(e.target)) return;
        e.preventDefault();
        if (a.interactive) setShowFocus(true);
        a.primary();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!a.interactive) return;
        setShowFocus(true);
        a.act(a.focus, 'flag');
      } else if (isKey(e, ARCADE_KEYS.pause)) {
        e.preventDefault();
        a.togglePause();
      } else if (isKey(e, ARCADE_KEYS.restart)) {
        a.requestNew();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Stable board callbacks, so the memoised board only redraws when the cells change.
  const onOpen = useCallback((i: number) => api.current.act(i, 'open'), []);
  const onFlag = useCallback((i: number) => api.current.act(i, 'flag'), []);
  const onChord = useCallback((i: number) => api.current.act(i, 'chord'), []);
  const onPointer = useCallback(() => setShowFocus(false), []);

  // ── View ───────────────────────────────────────────────────
  const num = (n: number) => formatNumber(n, lang);
  const describe = useCallback(
    (i: number, view: CellView, cell: Cell) => {
      const r = Math.floor(i / dims.cols);
      const c = i % dims.cols;
      const vars = { r: (swapped ? c : r) + 1, c: (swapped ? r : c) + 1, n: cell.adjacent };
      if (view === 'open' && cell.adjacent > 0) return t('cellNumber', vars);
      return t(CELL_KEY[view][dental ? 1 : 0], vars);
    },
    [t, dental, dims.cols, swapped],
  );

  const flags = board.cells.reduce((n, c) => n + (c.flag ? 1 : 0), 0);
  const best = Math.max(stats.best, score);
  const newBest = result !== null && result.score > 0 && result.score > stats.bestBeforeRun;
  const modeName = isTA ? t('modeTimeAttack') : `${t(KIND_KEY[mode.kind])} · ${t(LEVEL_KEY[mode.level])}`;
  const remainingSec = Math.ceil(play.remainingMs / 1000);
  const dentalKey = (plain: MessageKey, tooth: MessageKey) => (dental ? tooth : plain);

  const statItems = isTA
    ? [
        { label: k('score'), value: num(score) },
        { label: k('best'), value: num(best), highlight: newBest },
        { label: t('statBoards'), value: num(play.solved) },
        { label: t('statLeft'), value: formatClock(remainingSec) },
      ]
    : [
        { label: k('score'), value: num(score) },
        { label: k('best'), value: num(best), highlight: newBest },
        { label: t(dentalKey('statMines', 'statMinesDental')), value: num(dims.mines - flags) },
        { label: k('time'), value: formatClock(seconds) },
      ];

  const keyRows = useMemo(
    () => KEYS.map(([keys, action]): [string, string] => [keys, t(action === 'keyFlag' && dental ? 'keyFlagDental' : action)]),
    [t, dental],
  );

  let overlay: { title: string; message: string; actions: OverlayAction[] } | null = null;
  if (pending) {
    overlay = {
      title: t('confirmTitle'),
      message: t(pending.kind === 'mode' ? 'confirmMode' : 'confirmRestart'),
      actions: [
        { label: t('confirmYes'), onClick: confirmPending, primary: true, kbd: 'Enter' },
        { label: t('confirmNo'), onClick: cancelPending, kbd: 'Esc' },
      ],
    };
  } else if (phase === 'idle') {
    overlay = {
      title: gameName(GAME, lang),
      message: isTA ? t(dentalKey('idleTa', 'idleTaDental')) : t(dentalKey('idleBody', 'idleBodyDental')),
      actions: [{ label: k('start'), onClick: newRun, primary: true, kbd: 'Space' }],
    };
  } else if (phase === 'paused') {
    overlay = welcomeBack
      ? {
          title: k('welcomeBack'),
          message: t('welcomeBody', { mode: modeName, time: formatClock(isTA ? remainingSec : seconds) }),
          actions: [
            { label: k('resume'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: k('newGame'), onClick: newRun },
          ],
        }
      : {
          title: k('paused'),
          message: t('pausedBody'),
          actions: [
            { label: k('resume'), onClick: togglePause, primary: true, kbd: 'P' },
            { label: k('newGame'), onClick: requestNew, kbd: 'R' },
          ],
        };
  } else if (phase === 'over' && result && showResult && !hideResult) {
    const actions: OverlayAction[] = [
      { label: t('playAgain'), onClick: newRun, primary: true, kbd: 'Space' },
      { label: t('viewBoard'), onClick: () => setHideResult(true) },
    ];
    if (result.outcome === 'win') {
      overlay = {
        title: t('winTitle'),
        message:
          t('winBody', { score: num(result.score), time: formatClock(result.seconds), best: num(best) }) +
          (newBest ? t('winNewBest') : ''),
        actions,
      };
    } else if (result.outcome === 'loss') {
      overlay = {
        title: t(dentalKey('lossTitle', 'lossTitleDental')),
        message: t(dentalKey('lossBody', 'lossBodyDental')),
        actions,
      };
    } else {
      overlay = {
        title: t('taTitle'),
        message:
          t('taBody', { boards: num(play.solved), score: num(result.score), best: num(best) }) +
          (newBest ? t('winNewBest') : ''),
        actions,
      };
    }
  }

  const modeNote = isTA
    ? t(dentalKey('taNote', 'taNoteDental'), { points: num(POINTS_PER_BOARD), s: num(MINE_PENALTY_MS / 1000) })
    : t(dentalKey('levelNote', 'levelNoteDental'), { cols: num(dims.cols), rows: num(dims.rows), mines: num(dims.mines) });

  return (
    <div className={`arc-game ${styles.game}`} style={{ '--game-color': 'var(--game-minesweeper)' } as CSSProperties}>
      {!embedded && (
        <header className="arc-game__head">
          <div>
            <h1 className="arc-game__title">{gameName(GAME, lang)}</h1>
            <p className="arc-game__sub">{t('subtitle')}</p>
          </div>
        </header>
      )}

      <StatPanel status={status} items={statItems} />

      <div className={styles.layout}>
        <div className={`arc-game__board ${styles.boardWrap}`} data-flash={feedback?.kind}>
          <div className={styles.boardInner} style={{ maxWidth: `${shown.cols * 40}px` }}>
            <Board
              board={board}
              dental={dental}
              swapped={swapped}
              focus={focus}
              showFocus={showFocus && interactive}
              label={t('boardLabel', { cols: num(shown.cols), rows: num(shown.rows) })}
              describe={describe}
              interactive={interactive}
              onOpen={onOpen}
              onFlag={onFlag}
              onChord={onChord}
              onPointer={onPointer}
            />
          </div>
          {feedback && (
            <div
              key={feedback.n}
              className={`${styles.toast} ${feedback.kind === 'mine' ? styles.toastMine : styles.toastSolved}`}
              data-testid={feedback.kind === 'mine' ? 'ms-penalty' : 'ms-bonus'}
              aria-live="polite"
            >
              {feedback.kind === 'mine'
                ? t('penalty', { s: num(MINE_PENALTY_MS / 1000) })
                : t('bonus', { points: num(POINTS_PER_BOARD) })}
            </div>
          )}
          {overlay && <GameOverlay {...overlay} />}
        </div>

        <aside className={styles.side}>
          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelGame')}</h2>
            <div className={styles.buttons}>
              <button
                type="button"
                className="arc-btn arc-btn--primary"
                onClick={phase === 'live' || phase === 'paused' ? togglePause : newRun}
                disabled={pending !== null}
              >
                {phase === 'live' ? k('pause') : phase === 'paused' ? k('resume') : phase === 'idle' ? k('start') : t('playAgain')}
              </button>
              <button type="button" className="arc-btn" onClick={requestNew} disabled={phase === 'idle' || pending !== null}>
                {k('newGame')}
              </button>
            </div>
            <div className={styles.save}>
              <SaveBadge savedAt={phase === 'live' || phase === 'paused' ? savedAt : null} onDiscard={discardSave} />
            </div>
            <p className={styles.note}>{t(dentalKey('mouseNote', 'mouseNoteDental'))}</p>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelMode')}</h2>
            <ModeSelect mode={mode} lastLevel={lastLevel} onChange={changeMode} />
            <p className={styles.note}>{modeNote}</p>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelSettings')}</h2>
            <div className={styles.settings}>
              <DentalToggle className={styles.dentalRow} />
            </div>
          </section>

          <section className="arc-panel">
            <h2 className="arc-panel__title">{t('panelKeys')}</h2>
            <KeyHelp rows={keyRows} />
          </section>
        </aside>
      </div>
    </div>
  );
}

export default MinesweeperGame;
