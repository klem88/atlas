import {
  GRID,
  SCHEMA_VERSION,
  type CellBlockFile,
  type CommunesFile,
  type SpeciesFile,
  type SpectrogramsFile,
} from './contract';

export class DataValidationError extends Error {
  override name = 'DataValidationError';
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new DataValidationError(message);
}

const CELL_COUNT = GRID.cols * GRID.rows;
const isCell = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) < CELL_COUNT;

/** Vérifie l'index des communes. Lève DataValidationError sinon. */
export function validateCommunes(data: unknown): CommunesFile {
  const f = data as CommunesFile;
  assert(f && typeof f === 'object', 'communes: objet attendu');
  assert(f.schemaVersion === SCHEMA_VERSION, `communes: schemaVersion ${String(f.schemaVersion)} ≠ ${SCHEMA_VERSION}`);
  const n = f.codes?.length ?? 0;
  assert(n > 30_000, `communes: ${n} communes, trop peu pour la métropole`);
  assert(new Set(f.codes).size === n, 'communes: codes en double');
  for (const key of ['names', 'departements', 'cell'] as const) {
    assert(f[key]?.length === n, `communes.${key}: longueur ${f[key]?.length} ≠ ${n}`);
  }
  f.cell.forEach((c, i) => assert(isCell(c), `communes.cell[${i}] hors grille : ${c}`));
  f.names.forEach((name, i) => assert(name.length > 0, `communes.names[${i}] vide`));
  return f;
}

/** Vérifie la liste des espèces. */
export function validateSpecies(data: unknown): SpeciesFile {
  const f = data as SpeciesFile;
  assert(f && typeof f === 'object', 'species: objet attendu');
  assert(f.schemaVersion === SCHEMA_VERSION, `species: schemaVersion ${String(f.schemaVersion)} ≠ ${SCHEMA_VERSION}`);
  assert(Array.isArray(f.species) && f.species.length > 100, 'species: moins de 100 espèces');
  assert(new Set(f.species.map((s) => s.key)).size === f.species.length, 'species: clés en double');
  f.species.forEach((s, i) => {
    assert(s.french && s.scientific, `species[${i}]: nom manquant`);
    assert(i === 0 || s.national <= f.species[i - 1]!.national, `species[${i}]: ordre décroissant attendu`);
    if (s.song) {
      assert(/^XC\d+$/.test(s.song.xcId), `species[${i}].song: identifiant ${s.song.xcId} invalide`);
      assert(!/\bND\b/.test(s.song.licence), `species[${i}].song: licence ${s.song.licence} interdite (pas de modification)`);
      assert(s.song.author.length > 0, `species[${i}].song: auteur manquant`);
      assert(s.song.duration > 0 && s.song.duration <= 30, `species[${i}].song: durée ${s.song.duration} s`);
    }
  });
  return f;
}

/** Vérifie un bloc de mailles, par rapport au nombre d'espèces connues. */
export function validateCellBlock(data: unknown, speciesCount: number): CellBlockFile {
  const f = data as CellBlockFile;
  assert(f && typeof f === 'object', 'cells: objet attendu');
  assert(f.schemaVersion === SCHEMA_VERSION, `cells ${f.block}: schemaVersion ${String(f.schemaVersion)}`);
  for (const [id, cell] of Object.entries(f.cells)) {
    const where = `cells ${f.block}/${id}`;
    assert(isCell(Number(id)), `${where}: maille hors grille`);
    assert(cell.species.length === cell.counts.length, `${where}: species et counts de longueurs différentes`);
    assert(new Set(cell.species).size === cell.species.length, `${where}: espèce en double`);
    cell.species.forEach((s) => assert(Number.isInteger(s) && s >= 0 && s < speciesCount, `${where}: espèce ${s} inconnue`));
    cell.counts.forEach((c, i) => assert(i === 0 || c <= cell.counts[i - 1]!, `${where}: ordre décroissant attendu`));
    const sum = cell.counts.reduce((a, b) => a + b, 0);
    assert(sum <= cell.total, `${where}: ${sum} observations d'espèces > total ${cell.total}`);
  }
  return f;
}

/** Vérifie les spectrogrammes : chaque entrée doit avoir exactement bins × frames octets. */
export function validateSpectrograms(data: unknown): SpectrogramsFile {
  const f = data as SpectrogramsFile;
  assert(f && typeof f === 'object', 'spectrograms: objet attendu');
  assert(f.schemaVersion === SCHEMA_VERSION, `spectrograms: schemaVersion ${String(f.schemaVersion)}`);
  assert(f.bins > 0 && f.fMin > 0 && f.fMax > f.fMin && f.frameSeconds > 0, 'spectrograms: paramètres invalides');
  for (const [id, item] of Object.entries(f.items)) {
    const bytes = Math.floor((item.data.replace(/=+$/, '').length * 3) / 4);
    assert(bytes === f.bins * item.frames, `spectrograms/${id}: ${bytes} octets ≠ ${f.bins} × ${item.frames}`);
  }
  return f;
}
