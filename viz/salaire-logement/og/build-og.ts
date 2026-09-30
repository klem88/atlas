/**
 * Génère l'image d'aperçu des liens (Open Graph, 1200×630) à partir des vraies données :
 * la carte nationale pour un revenu de référence, et le titre.
 *
 *   npm run og:salaire-logement
 *
 * À relancer après une mise à jour des données ou du design.
 */
import { GlobalFonts, createCanvas } from '@napi-rs/canvas';
import { geoConicConformal, geoPath } from 'd3-geo';
import type { FeatureCollection } from 'geojson';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Topology } from 'topojson-specification';
import { downloadCached } from '../pipeline/lib/download';
import { PriceTable } from '../data/prices';
import { validatePrices, validateRates } from '../data/validate';
import { affordableArea } from '../domain/affordability';
import { classIndex } from '../domain/classes';
import { decodeTopology } from '../map/geo';
import { Model } from '../model';
import { readStateFromUrl } from '../state';

const HERE = import.meta.dirname;
const REPO = join(HERE, '..', '..', '..');
const DATA = join(REPO, 'public', 'data', 'salaire-logement');
const OUT = join(REPO, 'public', 'og', 'salaire-logement.png');
const FONTS = join(HERE, '..', 'pipeline', '.cache', 'fonts');
const W = 1200;
const H = 630;

const FONT_FILES = {
  'Spectral-Light.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/spectral/Spectral-Light.ttf',
  'AtkinsonHyperlegibleNext.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext%5Bwght%5D.ttf',
};

/** Lit les jetons de couleur du thème clair dans tokens.css (source unique des couleurs). */
async function readTokens(): Promise<Record<string, string>> {
  const css = await readFile(join(REPO, 'src', 'shell', 'tokens.css'), 'utf8');
  const light = css.slice(0, css.indexOf('@media'));
  return Object.fromEntries([...light.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k!, v!.trim()]));
}

async function main() {
  for (const [name, url] of Object.entries(FONT_FILES)) {
    GlobalFonts.registerFromPath(await downloadCached(url, join(FONTS, name), { minBytes: 10_000 }));
  }
  const t = await readTokens();
  const json = async (f: string) => JSON.parse(await readFile(join(DATA, f), 'utf8')) as unknown;

  const prices = new PriceTable(validatePrices(await json('prices.json')));
  const model = new Model(prices, validateRates(await json('rates.json'), prices.years));
  const geo = decodeTopology((await json('communes.topo.json')) as Topology<never>);
  const state = readStateFromUrl('', { first: prices.firstYear, last: prices.lastYear });
  const maxPrice = model.capacity(state).maxPrice;
  const ramp = Array.from({ length: 7 }, (_, i) => t[`seq-${i}`]!);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, W, H);

  // Carte : métropole seule, à droite.
  const box = { x: 600, y: 30, w: 570, h: 570 };
  const metroDeps: FeatureCollection = {
    type: 'FeatureCollection',
    features: geo.departements.filter((d) => !d.properties.departement.startsWith('97')),
  };
  const projection = geoConicConformal()
    .parallels([44, 49])
    .rotate([-3, 0])
    .fitExtent(
      [
        [box.x, box.y],
        [box.x + box.w, box.y + box.h],
      ],
      metroDeps,
    );
  const path = geoPath(projection, ctx as unknown as CanvasRenderingContext2D);
  for (const f of geo.communes) {
    if (f.properties.code.startsWith('97')) continue;
    const status = prices.lookup(f.properties.code, state.year, state.mode);
    ctx.fillStyle =
      status.kind === 'uncovered'
        ? t['no-data']!
        : status.kind === 'no-market'
          ? t['no-market']!
          : ramp[classIndex(affordableArea(maxPrice, status.price.pxm2))]!;
    ctx.beginPath();
    path(f);
    ctx.fill();
  }
  ctx.strokeStyle = t['ink-3']!;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  path(geo.departementBorders);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Texte, à gauche.
  const pad = 64;
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px "Atkinson Hyperlegible Next"`;
  ctx.fillText('LOGEMENT · FRANCE · 2010 – 2025', pad, 110);
  ctx.fillStyle = t.ink!;
  ctx.font = `300 76px Spectral`;
  ctx.fillText('Ce que ton', pad, 210);
  ctx.fillText('salaire achète', pad, 292);
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 26px "Atkinson Hyperlegible Next"`;
  ['Commune par commune, la surface', 'que tes revenus permettent d’acheter,', 'et comment elle a changé depuis 2010.'].forEach((line, i) =>
    ctx.fillText(line, pad, 360 + i * 38),
  );

  // Légende compacte.
  const lx = pad;
  const ly = 520;
  const cw = 58;
  ramp.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(lx + i * (cw + 2), ly, cw, 12);
  });
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 17px "Atkinson Hyperlegible Next"`;
  ctx.fillText(`m² achetables avec ${state.netMonthlyIncome.toLocaleString('fr-FR')} €/mois en ${state.year}`, lx, ly + 40);

  await mkdir(join(REPO, 'public', 'og'), { recursive: true });
  await writeFile(OUT, canvas.toBuffer('image/png'));
  console.log(`écrit ${OUT}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
