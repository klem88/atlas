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
