/**
 * Rugosité de deux sons : modèle de Plomp et Levelt (1965) paramétré par Sethares (1993).
 * Deux partiels proches (à moins d'une bande critique) battent et « râpent » ; la gêne est maximale
 * vers un quart de bande critique, nulle à l'unisson et loin. La rugosité de deux notes est la somme
 * sur toutes les paires de partiels. Les vallées de la courbe sont les intervalles consonants.
 */

const B1 = 3.5;
const B2 = 5.75;
const D_STAR = 0.24;
const S1 = 0.021;
const S2 = 19;
/** Décroissance des amplitudes d'un harmonique au suivant (Sethares). */
export const AMP_DECAY = 0.88;

/** Dissonance de deux partiels de fréquences f1, f2 (Hz) et d'amplitudes a1, a2. */
export function roughnessPair(f1: number, a1: number, f2: number, a2: number): number {
  const fmin = Math.min(f1, f2);
  const s = D_STAR / (S1 * fmin + S2);
  const x = Math.abs(f2 - f1);
  return a1 * a2 * (Math.exp(-B1 * s * x) - Math.exp(-B2 * s * x));
}

export interface Partial {
  hz: number;
  amp: number;
}

/** Les n premiers harmoniques d'une fondamentale, amplitudes en 0,88ⁿ. */
export function partials(f0: number, n: number): Partial[] {
  return Array.from({ length: n }, (_, i) => ({ hz: f0 * (i + 1), amp: AMP_DECAY ** i }));
}

/** Rugosité totale de deux notes : la fondamentale f0 et f0 × ratio, chacune avec n harmoniques. */
export function roughness(f0: number, ratio: number, n: number): number {
  const a = partials(f0, n);
  const b = partials(f0 * ratio, n);
  let total = 0;
  // Paires entre les deux notes seulement : la rugosité propre de chaque note ne dépend pas de l'intervalle.
  for (const p of a) for (const q of b) total += roughnessPair(p.hz, p.amp, q.hz, q.amp);
  return total;
}

export interface CurvePoint {
  cents: number;
  value: number;
}

/** Un peu au-delà de l'octave, pour que la vallée de l'octave ait ses deux versants. */
export const CURVE_MAX_CENTS = 1250;

/** Rugosité pour chaque cent de 0 à `maxCents`, pour la fondamentale et le timbre donnés. */
export function roughnessCurve(f0: number, n: number, maxCents = CURVE_MAX_CENTS): CurvePoint[] {
  const out: CurvePoint[] = [];
  for (let c = 0; c <= maxCents; c++) out.push({ cents: c, value: roughness(f0, 2 ** (c / 1200), n) });
  return out;
}

export interface SimpleRatio {
  num: number;
  den: number;
  cents: number;
  label: string;
}

const cents = (r: number) => 1200 * Math.log2(r);

/** Les rapports simples nommés, ceux dont on attend une vallée. */
export const SIMPLE_RATIOS: readonly SimpleRatio[] = [
  { num: 1, den: 1, cents: 0, label: 'unisson' },
  { num: 6, den: 5, cents: cents(6 / 5), label: 'tierce mineure' },
  { num: 5, den: 4, cents: cents(5 / 4), label: 'tierce majeure' },
  { num: 4, den: 3, cents: cents(4 / 3), label: 'quarte' },
  { num: 7, den: 5, cents: cents(7 / 5), label: 'triton (7/5)' },
  { num: 3, den: 2, cents: cents(3 / 2), label: 'quinte' },
  { num: 8, den: 5, cents: cents(8 / 5), label: 'sixte mineure' },
  { num: 5, den: 3, cents: cents(5 / 3), label: 'sixte majeure' },
  { num: 7, den: 4, cents: cents(7 / 4), label: 'septième naturelle (7/4)' },
  { num: 2, den: 1, cents: 1200, label: 'octave' },
];

/** Rapport simple à moins de `tolerance` cents, ou null. */
export function nearestRatio(c: number, tolerance = 25): SimpleRatio | null {
  let best: SimpleRatio | null = null;
  for (const r of SIMPLE_RATIOS) {
    if (Math.abs(r.cents - c) <= tolerance && (!best || Math.abs(r.cents - c) < Math.abs(best.cents - c))) best = r;
  }
  return best;
}

export interface Valley {
  cents: number;
  value: number;
  /** Rapport simple auquel la vallée correspond, s'il y en a un à moins de 25 cents. */
  ratio: SimpleRatio | null;
  /** Profondeur relative : de combien la courbe remonte de part et d'autre (en part du maximum). */
  depth: number;
}

/** Minimums locaux de la courbe, avec leur profondeur, du plus grave au plus aigu. */
export function findValleys(curve: readonly CurvePoint[], minDepth = 0.02): Valley[] {
  const max = Math.max(...curve.map((p) => p.value));
  const out: Valley[] = [];
  for (let i = 1; i < curve.length - 1; i++) {
    const v = curve[i]!.value;
    if (v <= curve[i - 1]!.value && v < curve[i + 1]!.value) {
      // Hauteur du col le plus bas de chaque côté
      let left = v;
      for (let j = i - 1; j >= 0 && curve[j]!.value >= curve[j + 1]!.value; j--) left = curve[j]!.value;
      let right = v;
      for (let j = i + 1; j < curve.length && curve[j]!.value >= curve[j - 1]!.value; j++) right = curve[j]!.value;
      const depth = (Math.min(left, right) - v) / max;
      if (depth >= minDepth) out.push({ cents: curve[i]!.cents, value: v, ratio: nearestRatio(curve[i]!.cents), depth });
    }
  }
  // L'unisson est toujours une vallée : la courbe y vaut zéro et remonte aussitôt.
  const first = curve[0]!;
  if (first.value < curve[1]!.value) out.unshift({ cents: first.cents, value: first.value, ratio: nearestRatio(first.cents), depth: 1 });
  return out;
}
