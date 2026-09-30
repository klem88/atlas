/**
 * Comptage des transitions entre degrés : pour chaque section d'un morceau, chaque paire de jetons consécutifs
 * (la suite est déjà sans répétition immédiate) compte une fois. Fonctions pures.
 */
import { SECTION_BREAK } from '@tools/lib/degrees-corpus';

/** Matrice 72 × 72 à plat : `counts[a * 72 + b]`. */
export type Matrix = Uint32Array;
export const TOKENS = 72;
export const newMatrix = (): Matrix => new Uint32Array(TOKENS * TOKENS);

/** Ajoute les transitions d'une suite compacte (sections séparées par `SECTION_BREAK`) à la matrice. Renvoie le nombre ajouté. */
export function addTransitions(m: Matrix, tokens: ArrayLike<number>): number {
  let prev = -1;
  let n = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t === SECTION_BREAK) {
      prev = -1;
      continue;
    }
    if (prev >= 0 && prev !== t) {
      m[prev * TOKENS + t]!++;
      n++;
    }
    prev = t;
  }
  return n;
}

/** Lignes triées par nombre décroissant, au-dessus du seuil. */
export function matrixRows(m: Matrix, min: number): [number, number, number][] {
  const rows: [number, number, number][] = [];
  for (let i = 0; i < m.length; i++) {
    const n = m[i]!;
    if (n >= min) rows.push([Math.floor(i / TOKENS), i % TOKENS, n]);
  }
  return rows.sort((x, y) => y[2] - x[2]);
}
