/**
 * Spectrogramme compact d'un extrait : bandes de fréquence en échelle logarithmique
 * (comme les touches d'un piano), intensités en décibels ramenées à un octet.
 * Le bruit de fond stationnaire (vent, rumeur, insectes continus) est retiré :
 * dans chaque bande, on ne garde que ce qui dépasse le niveau médian de l'extrait,
 * et l'échelle va de ce plancher jusqu'aux passages les plus forts.
 */
import type { SpectrogramSpec } from '../../data/contract';

/** Marge au-dessus du bruit de fond avant d'afficher quoi que ce soit (dB). */
export const NOISE_MARGIN_DB = 3;
/** Dynamique maximale affichée sous les passages les plus forts (dB). */
export const DYNAMIC_RANGE_DB = 60;
/** Les passages « les plus forts » : ce quantile, pour qu'un clic isolé n'écrase pas tout. */
const TOP_QUANTILE = 0.995;

/** Transformée de Fourier rapide en place (radix 2). `re` et `im` ont une longueur puissance de 2. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j]!, re[i]!];
      [im[i], im[j]] = [im[j]!, im[i]!];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b]! * cr - im[b]! * ci;
        const ti = re[b]! * ci + im[b]! * cr;
        re[b] = re[a]! - tr;
        im[b] = im[a]! - ti;
        re[a] = re[a]! + tr;
        im[a] = im[a]! + ti;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}

/** Limites des bandes, en Hz : bins + 1 valeurs réparties géométriquement de fMin à fMax. */
export function bandEdges(spec: SpectrogramSpec): number[] {
  const ratio = spec.fMax / spec.fMin;
  return Array.from({ length: spec.bins + 1 }, (_, i) => spec.fMin * ratio ** (i / spec.bins));
}

/**
 * Calcule le spectrogramme d'un signal mono. Renvoie `frames × bins` octets,
 * colonne par colonne, fréquences basses d'abord.
 */
export function spectrogram(samples: Float32Array, sampleRate: number, spec: SpectrogramSpec): { data: Uint8Array; frames: number } {
  const size = 2 ** Math.ceil(Math.log2(sampleRate * 0.046)); // ≈ 46 ms : 2048 points à 44,1 kHz
  const hop = Math.round(spec.frameSeconds * sampleRate);
  const frames = Math.max(1, Math.floor((samples.length - size) / hop) + 1);
  const window = Float64Array.from({ length: size }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)));
  const edges = bandEdges(spec).map((f) => (f * size) / sampleRate); // en indices de raie
  const db = new Float64Array(frames * spec.bins);
  const re = new Float64Array(size);
  const im = new Float64Array(size);

  for (let t = 0; t < frames; t++) {
    re.fill(0);
    im.fill(0);
    for (let i = 0; i < size; i++) re[i] = (samples[t * hop + i] ?? 0) * window[i]!;
    fft(re, im);
    for (let b = 0; b < spec.bins; b++) {
      // Plus forte raie de la bande ; une bande plus étroite qu'une raie prend la raie la plus proche.
      const lo = Math.floor(edges[b]!);
      const hi = Math.max(lo, Math.ceil(edges[b + 1]!) - 1);
      let max = 0;
      for (let k = lo; k <= hi && k < size / 2; k++) max = Math.max(max, Math.hypot(re[k]!, im[k]!));
      db[t * spec.bins + b] = 20 * Math.log10(max + 1e-12);
    }
  }

  const top = quantile(db, TOP_QUANTILE);
  const data = new Uint8Array(db.length);
  for (let b = 0; b < spec.bins; b++) {
    const column = Float64Array.from({ length: frames }, (_, t) => db[t * spec.bins + b]!);
    const floor = Math.max(quantile(column, 0.5) + NOISE_MARGIN_DB, top - DYNAMIC_RANGE_DB);
    for (let t = 0; t < frames; t++) {
      const v = (db[t * spec.bins + b]! - floor) / Math.max(1, top - floor);
      data[t * spec.bins + b] = Math.round(255 * Math.min(1, Math.max(0, v)));
    }
  }
  return { data, frames };
}

function quantile(values: Float64Array, q: number): number {
  const s = values.slice().sort();
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]!;
}

/** Mélange les canaux en mono. */
export function toMono(channels: readonly Float32Array[]): Float32Array {
  if (channels.length === 1) return channels[0]!;
  const out = new Float32Array(channels[0]!.length);
  for (const ch of channels) for (let i = 0; i < out.length; i++) out[i]! += ch[i]! / channels.length;
  return out;
}
