/**
 * Le Tonnetz replié en tore.
 *
 * Réseau : une note = un point (a, b) où a compte les quintes et b les tierces majeures (classe de hauteur 7a + 4b).
 * Modulo l'octave, ce réseau est un tore : on identifie (a, b) et (a, b) + (4, 2) (quatre quintes et deux tierces
 * font 36 demi-tons, trois octaves) ainsi que (a, b) + (0, 3) (trois tierces majeures font une octave). Le tore a donc
 * quatre « colonnes » de quintes autour du grand cercle et trois « rangées » de tierces autour du tube ; le cycle des
 * quintes y tourne en hélice. Une triade majeure est le triangle {p, p+4, p+7}, une mineure {p, p+3, p+7} ; chacune
 * a une position (le centre de son triangle). Distance entre deux triades : nombre minimal de transformations
 * néo-riemanniennes P (parallèle), L (échange de sensible), R (relative). Tout est pur.
 */
import type { Chord, TriadClass } from '@shell/music/chords';
import { triadClass } from '@shell/music/chords';

export interface Triad {
  root: number;
  mode: 'maj' | 'min';
}

export const TRIADS: readonly Triad[] = Array.from({ length: 24 }, (_, i) => ({ root: i % 12, mode: i < 12 ? 'maj' : 'min' }));
export const triadIndex = (t: Triad) => (t.mode === 'maj' ? 0 : 12) + ((t.root % 12) + 12) % 12;
export const triadOf = (i: number): Triad => TRIADS[i]!;

/** Un accord quelconque ramené à la triade la plus proche ; `exact` dit si c'était déjà une triade majeure ou mineure (septièmes comprises). */
export function nearestTriad(chord: Chord): { triad: Triad; exact: boolean } {
  const cls: TriadClass = triadClass(chord.quality);
  if (cls === 'maj') return { triad: { root: chord.root, mode: 'maj' }, exact: true };
  if (cls === 'min') return { triad: { root: chord.root, mode: 'min' }, exact: true };
  // Diminué : partage fondamentale et tierce mineure avec le mineur ; augmenté et suspendu : avec le majeur.
  return { triad: { root: chord.root, mode: cls === 'dim' ? 'min' : 'maj' }, exact: false };
}

/* Réseau ------------------------------------------------------------------------------------------------------- */

/** Coordonnées (a, b) d'une classe de hauteur dans le domaine fondamental : a ∈ [0, 4), b ∈ [0, 3). */
export function latticeOf(pc: number): { a: number; b: number } {
  for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) if ((7 * a + 4 * b) % 12 === ((pc % 12) + 12) % 12) return { a, b };
  throw new Error(`classe de hauteur ${pc}`);
}

/** Coordonnées du tore (s autour du grand cercle, t autour du tube), dans [0, 1), depuis des coordonnées de réseau (réelles). */
export function torusCoords(a: number, b: number): { s: number; t: number } {
  const s = a / 4;
  const t = (b - a / 2) / 3;
  return { s: wrap(s), t: wrap(t) };
}

const wrap = (x: number) => ((x % 1) + 1) % 1;

/**
 * Centre du triangle d'une triade en coordonnées de réseau : majeur = {(a,b), (a,b+1), (a+1,b)}, mineur = {(a,b), (a+1,b−1), (a+1,b)},
 * où (a, b) est la fondamentale.
 */
export function triadLattice(t: Triad): { a: number; b: number } {
  const { a, b } = latticeOf(t.root);
  return t.mode === 'maj' ? { a: a + 1 / 3, b: b + 1 / 3 } : { a: a + 2 / 3, b: b - 1 / 3 };
}

export const triadTorus = (t: Triad) => {
  const { a, b } = triadLattice(t);
  return torusCoords(a, b);
};

export const MAJOR_RADIUS = 2.1;
export const MINOR_RADIUS = 0.95;

/** Point 3D d'une position (s, t) du tore, à `lift` au-dessus de la surface. */
export function torusPoint(s: number, t: number, lift = 0, R = MAJOR_RADIUS, r = MINOR_RADIUS): { x: number; y: number; z: number } {
  const θ = s * 2 * Math.PI;
  const φ = t * 2 * Math.PI;
  const rr = r + lift;
  return { x: (R + rr * Math.cos(φ)) * Math.cos(θ), y: rr * Math.sin(φ), z: (R + rr * Math.cos(φ)) * Math.sin(θ) };
}

