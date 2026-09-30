import { MIN_TRANSITIONS, SCHEMA_VERSION, type TransitionsFile } from './contract';

class DataError extends Error {}

export function validateTransitions(f: TransitionsFile): TransitionsFile {
  if (f.version !== SCHEMA_VERSION) throw new DataError(`transitions : version ${f.version}, attendu ${SCHEMA_VERSION}`);
  const keys = new Set<string>();
  for (const s of f.styles) {
    if (keys.has(s.key)) throw new DataError(`transitions : style en double ${s.key}`);
    keys.add(s.key);
    if (s.songs <= 0) throw new DataError(`transitions : ${s.key} sans morceau`);
    let sum = 0;
    for (const [a, b, n] of s.rows) {
      if (a < 0 || a >= 72 || b < 0 || b >= 72) throw new DataError(`transitions : ${s.key} jeton hors bornes`);
      if (a === b) throw new DataError(`transitions : ${s.key} répétition immédiate ${a}`);
      if (n < MIN_TRANSITIONS) throw new DataError(`transitions : ${s.key} ligne sous le seuil`);
      sum += n;
    }
    if (sum > s.transitions) throw new DataError(`transitions : ${s.key} somme des lignes > total`);
  }
  if (!keys.has('all')) throw new DataError('transitions : agrégat « all » manquant');
  return f;
}
