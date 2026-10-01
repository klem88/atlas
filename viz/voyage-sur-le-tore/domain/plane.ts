/**
 * Le Tonnetz déplié : le réseau (a quintes, b tierces majeures) posé à plat en triangles équilatéraux. Un nœud (a, b)
 * est en x = a + b/2, y = −b·√3/2 ; une triade majeure est un triangle pointe en haut, une mineure pointe en bas.
 * Le plan est périodique (vecteurs (4, 2) et (0, 3)) : on le dessine en mosaïque, et un chemin ne « saute » jamais :
 * chaque accord est posé sur l'instance la plus proche du précédent. Pur.
 */
import { latticeOf, triadLattice, type Triad } from './tonnetz';

export const ROW_H = Math.sqrt(3) / 2;
/** Vecteurs de périodicité du réseau modulo l'octave. */
export const PERIODS: readonly [number, number][] = [
  [4, 2],
  [0, 3],
];

export interface XY {
  x: number;
  y: number;
}

export const nodeXY = (a: number, b: number): XY => ({ x: a + b / 2, y: -b * ROW_H });

/** Centre du triangle d'une triade, dans le domaine fondamental. */
export function triadXY(t: Triad): XY {
  const { a, b } = triadLattice(t);
  return nodeXY(a, b);
}

/** Les trois sommets (en coordonnées de réseau) d'une triade posée en (a, b) de fondamentale. */
export function triangleOf(t: Triad, a: number, b: number): [number, number][] {
  return t.mode === 'maj'
    ? [
        [a, b],
        [a + 1, b],
        [a, b + 1],
      ]
    : [
        [a, b],
        [a + 1, b - 1],
        [a + 1, b],
      ];
}

/** L'instance (a, b) de la position de réseau `target` la plus proche du point `from`, à une période près. */
export function nearestInstance(target: { a: number; b: number }, from: XY, range = 3): { a: number; b: number } {
  let best = { a: target.a, b: target.b };
  let bestD = Infinity;
  for (let i = -range; i <= range; i++) {
    for (let j = -range; j <= range; j++) {
      const a = target.a + i * PERIODS[0]![0] + j * PERIODS[1]![0];
      const b = target.b + i * PERIODS[0]![1] + j * PERIODS[1]![1];
      const p = nodeXY(a, b);
      const d = (p.x - from.x) ** 2 + (p.y - from.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = { a, b };
      }
    }
  }
  return best;
}

export interface PlanePoint extends XY {
  a: number;
  b: number;
  triad: Triad;
}

/** Les positions déroulées d'une suite de triades : chaque pas rejoint l'instance la plus proche de la précédente. */
export function unwrapPath(triads: readonly Triad[]): PlanePoint[] {
  const out: PlanePoint[] = [];
  let prev: XY | null = null;
  for (const t of triads) {
    const base = triadLattice(t);
    const inst = prev ? nearestInstance(base, prev) : base;
    const p = nodeXY(inst.a, inst.b);
    out.push({ ...p, a: inst.a, b: inst.b, triad: t });
    prev = p;
  }
  return out;
}

/** Coordonnées de réseau (entières) de la fondamentale d'une instance de triade (depuis le centre fractionnaire). */
export function rootOfInstance(t: Triad, a: number, b: number): { a: number; b: number } {
  return t.mode === 'maj' ? { a: Math.round(a - 1 / 3), b: Math.round(b - 1 / 3) } : { a: Math.round(a - 2 / 3), b: Math.round(b + 1 / 3) };
}

/** Les nœuds du réseau dont le point tombe dans la fenêtre (avec une marge), pour dessiner la mosaïque. */
export function nodesInView(view: { x0: number; y0: number; x1: number; y1: number }, margin = 1.5): { a: number; b: number; pc: number }[] {
  const out: { a: number; b: number; pc: number }[] = [];
  const bMin = Math.floor(-(view.y1 + margin) / ROW_H);
  const bMax = Math.ceil(-(view.y0 - margin) / ROW_H);
  for (let b = bMin; b <= bMax; b++) {
    const aMin = Math.floor(view.x0 - margin - b / 2);
    const aMax = Math.ceil(view.x1 + margin - b / 2);
    for (let a = aMin; a <= aMax; a++) out.push({ a, b, pc: (((7 * a + 4 * b) % 12) + 12) % 12 });
  }
  return out;
}

/** La triade dont le triangle a pour fondamentale le nœud (a, b), pour chaque orientation. */
export const triadAt = (a: number, b: number, mode: 'maj' | 'min'): Triad => ({ root: (((7 * a + 4 * b) % 12) + 12) % 12, mode });

export { latticeOf };