/** Le plus court chemin (s, t) entre deux positions, en tenant compte des deux enroulements ; renvoie le déplacement signé. */
export function shortestDelta(from: { s: number; t: number }, to: { s: number; t: number }): { ds: number; dt: number } {
  const d = (x: number) => ((((x + 0.5) % 1) + 1) % 1) - 0.5;
  return { ds: d(to.s - from.s), dt: d(to.t - from.t) };
}

/** Points intermédiaires sur la surface (pour tracer un pas), en coordonnées du tore. */
export function pathBetween(from: { s: number; t: number }, to: { s: number; t: number }, steps = 12): { s: number; t: number }[] {
  const { ds, dt } = shortestDelta(from, to);
  return Array.from({ length: steps + 1 }, (_, i) => ({ s: wrap(from.s + (ds * i) / steps), t: wrap(from.t + (dt * i) / steps) }));
}

/* P, L, R ------------------------------------------------------------------------------------------------------- */

export function P(t: Triad): Triad {
  return { root: t.root, mode: t.mode === 'maj' ? 'min' : 'maj' };
}
export function R(t: Triad): Triad {
  return t.mode === 'maj' ? { root: (t.root + 9) % 12, mode: 'min' } : { root: (t.root + 3) % 12, mode: 'maj' };
}
export function L(t: Triad): Triad {
  return t.mode === 'maj' ? { root: (t.root + 4) % 12, mode: 'min' } : { root: (t.root + 8) % 12, mode: 'maj' };
}

/** Table 24 × 24 des distances PLR (parcours en largeur), calculée une fois. */
export const PLR_DISTANCE: readonly number[] = (() => {
  const d = new Array<number>(24 * 24).fill(-1);
  for (let i = 0; i < 24; i++) {
    d[i * 24 + i] = 0;
    const queue = [i];
    while (queue.length) {
      const cur = queue.shift()!;
      const dist = d[i * 24 + cur]!;
      for (const f of [P, L, R]) {
        const n = triadIndex(f(triadOf(cur)));
        if (d[i * 24 + n]! < 0) {
          d[i * 24 + n] = dist + 1;
          queue.push(n);
        }
      }
    }
  }
  return d;
})();

export const plrDistance = (a: Triad, b: Triad) => PLR_DISTANCE[triadIndex(a) * 24 + triadIndex(b)]!;

/* Statistiques d'un chemin -------------------------------------------------------------------------------------- */

export interface PathStep {
  from: Triad;
  to: Triad;
  distance: number;
  /** Indice de l'accord d'arrivée dans la liste. */
  index: number;
}

export interface PathStats {
  steps: PathStep[];
  mean: number;
  /** Le plus grand saut (le premier s'il y en a plusieurs). */
  longest: PathStep | null;
  /** Répartition des distances : indice = distance (0 à 5+). */
  histogram: number[];
}

/** Les pas d'une suite de triades (les répétitions ne comptent pas), leurs distances et le résumé. */
export function pathStats(triads: readonly (Triad | null)[]): PathStats {
  const steps: PathStep[] = [];
  let prev: Triad | null = null;
  triads.forEach((t, i) => {
    if (!t) return;
    if (prev && triadIndex(prev) !== triadIndex(t)) steps.push({ from: prev, to: t, distance: plrDistance(prev, t), index: i });
    prev = t;
  });
  const histogram = new Array<number>(6).fill(0);
  for (const s of steps) histogram[Math.min(5, s.distance)]!++;
  const mean = steps.length ? steps.reduce((a, s) => a + s.distance, 0) / steps.length : 0;
  const longest = steps.reduce<PathStep | null>((best, s) => (best && best.distance >= s.distance ? best : s), null);
  return { steps, mean, longest, histogram };
}

const ROOTS = ['do', 'ré♭', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
export const triadName = (t: Triad) => `${ROOTS[t.root]} ${t.mode === 'maj' ? 'majeur' : 'mineur'}`;
export const triadShort = (t: Triad) => `${ROOTS[t.root]}${t.mode === 'min' ? 'm' : ''}`;
