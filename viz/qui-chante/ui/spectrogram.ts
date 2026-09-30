/**
 * Dessin d'un spectrogramme binaire (voir SpectrogramSpec) dans un canvas, à la couleur
 * de l'encre du thème : l'intensité devient l'opacité, le fond reste celui de la page.
 */
import type { SpectrogramSpec } from '../data/contract';

const cache = new Map<string, Promise<Uint8Array>>();

export function loadSpectrogram(url: string): Promise<Uint8Array> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then(async (r) => {
      if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
      return new Uint8Array(await r.arrayBuffer());
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

/** Convertit une couleur CSS en [r, g, b] en passant par le canvas (gère hex, rgb, oklch…). */
function rgb(color: string): [number, number, number] {
  const c = document.createElement('canvas').getContext('2d')!;
  c.fillStyle = color;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return [r!, g!, b!];
}

/**
 * Dessine `data` (frames × bins) dans le canvas, étiré à sa taille affichée.
 * `seconds` fixe l'échelle horizontale : un spectrogramme plus court n'occupe qu'une partie de la largeur,
 * à partir de `offset` secondes (utile pour la partition du chœur).
 */
export function drawSpectrogram(
  canvas: HTMLCanvasElement,
  data: Uint8Array,
  spec: SpectrogramSpec,
  frames: number,
  color: string,
  { seconds = frames * spec.frameSeconds, offset = 0 } = {},
): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);

  // Image à la résolution des données, puis agrandie avec lissage : rendu doux, pas de pixels.
  const img = new ImageData(frames, spec.bins);
  const [r, g, b] = rgb(color);
  for (let t = 0; t < frames; t++) {
    for (let k = 0; k < spec.bins; k++) {
      const v = data[t * spec.bins + k]!;
      const o = ((spec.bins - 1 - k) * frames + t) * 4; // aigus en haut
      img.data[o] = r;
      img.data[o + 1] = g;
      img.data[o + 2] = b;
      img.data[o + 3] = Math.round(255 * (v / 255) ** 0.8);
    }
  }
  const tmp = document.createElement('canvas');
  tmp.width = frames;
  tmp.height = spec.bins;
  tmp.getContext('2d')!.putImageData(img, 0, 0);
  const x = (offset / seconds) * width;
  const w = ((frames * spec.frameSeconds) / seconds) * width;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(tmp, x, 0, w, height);
}
