/**
 * Pipeline de données : sources publiques → fichiers statiques dans public/data/salaire-logement/.
 *
 *   npm run data -- salaire-logement                 # utilise le cache local (pipeline/.cache)
 *   npm run data -- salaire-logement --clean-cache   # vide le cache et retélécharge tout
 *
 * Étapes : taux (BCE) → contours (Etalab) → prix (Cerema) → validation → rapport qualité.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import {
  PROPERTY_TYPES,
  PriceSource,
  SCHEMA_VERSION,
  priceIndex,
  type PricesFile,
  type PropertyType,
} from '../data/contract';
import { validatePrices, validateRates } from '../data/validate';
import { boxDownloadUrl, listBoxFolder } from './lib/box';
import { downloadCached, fetchText, mapWithConcurrency } from '@tools/lib/download';
import { log } from '@tools/lib/log';
import { writeReport, type Report } from './report';
import { CEREMA, CONTOURS, RATES, YEARS, triennialWindow, type YearWindow } from './sources';
import { buildTopology, filterCommunes } from './steps/geo';
import { readCeremaFile, type CeremaTable } from './steps/prices';
import { buildRates } from './steps/rates';
import { resolvePrice } from './steps/resolve';

const PIPELINE = import.meta.dirname;
const REPO = join(PIPELINE, '..', '..', '..');
const CACHE = join(PIPELINE, '.cache');
const OUT = join(REPO, 'public', 'data', 'salaire-logement');
const DOWNLOAD_CONCURRENCY = 3;

export default async function buildData(args: string[] = []): Promise<void> {
  if (args.includes('--clean-cache')) await rm(CACHE, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const generatedAt = new Date().toISOString();

  // 1. Taux ---------------------------------------------------------------
  log.step('Taux de crédit immobilier (BCE)');
  const rates = validateRates(buildRates(await fetchText(RATES.url), generatedAt), YEARS);
  await writeJson('rates.json', rates);
  log.info(`${rates.monthly.length} mois, ${rates.monthly[0]?.period} → ${rates.monthly.at(-1)?.period}`);

  // 2. Contours -----------------------------------------------------------
  log.step('Contours des communes (Etalab)');
  const contoursPath = await downloadCached(CONTOURS.url, join(CACHE, 'communes-100m.geojson.gz'), { minBytes: 1e6 });
  const communes = filterCommunes(JSON.parse(gunzipSync(await readFile(contoursPath)).toString()));
  const codes = communes.map((f) => f.properties.code);
  const epciOf = new Map(communes.map((f) => [f.properties.code, f.properties.epci]));
  await writeFile(join(OUT, 'communes.topo.json'), await buildTopology(communes));
  log.info(`${communes.length} communes`);

  // 3. Prix ---------------------------------------------------------------
  log.step('Indicateurs de prix DV3F (Cerema)');
  const tables = await loadCeremaTables();

  log.step('Assemblage et repli des prix');
  const { prices, report } = assemblePrices(codes, epciOf, tables, generatedAt);
  validatePrices(prices);
  await writeJson('prices.json', prices);

  // 4. Rapport ------------------------------------------------------------
  const reportPath = join(PIPELINE, 'REPORT.md');
  await writeReport(reportPath, { ...report, rates });
  log.step(`Terminé. Rapport qualité : ${reportPath}`);
}

type Level = 'communes' | 'epci';
type TableKey = `${Level}:${number}-${number}`;
const keyOf = (level: Level, w: YearWindow): TableKey => `${level}:${w.from}-${w.to}`;

/** Résout, télécharge et parse tous les fichiers Cerema nécessaires. */
async function loadCeremaTables(): Promise<Map<TableKey, CeremaTable>> {
  const windows = new Map<string, YearWindow>();
  for (const y of YEARS) {
    for (const w of [{ from: y, to: y }, triennialWindow(y)]) windows.set(`${w.from}-${w.to}`, w);
  }
  const wanted = (['communes', 'epci'] as const).flatMap((level) =>
    [...windows.values()].map((w) => ({ level, window: w, name: CEREMA.fileName(level, w) })),
  );

  const listing = new Map((await listBoxFolder(CEREMA.boxVanity, CEREMA.boxFolderId)).map((f) => [f.name, f]));
  const missing = wanted.filter((w) => !listing.has(w.name)).map((w) => w.name);
  if (missing.length) throw new Error(`Fichiers Cerema introuvables sur Box :\n  ${missing.join('\n  ')}`);

  log.info(`${wanted.length} fichiers requis`);
  await mapWithConcurrency(wanted, DOWNLOAD_CONCURRENCY, (w) => {
    const file = listing.get(w.name)!;
    return downloadCached(boxDownloadUrl(CEREMA.boxVanity, file.id), join(CACHE, 'cerema', w.name), {
      minBytes: file.size, // la taille annoncée par Box sert de contrôle d'intégrité
    });
  });

  const tables = new Map<TableKey, CeremaTable>();
  for (const w of wanted) {
    tables.set(keyOf(w.level, w.window), readCeremaFile(join(CACHE, 'cerema', w.name)));
    log.info(`lu ${w.name}`);
  }
  return tables;
}

