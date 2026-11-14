import { memo, useId, useRef, type MouseEvent, type PointerEvent } from 'react';
import { DecayedTooth, Toothbrush, useLongPress } from '../arcade';
import { isSolved } from '../logic/board';
import type { Board as BoardState, Cell } from '../logic/types';
import { cellView, type CellView } from './cellView';
import styles from './Board.module.css';

/** Long-press time that places a flag on touch screens (the kit's default). */
export const LONG_PRESS_MS = 400;

const SQ = 20; // square cell size (viewBox units)
const R = 11.5; // hex radius (centre to corner), pointy-top
const HW = Math.sqrt(3) * R; // hex width
const GAP = 0.9;

type Geometry = {
  width: number;
  height: number;
  center: (i: number) => [number, number];
  /** Polygon corners relative to the centre. */
  shape: string;
  inner: string;
  content: number;
};

const fmt = (n: number) => Number(n.toFixed(2));
const polygon = (pts: [number, number][], swapped: boolean) =>
  pts.map(([x, y]) => (swapped ? `${fmt(y)},${fmt(x)}` : `${fmt(x)},${fmt(y)}`)).join(' ');

/** Drawn size of a board in viewBox units (a square cell is 20 units wide). */
// eslint-disable-next-line react-refresh/only-export-components -- the layout size comes from the same geometry as the drawing
export function boardSize(board: Pick<BoardState, 'cols' | 'rows' | 'topology'>, swapped: boolean): { width: number; height: number } {
  const { width, height } = geometry(board, swapped);
  return { width: width + 2, height: height + 2 };
}

/** Width of one square cell in viewBox units. */
export const CELL_UNITS = SQ;

function geometry(board: Pick<BoardState, 'cols' | 'rows' | 'topology'>, swapped: boolean): Geometry {
  const { cols, rows, topology } = board;
  let w: number;
  let h: number;
  let centre: (r: number, c: number) => [number, number];
  let corners: (s: number) => [number, number][];
  let content: number;
  if (topology === 'hex') {
    w = HW * (cols + 0.5);
    h = 1.5 * R * (rows - 1) + 2 * R;
    centre = (r, c) => [HW * (c + 0.5 * (r & 1)) + HW / 2, 1.5 * R * r + R];
    corners = (s) => {
      const hw = (Math.sqrt(3) * s) / 2;
      return [[0, -s], [hw, -s / 2], [hw, s / 2], [0, s], [-hw, s / 2], [-hw, -s / 2]];
    };
    content = R * 1.25;
    const outer = corners(R - GAP);
    const inner = corners(R - GAP - 2.2);
    return {
      width: swapped ? h : w,
      height: swapped ? w : h,
      center: (i) => {
        const [x, y] = centre(Math.floor(i / cols), i % cols);
        return swapped ? [y, x] : [x, y];
      },
      shape: polygon(outer, swapped),
      inner: polygon(inner, swapped),
      content,
    };
  }
  w = cols * SQ;
  h = rows * SQ;
  centre = (r, c) => [c * SQ + SQ / 2, r * SQ + SQ / 2];
  corners = (s) => [[-s, -s], [s, -s], [s, s], [-s, s]];
  content = SQ * 0.78;
  return {
    width: swapped ? h : w,
    height: swapped ? w : h,
    center: (i) => {
      const [x, y] = centre(Math.floor(i / cols), i % cols);
      return swapped ? [y, x] : [x, y];
    },
    shape: polygon(corners(SQ / 2 - GAP), swapped),
    inner: polygon(corners(SQ / 2 - GAP - 2), swapped),
    content,
  };
}

/** Classic mine: a round body with spikes and a highlight. */
export function MineIcon({ s }: { s: number }) {
  const spikes = [0, 45, 90, 135].map((a) => {
    const rad = (a * Math.PI) / 180;
    const l = s * 0.42;
    return (
      <line key={a} x1={-Math.cos(rad) * l} y1={-Math.sin(rad) * l} x2={Math.cos(rad) * l} y2={Math.sin(rad) * l} />
    );
  });
  return (
    <g className={styles.mineIcon} data-testid="ms-mine">
      {spikes}
      <circle r={s * 0.27} />
      <circle className={styles.mineShine} r={s * 0.07} cx={-s * 0.09} cy={-s * 0.09} />
    </g>
  );
}

