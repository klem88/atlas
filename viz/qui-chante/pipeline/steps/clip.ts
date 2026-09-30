/**
 * Préparation d'un extrait : choix du passage le plus chantant, volume égalisé, fondus.
 */

/** Durée des blocs d'analyse d'énergie (s). */
const BLOCK_SECONDS = 0.1;

/**
 * Début (en échantillons) de la fenêtre de `seconds` secondes la plus riche en aigus.
 * On mesure l'énergie de la différence entre échantillons successifs : c'est un filtre
 * passe-haut grossier qui favorise les chants (1 à 10 kHz) face au vent et aux moteurs.
 */
export function bestWindow(samples: Float32Array, sampleRate: number, seconds: number): number {
  const block = Math.max(1, Math.round(BLOCK_SECONDS * sampleRate));
  const blocks = Math.floor(samples.length / block);
  const span = Math.round((seconds * sampleRate) / block);
  if (blocks <= span) return 0;
  const energy = new Float64Array(blocks);
  for (let b = 0; b < blocks; b++) {
    let e = 0;
    for (let i = b * block + 1; i < (b + 1) * block; i++) e += (samples[i]! - samples[i - 1]!) ** 2;
    energy[b] = e;
  }
  let sum = energy.subarray(0, span).reduce((a, x) => a + x, 0);
  let best = sum;
  let bestStart = 0;
  for (let b = span; b < blocks; b++) {
    sum += energy[b]! - energy[b - span]!;
    if (sum > best) {
      best = sum;
      bestStart = b - span + 1;
    }
  }
  return bestStart * block;
}

/**
 * Égalise le volume : vise une valeur efficace commune (pour que les chants se mélangent
 * sans qu'un seul couvre les autres) sans jamais dépasser `peakMax`. Ajoute des fondus
 * de `fadeSeconds` aux extrémités pour éviter les clics.
 */
export function normalize(
  samples: Float32Array,
  sampleRate: number,
  { targetRms = 0.1, peakMax = 0.9, fadeSeconds = 0.05 } = {},
): Float32Array {
  let sq = 0;
  let peak = 0;
  for (const s of samples) {
    sq += s * s;
    peak = Math.max(peak, Math.abs(s));
  }
  const rms = Math.sqrt(sq / Math.max(1, samples.length));
  const gain = rms > 0 ? Math.min(targetRms / rms, peakMax / peak) : 0;
  const fade = Math.min(Math.round(fadeSeconds * sampleRate), Math.floor(samples.length / 2));
  return samples.map((s, i) => {
    const edge = Math.min(i, samples.length - 1 - i);
    return s * gain * (edge < fade ? edge / fade : 1);
  });
}

/** Conversion en entiers 16 bits pour l'encodeur. */
export function toInt16(samples: Float32Array): Int16Array {
  return Int16Array.from(samples, (s) => Math.round(Math.max(-1, Math.min(1, s)) * 32767));
}
