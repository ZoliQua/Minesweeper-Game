import type { ReactNode } from 'react';
import { formatNumber, useDental, useIsTouch, useKitMessages, useLang, useMessages, type RulesSection } from './arcade';
import { CELL_UNITS, Icon } from './components/Board';
import boardStyles from './components/Board.module.css';
import { KIND_KEY, LEVEL_KEY, MESSAGES } from './i18n';
import { neighbours } from './logic/board';
import { LEVELS, MODES, type ModeKind } from './logic/modes';
import { classicScore, MAX_SCORE, SCORE_TABLE } from './logic/scoring';
import { MINE_PENALTY_MS, POINTS_PER_BOARD, TIME_ATTACK_MS } from './logic/timeAttack';

/** The diagram: a 3 × 3 square patch, the open centre shows how many of its neighbours are mines. */
const SIDE = 3;
const CENTRE = 4;
const DIAGRAM_MINES = [0, 5];
const DIAGRAM_NEIGHBOURS = neighbours('square', SIDE, SIDE, CENTRE);

/** Most neighbours a cell can have on a topology (an inner cell of a 5 × 5 board). */
const mostNeighbours = (topology: 'square' | 'hex') => neighbours(topology, 5, 5, 12).length;

export function NumberDiagram() {
  const m = useMessages(MESSAGES);
  const [lang] = useLang();
  const [dental] = useDental();
  const num = (n: number) => formatNumber(n, lang);
  const n = DIAGRAM_MINES.length;
  const vars = { n: num(n), total: num(DIAGRAM_NEIGHBOURS.length), safe: num(DIAGRAM_NEIGHBOURS.length - n) };
  const s = CELL_UNITS;
  const half = s / 2 - 0.9;
  const square = (d: number) => `${-d},${-d} ${d},${-d} ${d},${d} ${-d},${d}`;
  return (
    <figure style={{ margin: '8px 0' }}>
      <svg
        className={boardStyles.board}
        viewBox={`-2 -2 ${SIDE * s + 4} ${SIDE * s + 4}`}
        role="img"
        aria-label={m(dental ? 'rulesDiagramLabelDental' : 'rulesDiagramLabel', vars)}
        style={{ width: '100%', maxWidth: 168, margin: '0 auto' }}
      >
        {Array.from({ length: SIDE * SIDE }, (_, i) => {
          const x = (i % SIDE) * s + s / 2;
          const y = Math.floor(i / SIDE) * s + s / 2;
          const open = i === CENTRE;
          const mine = DIAGRAM_MINES.includes(i);
          return (
            <g key={i} className={`${boardStyles.cell} ${open ? boardStyles.open : boardStyles.hidden}`} transform={`translate(${x} ${y})`}>
              <polygon className={boardStyles.face} points={square(half)} />
              {!open && <polygon className={boardStyles.bevel} points={square(half - 2)} />}
              {open && (
                <text className={`${boardStyles.num} ${boardStyles.n2}`} fontSize={s * 0.64} dy="0.35em">
                  {num(n)}
                </text>
              )}
              {mine && <Icon kind="mine" dental={dental} s={s * 0.78} />}
              {/* A dashed ring marks the counted cells by shape, not by colour. */}
              {mine && <polygon points={square(half - 0.6)} fill="none" stroke="var(--text)" strokeWidth={1.1} strokeDasharray="2.2 1.6" />}
            </g>
          );
        })}
      </svg>
      <figcaption style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-dim)' }}>
        {m(dental ? 'rulesDiagramCaptionDental' : 'rulesDiagramCaption', vars)}
      </figcaption>
    </figure>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the diagram and its hook belong together
export function useRulesSections(): RulesSection[] {
  const m = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const touch = useIsTouch();
  const num = (n: number) => formatNumber(n, lang);
  const ios = typeof navigator !== 'undefined' && /iP(hone|od)/.test(navigator.userAgent);

  const sizes = (kind: Exclude<ModeKind, 'timeAttack'>) =>
    m('rulesSizes', {
      mode: m(KIND_KEY[kind]),
      list: LEVELS.map((level) => {
        const d = MODES[kind][level];
        return m('rulesSize', { level: m(LEVEL_KEY[level]), cols: num(d.cols), rows: num(d.rows), mines: num(d.mines) });
      }).join('; '),
    });

  const mobile: ReactNode = (
    <ul>
      <li>{m('rulesMobileTap')}</li>
      <li>{m('rulesMobileHold')}</li>
      <li>{m('rulesMobileFlagMode')}</li>
      <li>{m('rulesMobilePan')}</li>
      <li>{m('rulesMobileFs')}</li>
      {ios && <li>{k('iosHomeScreenTip')}</li>}
    </ul>
  );

  return [
    {
      id: 'goal',
      body: (
        <>
          <p>{m('rulesGoal', { square: num(mostNeighbours('square')), hex: num(mostNeighbours('hex')) })}</p>
          <NumberDiagram />
        </>
      ),
    },
    { id: 'play', body: <p>{touch ? m('rulesPlayTouch') : m('rulesPlayKeys')}</p> },
    {
      id: 'rules',
      body: (
        <ul>
          <li>{m('rulesFirstOpen')}</li>
          <li>{sizes('classic')}</li>
          <li>{sizes('hex')}</li>
          <li>
            {m('rulesTimeAttack', {
              mode: m('modeTimeAttack'),
              min: num(TIME_ATTACK_MS / 60_000),
              s: num(MINE_PENALTY_MS / 1000),
            })}
          </li>
          <li>{m('rulesClock')}</li>
        </ul>
      ),
    },
    {
      id: 'scoring',
      body: (
        <>
          <p>{m('rulesScoreIntro')}</p>
          <ul>
            {LEVELS.map((level) => {
              const { par } = SCORE_TABLE[level];
              return (
                <li key={level}>
                  {m('rulesScoreLevel', {
                    level: m(LEVEL_KEY[level]),
                    base: num(classicScore(level, par)),
                    par: num(par),
                    double: num(par * 2),
                    half: num(classicScore(level, par * 2)),
                    min: num(classicScore(level, Number.MAX_SAFE_INTEGER)),
                  })}
                </li>
              );
            })}
          </ul>
          <p>{m('rulesScoreZero')}</p>
          <p>
            {m('rulesScoreTa', {
              mode: m('modeTimeAttack'),
              points: num(POINTS_PER_BOARD),
              cap: num(MAX_SCORE),
              boards: num(Math.floor(MAX_SCORE / POINTS_PER_BOARD)),
            })}
          </p>
        </>
      ),
    },
    { id: 'dental', body: <p>{m('rulesDentalText')}</p> },
    { id: 'mobile', body: mobile },
  ];
}
