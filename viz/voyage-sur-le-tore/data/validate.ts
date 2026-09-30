import { SCHEMA_VERSION, type SongsFile, type StylesFile } from './contract';

class DataError extends Error {}

export function validateSongs(f: SongsFile): SongsFile {
  if (f.version !== SCHEMA_VERSION) throw new DataError(`songs : version ${f.version}`);
  const ids = new Set<string>();
  for (const s of f.songs) {
    if (ids.has(s.id)) throw new DataError(`songs : identifiant en double ${s.id}`);
    ids.add(s.id);
    if (!s.title || s.sections.length === 0) throw new DataError(`songs : ${s.id} vide`);
    for (const sec of s.sections) if (sec.chords.some(([sym, beats]) => !sym || !(beats > 0))) throw new DataError(`songs : ${s.id} accord invalide`);
  }
  return f;
}

export function validateStyles(f: StylesFile): StylesFile {
  if (f.version !== SCHEMA_VERSION) throw new DataError(`styles : version ${f.version}`);
  for (const s of f.styles) {
    if (s.histogram.length !== 6) throw new DataError(`styles : ${s.key} histogramme`);
    const sum = s.histogram.reduce((a, b) => a + b, 0);
    if (sum !== s.steps) throw new DataError(`styles : ${s.key} histogramme ≠ pas`);
    if (s.steps > 0 && (s.mean < 0 || s.mean > 5)) throw new DataError(`styles : ${s.key} moyenne ${s.mean}`);
  }
  return f;
}
