/**
 * La boussole : des parts de transitions d'un style aux rayons d'une rose (rapport au corpus, échelle log bornée),
 * aux transitions signatures, et à la ressemblance d'un morceau avec chaque style (cosinus avec le centre). Pur.
 */
import { degreeLabel, tokenToDegree } from '@shell/music/degrees';
import { AXES, MIN_SHARE, SIGNATURES, type Signature, type StyleRose, type Transition } from '../data/contract';

export const CLASSES = 24;
export const DIMS = CLASSES * CLASSES;
/** Sépare deux sections dans une suite de jetons (même valeur que dans le cache commun des degrés). */
export const SECTION_BREAK = 255;

/** Jeton (< 72) → classe (0–23) : degré × mode (diminués comptés mineurs, augmentés et suspendus majeurs). */
export function classOfToken(t: number): number {
  const d = tokenToDegree(t);
  return d.step * 2 + (d.cls === 'min' || d.cls === 'dim' ? 1 : 0);
}

/**
 * Vecteur d'un morceau : fréquences des 576 transitions entre classes, en racine carrée (distance de Hellinger :
 * les transitions rares pèsent un peu plus) ; `null` s'il a moins de `minTransitions` transitions.
 */
export function songVector(tokens: ArrayLike<number>, minTransitions = 8): Float32Array | null {
  const v = new Float32Array(DIMS);
  let prev = -1;
  let n = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t === SECTION_BREAK) {
      prev = -1;
      continue;
    }
    const c = classOfToken(t);
    if (prev >= 0 && prev !== c) {
      v[prev * CLASSES + c]!++;
      n++;
    }
    prev = c;
  }
  if (n < minTransitions) return null;
  for (let i = 0; i < DIMS; i++) v[i] = Math.sqrt(v[i]! / n);
  return v;
}

/** Étiquette d'une classe : « I », « ii », « V »… (les 24 classes sont degré × majeur/mineur). */
export const classLabel = (c: number) => degreeLabel({ step: Math.floor(c / 2), cls: c % 2 === 1 ? 'min' : 'maj' });
export const transitionLabel = ([a, b]: Transition) => `${classLabel(a)} → ${classLabel(b)}`;

/** Parts (somme 1) depuis des comptes par transition. */
export function shares(counts: ArrayLike<number>): number[] {
  let total = 0;
  for (let i = 0; i < counts.length; i++) total += counts[i]!;
  return Array.from({ length: counts.length }, (_, i) => (total ? counts[i]! / total : 0));
}

/** Les `n` transitions les plus fréquentes d'un vecteur de parts. */
export function topTransitions(share: readonly number[], n = AXES): { transition: Transition; base: number }[] {
  return share
    .map((s, i) => ({ transition: [Math.floor(i / CLASSES), i % CLASSES] as Transition, base: s }))
    .sort((a, b) => b.base - a.base)
    .slice(0, n);
}

/** Rayon d'un axe : le rapport style / ensemble, ramené en échelle log entre 0 (≤ ¼) et 1 (≥ 4), 0,5 = comme tout le monde. */
export function radius(lift: number): number {
  if (!(lift > 0)) return 0;
  const l = Math.log2(lift); // −2 … 2
  return Math.min(1, Math.max(0, (l + 2) / 4));
}

export function roseAxes(styleShare: readonly number[], baseShare: readonly number[], axes: readonly { transition: Transition }[]): number[] {
  return axes.map(({ transition: [a, b] }) => {
    const i = a * CLASSES + b;
    return baseShare[i]! > 0 ? styleShare[i]! / baseShare[i]! : 0;
  });
}

/** Les transitions les plus sur-représentées dans le style, parmi celles qui y pèsent assez. */
export function signatures(styleShare: readonly number[], baseShare: readonly number[], n = SIGNATURES, minShare = MIN_SHARE): Signature[] {
  const out: Signature[] = [];
  for (let i = 0; i < styleShare.length; i++) {
    const share = styleShare[i]!;
    const base = baseShare[i]!;
    if (share < minShare || base <= 0) continue;
    out.push({ from: Math.floor(i / CLASSES), to: i % CLASSES, share, base, lift: share / base });
  }
  return out.sort((a, b) => b.lift - a.lift).slice(0, n);
}

/** Similarité cosinus entre un vecteur (racine des fréquences) et un centre. */
export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** Les styles classés par ressemblance avec un morceau. */
export function nearestStyles(vector: ArrayLike<number>, styles: readonly StyleRose[]): { style: StyleRose; similarity: number }[] {
  return styles.map((style) => ({ style, similarity: cosine(vector, style.centroid) })).sort((a, b) => b.similarity - a.similarity);
}

/** « 2,3 × plus que la moyenne », « moitié moins »… */
export function liftWords(lift: number): string {
  if (lift >= 1.15) return `${lift.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} × plus que la moyenne`;
  if (lift <= 0.87) return `${(1 / lift).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} × moins que la moyenne`;
  return 'comme la moyenne';
}