/** Classic flag: pole, triangular cloth and a base. */
function FlagIcon({ s }: { s: number }) {
  return (
    <g className={styles.flagIcon} data-testid="ms-flag">
      <line className={styles.flagPole} x1={-s * 0.12} y1={-s * 0.38} x2={-s * 0.12} y2={s * 0.3} />
      <path className={styles.flagCloth} d={`M${-s * 0.12} ${-s * 0.38} L${s * 0.3} ${-s * 0.2} L${-s * 0.12} ${-s * 0.02} Z`} />
      <path className={styles.flagPole} d={`M${-s * 0.32} ${s * 0.32} H${s * 0.12}`} />
    </g>
  );
}

export function Icon({ kind, dental, s }: { kind: 'mine' | 'flag'; dental: boolean; s: number }) {
  if (!dental) return kind === 'mine' ? <MineIcon s={s} /> : <FlagIcon s={s} />;
  const size = s * 0.95;
  return (
    <g transform={`translate(${fmt(-size / 2)} ${fmt(-size / 2)})`} data-testid={kind === 'mine' ? 'ms-mine-tooth' : 'ms-flag-brush'}>
      {kind === 'mine' ? <DecayedTooth size={size} /> : <Toothbrush size={size} />}
    </g>
  );
}

/** Burst behind the opened mine: a shape cue in addition to the red fill. */
function Burst({ s }: { s: number }) {
  const pts: string[] = [];
  for (let k = 0; k < 16; k += 1) {
    const a = (k * Math.PI) / 8;
    const r = k % 2 === 0 ? s * 0.55 : s * 0.3;
    pts.push(`${fmt(Math.cos(a) * r)},${fmt(Math.sin(a) * r)}`);
  }
  return <polygon className={styles.burst} points={pts.join(' ')} />;
}

export type BoardProps = {
  board: BoardState;
  dental?: boolean;
  /** Show the board rotated (portrait phones, see `displayDims`). */
  swapped?: boolean;
  /** Keyboard focus (logical index) and whether to draw its ring. */
  focus?: number;
  showFocus?: boolean;
  /** Accessible board name; omitted for the decorative demo. */
  label?: string;
  describe?: (index: number, view: CellView, cell: Cell) => string;
  interactive?: boolean;
  variant?: 'full' | 'mini';
  onOpen?: (index: number) => void;
  onFlag?: (index: number) => void;
  onChord?: (index: number) => void;
  /** Touch / pen long press (default: `onFlag`). */
  onLongPress?: (index: number) => void;
  /** Any pointer input on the board (hides the keyboard ring). */
  onPointer?: () => void;
};

function indexOf(target: EventTarget | null): number | null {
  const el = (target as Element | null)?.closest?.('[data-i]');
  if (!el) return null;
  const i = Number(el.getAttribute('data-i'));
  return Number.isInteger(i) ? i : null;
}

/**
 * Square or hexagonal minefield drawn as SVG polygons (hex: odd-r offset rows,
 * pointy-top; rotated it becomes odd-q flat-top, which keeps the neighbours
 * where the eye expects them). Numbers are digits; colour is only extra.
 * Pointer input is delegated: click opens (or chords an open number),
 * right-click / long-press (touch, pen) flags, double-click chords.
 */
