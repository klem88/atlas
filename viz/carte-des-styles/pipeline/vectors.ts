/**
 * Analyse en composantes principales maison (covariance + itération de puissance avec déflation) et mesures de
 * séparation des styles (silhouette, plus proches voisins), pour la sonde. Le vecteur d'un morceau est dans
 * `domain/compass.ts` (il sert aussi au navigateur). Tout est pur, sans dépendance.
 */
import { CLASSES, DIMS, classOfToken, songVector } from '../domain/compass';

export { CLASSES, DIMS, classOfToken, songVector };

/* ACP -------------------------------------------------------------------------------------------------------- */

export interface Pca {
  mean: Float64Array;
  /** Composantes (vecteurs unitaires), par variance décroissante. */
  components: Float64Array[];
  variances: number[];
  totalVariance: number;
}

/** ACP des `k` premières composantes par itération de puissance sur la covariance. */
export function pca(rows: readonly Float32Array[], k: number, dims = DIMS, iterations = 60): Pca {
  const n = rows.length;
  const mean = new Float64Array(dims);
  for (const r of rows) for (let i = 0; i < dims; i++) mean[i]! += r[i]!;
  for (let i = 0; i < dims; i++) mean[i]! /= n;
  const cov = new Float64Array(dims * dims);
  const centered = new Float64Array(dims);
  for (const r of rows) {
    for (let i = 0; i < dims; i++) centered[i] = r[i]! - mean[i]!;
    for (let i = 0; i < dims; i++) {
      const ci = centered[i]!;
      if (ci === 0) continue;
      const row = i * dims;
      for (let j = i; j < dims; j++) cov[row + j]! += ci * centered[j]!;
    }
  }
  for (let i = 0; i < dims; i++) for (let j = 0; j < i; j++) cov[i * dims + j] = cov[j * dims + i]!;
  for (let i = 0; i < dims * dims; i++) cov[i]! /= n - 1;
  let totalVariance = 0;
  for (let i = 0; i < dims; i++) totalVariance += cov[i * dims + i]!;

  const components: Float64Array[] = [];
  const variances: number[] = [];
  let seed = 12345;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let c = 0; c < k; c++) {
    let v = new Float64Array(dims).map(() => rand() - 0.5);
    normalize(v);
    let lambda = 0;
    for (let it = 0; it < iterations; it++) {
      const w = new Float64Array(dims);
      for (let i = 0; i < dims; i++) {
        let s = 0;
        const row = i * dims;
        for (let j = 0; j < dims; j++) s += cov[row + j]! * v[j]!;
        w[i] = s;
      }
      lambda = normalize(w);
      v = w;
    }
    components.push(v);
    variances.push(lambda);
    // Déflation : on retire la composante trouvée de la covariance.
    for (let i = 0; i < dims; i++) for (let j = 0; j < dims; j++) cov[i * dims + j]! -= lambda * v[i]! * v[j]!;
  }
  return { mean, components, variances, totalVariance };
}

function normalize(v: Float64Array): number {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i]! * v[i]!;
  const norm = Math.sqrt(s) || 1;
  for (let i = 0; i < v.length; i++) v[i]! /= norm;
  return norm;
}

export function project(p: Pca, row: Float32Array, k = p.components.length): number[] {
  const out: number[] = [];
  for (let c = 0; c < k; c++) {
    const comp = p.components[c]!;
    let s = 0;
    for (let i = 0; i < row.length; i++) s += (row[i]! - p.mean[i]!) * comp[i]!;
    out.push(s);
  }
  return out;
}

/* Séparation --------------------------------------------------------------------------------------------------- */

const dist = (a: readonly number[], b: readonly number[]) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(s);
};

/** Silhouette moyenne par étiquette (échantillon), dans l'espace donné. */
export function silhouette(points: readonly (readonly number[])[], labels: readonly number[]): { overall: number; byLabel: Map<number, number> } {
  const n = points.length;
  const byLabelIdx = new Map<number, number[]>();
  labels.forEach((l, i) => byLabelIdx.set(l, [...(byLabelIdx.get(l) ?? []), i]));
  const sums = new Map<number, number>();
  let total = 0;
  for (let i = 0; i < n; i++) {
    const own = byLabelIdx.get(labels[i]!)!;
    if (own.length < 2) continue;
    let a = 0;
    for (const j of own) if (j !== i) a += dist(points[i]!, points[j]!);
    a /= own.length - 1;
    let b = Infinity;
    for (const [l, idx] of byLabelIdx) {
      if (l === labels[i]) continue;
      let s = 0;
      for (const j of idx) s += dist(points[i]!, points[j]!);
      b = Math.min(b, s / idx.length);
    }
    const si = (b - a) / Math.max(a, b);
    total += si;
    sums.set(labels[i]!, (sums.get(labels[i]!) ?? 0) + si);
  }
  const byLabel = new Map<number, number>();
  for (const [l, idx] of byLabelIdx) byLabel.set(l, (sums.get(l) ?? 0) / idx.length);
  return { overall: total / n, byLabel };
}

/** Précision des k plus proches voisins (vote), en laissant chaque point de côté. */
export function knnAccuracy(points: readonly (readonly number[])[], labels: readonly number[], k = 10): number {
  const n = points.length;
  let correct = 0;
  for (let i = 0; i < n; i++) {
    const d: [number, number][] = [];
    for (let j = 0; j < n; j++) if (j !== i) d.push([dist(points[i]!, points[j]!), labels[j]!]);
    d.sort((x, y) => x[0] - y[0]);
    const votes = new Map<number, number>();
    for (const [, l] of d.slice(0, k)) votes.set(l, (votes.get(l) ?? 0) + 1);
    let best = -1;
    let bestN = 0;
    for (const [l, c] of votes) if (c > bestN) [best, bestN] = [l, c];
    if (best === labels[i]) correct++;
  }
  return correct / n;
}
