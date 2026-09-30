import { ROW, SCHEMA_VERSION, type Meta, type Shard, type SongsFile } from './contract';

class DataError extends Error {}

export function validateMeta(m: Meta): Meta {
  if (m.version !== SCHEMA_VERSION) throw new DataError(`meta : version ${m.version}, attendu ${SCHEMA_VERSION}`);
  if (m.genres.length === 0 || m.decades.length === 0) throw new DataError('meta : genres ou décennies vides');
  if (m.corpus.songs <= 0) throw new DataError('meta : corpus vide');
  if (m.corpus.byGenre.length !== m.genres.length) throw new DataError('meta : byGenre ne suit pas genres');
  if (m.corpus.byDecade.length !== m.decades.length) throw new DataError('meta : byDecade ne suit pas decades');
  if (m.minSongs.length !== m.lengths.length) throw new DataError('meta : minSongs ne suit pas lengths');
  return m;
}

export function validateShard(s: Shard, m: Meta): Shard {
  const width = ROW.fixed + m.genres.length + m.decades.length;
  for (const [key, row] of Object.entries(s.rows)) {
    if (key.split(',').length !== s.n) throw new DataError(`p${s.n} : « ${key} » n'a pas ${s.n} degrés`);
    if (row.length !== width) throw new DataError(`p${s.n} : « ${key} » a ${row.length} colonnes, attendu ${width}`);
    if (row[ROW.total]! < (m.minSongs[m.lengths.indexOf(s.n)] ?? 1)) throw new DataError(`p${s.n} : « ${key} » sous le seuil`);
    if (row[ROW.minor]! > row[ROW.total]!) throw new DataError(`p${s.n} : « ${key} » plus de mineurs que de morceaux`);
    const genreSum = row.slice(ROW.fixed, ROW.fixed + m.genres.length).reduce((a, b) => a + b, 0);
    if (genreSum > row[ROW.total]!) throw new DataError(`p${s.n} : « ${key} » somme des genres > total`);
  }
  return s;
}

export function validateSongs(f: SongsFile): SongsFile {
  if (f.version !== SCHEMA_VERSION) throw new DataError(`songs : version ${f.version}`);
  const ids = new Set<string>();
  for (const s of f.songs) {
    if (ids.has(s.id)) throw new DataError(`songs : identifiant en double ${s.id}`);
    ids.add(s.id);
    if (!s.title) throw new DataError(`songs : ${s.id} sans titre`);
    if (s.tonic < 0 || s.tonic > 11) throw new DataError(`songs : ${s.id} tonique ${s.tonic}`);
    for (const sec of s.sections) {
      if (sec.chords.length === 0) throw new DataError(`songs : ${s.id} section vide`);
      if (sec.chords.some(([sym, beats]) => !sym || !(beats > 0))) throw new DataError(`songs : ${s.id} accord ou durée invalide`);
    }
  }
  return f;
}
