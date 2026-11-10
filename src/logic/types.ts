export type Topology = 'square' | 'hex';

export interface Cell {
  mine: boolean;
  adjacent: number;
  open: boolean;
  flag: boolean;
}

export interface Board {
  topology: Topology;
  cols: number;
  rows: number;
  mines: number;
  cells: Cell[];
  seed: number;
  generated: boolean;
  /** Index of the mine that was opened, or null. */
  exploded: number | null;
}
