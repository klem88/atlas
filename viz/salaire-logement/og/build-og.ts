/**
 * Génère l'image d'aperçu des liens (Open Graph, 1200×630) à partir des vraies données :
 * la carte nationale pour un revenu de référence, et le titre.
 *
 *   npm run og -- salaire-logement
 *
 * À relancer après une mise à jour des données ou du design.
 */
import { OG_FONTS, OG_HEIGHT as H, OG_WIDTH as W, REPO_ROOT, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { geoConicConformal, geoPath } from 'd3-geo';
import type { FeatureCollection } from 'geojson';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Topology } from 'topojson-specification';
import { PriceTable } from '../data/prices';
import { validatePrices, validateRates } from '../data/validate';
import { affordableArea } from '../domain/affordability';
import { classIndex } from '../domain/classes';
import { decodeTopology } from '../map/geo';
import { Model } from '../model';
import { readStateFromUrl } from '../state';

const SLUG = 'salaire-logement';
const DATA = join(REPO_ROOT, 'public', 'data', SLUG);

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const json = async (f: string) => JSON.parse(await readFile(join(DATA, f), 'utf8')) as unknown;

  const prices = new PriceTable(validatePrices(await json('prices.json')));
  const model = new Model(prices, validateRates(await json('rates.json'), prices.years));
  const geo = decodeTopology((await json('communes.topo.json')) as Topology<never>);
  const state = readStateFromUrl('', { first: prices.firstYear, last: prices.lastYear });
  const maxPrice = model.capacity(state).maxPrice;
  const ramp = Array.from({ length: 7 }, (_, i) => t[`ramp-${i}`]!);

  const canvas = createOgCanvas();
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
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('LOGEMENT · FRANCE · 2010 – 2025', pad, 110);
  ctx.fillStyle = t.ink!;
  ctx.font = `300 76px ${OG_FONTS.display}`;
  ctx.fillText('Ce que ton', pad, 210);
  ctx.fillText('salaire achète', pad, 292);
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 26px ${OG_FONTS.ui}`;
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
  ctx.font = `400 17px ${OG_FONTS.ui}`;
  ctx.fillText(`m² achetables avec ${state.netMonthlyIncome.toLocaleString('fr-FR')} €/mois en ${state.year}`, lx, ly + 40);

  console.log(`écrit ${await writeOgImage(SLUG, canvas)}`);
}
