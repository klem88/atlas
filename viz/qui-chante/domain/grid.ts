/**
 * Grille de mailles : passage d'un point à sa maille, voisinage, blocs de fichiers.
 * Une maille est identifiée par un entier `row * cols + col` (row 0 au sud, col 0 à l'ouest).
 */
import type { GridSpec } from '../data/contract';

export interface CellCoords {
  col: number;
  row: number;
}

/** Maille contenant le point, ou null s'il sort de la grille. */
export function cellAt(grid: GridSpec, lon: number, lat: number): number | null {
  const col = Math.floor((lon - grid.lon0) / grid.dLon);
  const row = Math.floor((lat - grid.lat0) / grid.dLat);
  if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return null;
  return row * grid.cols + col;
}

export function cellCoords(grid: GridSpec, id: number): CellCoords {
  return { col: id % grid.cols, row: Math.floor(id / grid.cols) };
}

/** Rectangle de la maille : [ouest, sud, est, nord], en degrés. */
export function cellBounds(grid: GridSpec, id: number): [number, number, number, number] {
  const { col, row } = cellCoords(grid, id);
  const w = grid.lon0 + col * grid.dLon;
  const s = grid.lat0 + row * grid.dLat;
  return [round(w), round(s), round(w + grid.dLon), round(s + grid.dLat)];
}

/** La maille et ses voisines dans un rayon de `radius` mailles (3 × 3 pour radius = 1), bords de grille exclus. */
export function neighborhood(grid: GridSpec, id: number, radius = 1): number[] {
  const { col, row } = cellCoords(grid, id);
  const out: number[] = [];
  for (let r = row - radius; r <= row + radius; r++) {
    for (let c = col - radius; c <= col + radius; c++) {
      if (c >= 0 && r >= 0 && c < grid.cols && r < grid.rows) out.push(r * grid.cols + c);
    }
  }
  return out;
}

/** Nom du bloc de fichiers qui contient la maille (« 3-5 » = colonne de blocs 3, rangée 5). */
export function blockOf(grid: GridSpec, id: number): string {
  const { col, row } = cellCoords(grid, id);
  return `${Math.floor(col / grid.block)}-${Math.floor(row / grid.block)}`;
}

/** Polygone WKT de la maille, sens antihoraire (attendu par l'API GBIF). */
export function cellWkt(grid: GridSpec, id: number): string {
  const [w, s, e, n] = cellBounds(grid, id);
  return `POLYGON((${w} ${s},${e} ${s},${e} ${n},${w} ${n},${w} ${s}))`;
}

const round = (x: number) => Math.round(x * 1e6) / 1e6;