function assemblePrices(
  codes: string[],
  epciOf: Map<string, string | null>,
  tables: Map<TableKey, CeremaTable>,
  generatedAt: string,
): { prices: PricesFile; report: Omit<Report, 'rates'> } {
  const size = codes.length * YEARS.length;
  const series = Object.fromEntries(
    PROPERTY_TYPES.map((t) => [
      t,
      { pxm2: new Array<number | null>(size).fill(null), n: new Array<number>(size).fill(0), src: new Array<PriceSource>(size).fill(PriceSource.None) },
    ]),
  ) as PricesFile['series'];

  const table = (level: Level, w: YearWindow) => tables.get(keyOf(level, w))!;
  const bySource = new Map<string, number>(); // `${type}|${year}|${src}` → nombre de communes
  let outliers = 0;
  let epciJoinMisses = 0;
  const epciCodes = new Set(table('epci', { from: YEARS[0]!, to: YEARS[0]! }).keys());
  const uncovered = new Set<string>(CONTOURS.noDataDepartements);
  const layout = { years: [...YEARS] };

  codes.forEach((code, ci) => {
    const epci = epciOf.get(code) ?? null;
    if (epci && !epciCodes.has(epci)) epciJoinMisses++;
    const isUncovered = [...uncovered].some((d) => code.startsWith(d));

    YEARS.forEach((year, yi) => {
      const annual = { from: year, to: year };
      const tri = triennialWindow(year);
      for (const type of PROPERTY_TYPES) {
        const i = priceIndex(layout, ci, yi);
        const communeAnnual = table('communes', annual).get(code)?.[type];
        const r = isUncovered
          ? { pxm2: null, src: PriceSource.None, rejectedOutlier: false }
          : resolvePrice({
              communeAnnual,
              communeTriennial: table('communes', tri).get(code)?.[type],
              epciAnnual: epci ? table('epci', annual).get(epci)?.[type] : undefined,
              epciTriennial: epci ? table('epci', tri).get(epci)?.[type] : undefined,
            });
        const s = series[type as PropertyType];
        s.pxm2[i] = r.pxm2;
        s.src[i] = r.src;
        s.n[i] = communeAnnual?.n ?? 0;
        if (r.rejectedOutlier) outliers++;
        const k = `${type}|${year}|${r.src}`;
        bySource.set(k, (bySource.get(k) ?? 0) + 1);
      }
    });
  });

  const prices: PricesFile = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    years: [...YEARS],
    codes,
    uncoveredDepartements: [...uncovered],
    series,
  };
  return {
    prices,
    report: { generatedAt, communes: codes.length, years: [...YEARS], bySource, outliers, epciJoinMisses, prices },
  };
}

async function writeJson(name: string, data: unknown) {
  const json = JSON.stringify(data);
  await writeFile(join(OUT, name), json);
  log.info(`écrit public/data/salaire-logement/${name} (${(json.length / 1e6).toFixed(1)} Mo)`);
}

