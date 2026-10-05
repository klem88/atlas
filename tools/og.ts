/**
 * Outils communs pour générer les images d'aperçu des liens (Open Graph, 1200×630) en Node.
 * Chaque visualisation écrit son propre dessin dans `viz/<slug>/og/build-og.ts`
 * et s'appuie sur ces fonctions pour les polices, les couleurs et l'écriture du fichier.
 */
import { GlobalFonts, createCanvas, type Canvas } from '@napi-rs/canvas';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { downloadCached } from './lib/download';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const REPO_ROOT = join(import.meta.dirname, '..');
const FONT_CACHE = join(REPO_ROOT, 'tools', '.cache', 'fonts');

/** Polices du site (Google Fonts, licence OFL), téléchargées une fois puis mises en cache. */
const FONTS = {
  'Spectral-Light.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/spectral/Spectral-Light.ttf',
  'AtkinsonHyperlegibleNext.ttf':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext%5Bwght%5D.ttf',
};

/** Noms de familles à utiliser dans `ctx.font`. */
export const OG_FONTS = {
  display: 'Spectral',
  ui: '"Atkinson Hyperlegible Next"',
} as const;

export async function registerSiteFonts(): Promise<void> {
  for (const [name, url] of Object.entries(FONTS)) {
    GlobalFonts.registerFromPath(await downloadCached(url, join(FONT_CACHE, name), { minBytes: 10_000 }));
  }
}

/** Jetons de couleur du thème clair, lus dans src/shell/tokens.css (source unique des couleurs). */
export async function readLightTokens(): Promise<Record<string, string>> {
  const css = await readFile(join(REPO_ROOT, 'src', 'shell', 'tokens.css'), 'utf8');
  const light = css.slice(0, css.indexOf('@media'));
  return Object.fromEntries([...light.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k!, v!.trim()]));
}

export function createOgCanvas(): Canvas {
  return createCanvas(OG_WIDTH, OG_HEIGHT);
}

/** Écrit l'image dans public/og/<slug>.png, l'emplacement attendu par les balises og:image. */
export async function writeOgImage(slug: string, canvas: Canvas): Promise<string> {
  const out = join(REPO_ROOT, 'public', 'og', `${slug}.png`);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, canvas.toBuffer('image/png'));
  return out;
}

/**
 * Deux portées vides (clé de sol et clé de fa) en filets discrets : le décor commun des images
 * d'aperçu des exercices au piano. `marks` place des rondes (x en fraction de la largeur, y en
 * demi-interlignes au-dessus de la ligne du bas de la portée du haut), dessinées à l'accent.
 */
export function drawGrandStaff(
  ctx: ReturnType<Canvas['getContext']>,
  tokens: Record<string, string>,
  box: { x: number; y: number; width: number; gap?: number },
  marks: { x: number; step: number }[] = [],
): void {
  const space = box.gap ?? 14;
  const between = space * 6;
  ctx.strokeStyle = tokens['rule-strong']!;
  ctx.lineWidth = 1.5;
  for (const staff of [0, 1]) {
    for (let i = 0; i < 5; i++) {
      const y = box.y + staff * (4 * space + between) + i * space;
      ctx.beginPath();
      ctx.moveTo(box.x, y);
      ctx.lineTo(box.x + box.width, y);
      ctx.stroke();
    }
  }
  const bottom = box.y + 4 * space;
  ctx.strokeStyle = tokens.accent!;
  ctx.lineWidth = 2.5;
  for (const m of marks) {
    ctx.beginPath();
    ctx.ellipse(box.x + m.x * box.width, bottom - (m.step * space) / 2, space * 0.72, space * 0.48, -0.35, 0, Math.PI * 2);
    ctx.stroke();
  }
}
