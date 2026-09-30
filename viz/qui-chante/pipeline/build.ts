/**
 * Pipeline de données : sources publiques → fichiers statiques dans public/data/qui-chante/.
 *
 *   npm run data -- qui-chante                 # utilise le cache local (pipeline/.cache)
 *   npm run data -- qui-chante --clean-cache   # vide le cache et réinterroge tout
 *
 * Étapes : communes → observations GBIF maille par maille → noms des espèces
 * → agrégation 3 × 3 → chants (Xeno-canto via GBIF) → validation → rapport qualité.
 * Le premier passage fait environ 7 000 requêtes à GBIF (≈ 30 min) ; les suivants lisent le cache.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GRID, SCHEMA_VERSION, type CellBlockFile, type CommunesFile, type Species, type SpeciesFile } from '../data/contract';
import { validateCellBlock, validateCommunes, validateSpecies } from '../data/validate';
import { aggregate, type CellObservations } from '../domain/aggregate';
import { blockOf, cellAt, cellWkt, neighborhood } from '../domain/grid';
import { mapWithConcurrency } from '@tools/lib/download';
import { log } from '@tools/lib/log';
import { cachedJson, facetCounts } from './lib/cached-json';
import { writeReport } from './report';
import { COMMUNES, GBIF, MIN_COUNT, SONG_SPECIES, YEARS, occurrenceQuery } from './sources';
import { pickFrenchName, type VernacularName } from './steps/names';
import { SPECTROGRAM, buildSongs } from './steps/songs';

const PIPELINE = import.meta.dirname;
const REPO = join(PIPELINE, '..', '..', '..');
const CACHE = join(PIPELINE, '.cache');
const OUT = join(REPO, 'public', 'data', 'qui-chante');

interface ApiCommune {
  nom: string;
  code: string;
  codeDepartement: string;
  centre?: { coordinates: [number, number] };
}

export default async function buildData(args: string[] = []): Promise<void> {
  if (args.includes('--clean-cache')) await rm(CACHE, { recursive: true, force: true });
  const generatedAt = new Date().toISOString();
  const started = Date.now();

  // 1. Communes -----------------------------------------------------------
  log.step('Communes (geo.api.gouv.fr)');
  const api = await cachedJson<ApiCommune[]>(COMMUNES.url, join(CACHE, 'communes.json'));
  const kept = api
    .filter((c) => c.centre && !COMMUNES.excludedPrefixes.some((p) => c.code.startsWith(p)))
    .map((c) => ({ ...c, cell: cellAt(GRID, ...c.centre!.coordinates) }))
    .sort((a, b) => a.code.localeCompare(b.code));
  const outside = kept.filter((c) => c.cell === null);
  if (outside.length) throw new Error(`Communes hors grille : ${outside.map((c) => c.nom).join(', ')}`);
  const communes: CommunesFile = validateCommunes({
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    codes: kept.map((c) => c.code),
    names: kept.map((c) => c.nom),
    departements: kept.map((c) => c.codeDepartement),
    cell: kept.map((c) => c.cell!),
  });
  log.info(`${communes.codes.length} communes`);

  // 2. Observations par maille --------------------------------------------
  const homeCells = [...new Set(communes.cell)].sort((a, b) => a - b);
  const queried = [...new Set(homeCells.flatMap((c) => neighborhood(GRID, c)))].sort((a, b) => a - b);
  log.step(`Observations GBIF : ${queried.length} mailles (${homeCells.length} habitées)`);
  const observations = new Map<number, CellObservations>();
  let done = 0;
  await mapWithConcurrency(queried, GBIF.concurrency, async (cell) => {
    const url = occurrenceQuery({ geometry: cellWkt(GRID, cell), facet: 'speciesKey', facetLimit: String(GBIF.facetLimit) });
    const { total, counts } = await facetCounts(url, join(CACHE, 'gbif', `${cell}.json`));
    observations.set(cell, { total, bySpecies: counts });
    if (++done % 500 === 0) log.info(`${done} / ${queried.length}`);
  });

  const national = await facetCounts(
    occurrenceQuery({ facet: 'speciesKey', facetLimit: '3000' }),
    join(CACHE, 'gbif', 'france.json'),
  );
  log.info(`${national.total.toLocaleString('fr')} observations en France, ${national.counts.size} espèces`);

  // 3. Voisinages 3 × 3 -----------------------------------------------------
  log.step('Agrégation des voisinages');
  const neighborhoods = new Map(
    homeCells.map((cell) => [cell, aggregate(neighborhood(GRID, cell).map((c) => observations.get(c)), MIN_COUNT)] as const),
  );
  const present = new Set([...neighborhoods.values()].flatMap((n) => n.species.map((s) => s.key)));

  // 4. Noms -----------------------------------------------------------------
  log.step(`Noms de ${present.size} espèces`);
  const keys = [...present].sort((a, b) => (national.counts.get(b) ?? 0) - (national.counts.get(a) ?? 0) || a - b);
  const species: Species[] = await mapWithConcurrency(keys, GBIF.concurrency, async (key) => {
    const info = await cachedJson<{ canonicalName: string }>(`${GBIF.api}/species/${key}`, join(CACHE, 'species', `${key}.json`));
    const names = await cachedJson<{ results: VernacularName[] }>(
      `${GBIF.api}/species/${key}/vernacularNames?limit=200`,
      join(CACHE, 'species', `${key}-noms.json`),
    );
    return {
      key,
      scientific: info.canonicalName,
      french: pickFrenchName(names.results) ?? info.canonicalName,
      national: national.counts.get(key) ?? 0,
      song: null,
    };
  });
  const indexOf = new Map(species.map((s, i) => [s.key, i]));

  // 5. Chants ---------------------------------------------------------------
  log.step(`Chants des ${SONG_SPECIES} espèces les plus observées`);
  for (const dir of ['cells', 'songs', 'spectrograms']) {
    await rm(join(OUT, dir), { recursive: true, force: true });
    await mkdir(join(OUT, dir), { recursive: true });
  }
  const songs = await buildSongs(species, SONG_SPECIES, { cache: CACHE, out: OUT });
  for (const s of species) s.song = songs.get(s.key) ?? null;
  const speciesFile: SpeciesFile = validateSpecies({
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    years: YEARS,
    spectrogram: SPECTROGRAM,
    species,
  });

  // 6. Écriture -------------------------------------------------------------
  log.step('Écriture');
  const blocks = new Map<string, CellBlockFile>();
  for (const [cell, n] of neighborhoods) {
    const name = blockOf(GRID, cell);
    const block = blocks.get(name) ?? { schemaVersion: SCHEMA_VERSION, block: name, cells: {} };
    block.cells[cell] = { total: n.total, species: n.species.map((s) => indexOf.get(s.key)!), counts: n.species.map((s) => s.count) };
    blocks.set(name, block);
  }
  for (const [name, block] of blocks) {
    await writeFile(join(OUT, 'cells', `${name}.json`), JSON.stringify(validateCellBlock(block, species.length)));
  }
  await writeFile(join(OUT, 'communes.json'), JSON.stringify(communes));
  await writeFile(join(OUT, 'species.json'), JSON.stringify(speciesFile));
  log.info(`${blocks.size} blocs, ${species.length} espèces`);

  await writeReport(join(PIPELINE, 'REPORT.md'), {
    generatedAt,
    minutes: (Date.now() - started) / 60_000,
    communes,
    species: speciesFile,
    neighborhoods,
    indexOf,
    nationalTotal: national.total,
    queriedCells: queried.length,
  });
  log.info('REPORT.md écrit');
}