function BoardView({
  board,
  dental = false,
  swapped = false,
  focus = -1,
  showFocus = false,
  label,
  describe,
  interactive = false,
  variant = 'full',
  onOpen,
  onFlag,
  onChord,
  onLongPress,
  onPointer,
}: BoardProps) {
  const uid = useId();
  const geo = geometry(board, swapped);
  const won = isSolved(board);
  /** The last press: Android's contextmenu after a touch long press must not flag a second time. */
  const press = useRef<{ i: number; touch: boolean } | null>(null);
  // The kit's long press: vibrates, swallows the click after the release, and gives up when the finger
  // drifts (a pan of the board frame) or the browser cancels the pointer (it took the gesture to scroll).
  const longPress = useLongPress(
    (e) => {
      const i = indexOf(e.target);
      if (i !== null) (onLongPress ?? onFlag)?.(i);
    },
    { ms: LONG_PRESS_MS },
  );
  /** Whether the cell was already open at the first click of a double-click. */
  const openAtFirstClick = useRef<{ i: number; open: boolean } | null>(null);
  /** Cell of the previous click: a click counter above 1 only means a double-click on that same cell. */
  const lastClick = useRef<number | null>(null);
  const mini = variant === 'mini';
  const cellId = (i: number) => `${uid}-cell-${i}`;

  const handlers = interactive
    ? {
        onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
          onPointer?.();
          const i = indexOf(e.target);
          const touch = e.pointerType !== 'mouse';
          press.current = i === null ? null : { i, touch };
          // A held mouse button stays a plain click; only touch and pen press long.
          if (touch && i !== null) longPress.onPointerDown(e);
        },
        onPointerUp: longPress.onPointerUp,
        onPointerCancel: longPress.onPointerCancel,
        onPointerLeave: longPress.onPointerLeave,
        onClick: (e: MouseEvent<SVGSVGElement>) => {
          const i = indexOf(e.target);
          if (i === null) return;
          // Second click of a double-click on the same cell: the double-click handler decides.
          // A fast click on another cell (some browsers still count it) is a normal click.
          if (e.detail >= 2 && lastClick.current === i) return;
          lastClick.current = i;
          openAtFirstClick.current = { i, open: board.cells[i]?.open ?? false };
          onOpen?.(i);
        },
        onDoubleClick: (e: MouseEvent<SVGSVGElement>) => {
          const i = indexOf(e.target);
          const first = openAtFirstClick.current;
          if (i === null || !first || first.i !== i || !first.open) return;
          onChord?.(i);
        },
        onContextMenu: (e: MouseEvent<SVGSVGElement>) => {
          e.preventDefault();
          const i = indexOf(e.target);
          const p = press.current;
          // A touch long-press is handled by its own timer (Android also fires contextmenu).
          if (i === null || (p && p.touch && p.i === i)) return;
          onFlag?.(i);
        },
      }
    : {};

  const s = geo.content;
  return (
    <svg
      className={`${styles.board}${mini ? ` ${styles.mini}` : ''}${interactive ? ` ${styles.live}` : ''}`}
      viewBox={`-1 -1 ${fmt(geo.width + 2)} ${fmt(geo.height + 2)}`}
      role={mini ? undefined : 'group'}
      aria-label={mini ? undefined : label}
      aria-hidden={mini ? true : undefined}
      aria-activedescendant={!mini && focus >= 0 ? cellId(focus) : undefined}
      tabIndex={mini || !interactive ? undefined : 0}
      data-topology={board.topology}
      data-cols={swapped ? board.rows : board.cols}
      data-rows={swapped ? board.cols : board.rows}
      data-dental={dental ? 'true' : 'false'}
      {...handlers}
    >
      {board.cells.map((cell, i) => {
        const view = cellView(board, cell, won);
        const [x, y] = geo.center(i);
        const focused = showFocus && i === focus;
        const opened = view === 'open' || view === 'exploded';
        return (
          <g
            key={i}
            id={mini ? undefined : cellId(i)}
            data-i={i}
            data-state={view}
            data-focus={focused ? 'true' : undefined}
            role={mini ? undefined : 'button'}
            aria-label={mini ? undefined : describe?.(i, view, cell)}
            className={`${styles.cell} ${styles[view]}`}
            transform={`translate(${fmt(x)} ${fmt(y)})`}
          >
            <polygon className={styles.face} points={geo.shape} />
            {!opened && <polygon className={styles.bevel} points={geo.inner} />}
            {view === 'open' && cell.adjacent > 0 && (
              <text className={`${styles.num} ${styles[`n${cell.adjacent}`]}`} fontSize={s * 0.82} dy="0.35em">
                {cell.adjacent}
              </text>
            )}
            {view === 'exploded' && <Burst s={s} />}
            {(view === 'mine' || view === 'exploded') && <Icon kind="mine" dental={dental} s={s} />}
            {(view === 'flag' || view === 'wrong') && <Icon kind="flag" dental={dental} s={s} />}
            {view === 'wrong' && (
              <path className={styles.cross} d={`M${-s * 0.42} ${-s * 0.42} L${s * 0.42} ${s * 0.42} M${s * 0.42} ${-s * 0.42} L${-s * 0.42} ${s * 0.42}`} />
            )}
            {focused && <polygon className={styles.ring} points={geo.shape} />}
          </g>
        );
      })}
    </svg>
  );
}

export const Board = memo(BoardView);
export default Board;
