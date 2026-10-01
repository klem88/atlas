/**
 * Les accords possibles après une suite donnée, avec leur probabilité : P(suivant | suite) = morceaux(suite + suivant)
 * ÷ morceaux(suite), depuis les parts de « Ta progression a déjà été jouée » (`p{n}.json`). Pur.
 */
import { degreeLabel, parseDegreeLabel, progressionKey, type Degree } from '@shell/music/degrees';
import type { TriadClass } from '@shell/music/chords';
import { ROW, type Meta, type Shard } from '../../progression-jouee/data/contract';

export interface Candidate {
  degree: Degree;
  key: string;
  /** Morceaux qui contiennent la suite prolongée (dans le style choisi). */
  count: number;
  /** Probabilité conditionnelle (0–1). */
  p: number;
}

export interface Fan {
  /** Morceaux qui contiennent la suite courante (dans le style choisi) ; pour une suite vide, la taille du corpus. */
  base: number;
  candidates: Candidate[];
  /** Masse des continuations trop rares pour être dans les parts (0–1). */
  other: number;
}

/** Colonne d'une ligne pour un style (`null` : tous les morceaux). */
export function countOf(row: readonly number[], meta: Meta, style: string | null): number {
  if (!style) return row[ROW.total]!;
  const g = meta.genres.indexOf(style);
  return g >= 0 ? (row[ROW.fixed + g] ?? 0) : 0;
}

/**
 * L'éventail après `prefix`. `shardNext` est la part de longueur prefix + 1 ; `shardPrefix` celle de longueur prefix
 * (inutile pour une suite vide ou d'un accord : la base est alors reconstituée depuis `shardNext`).
 */
export function nextChords(prefix: readonly Degree[], shardNext: Shard, shardPrefix: Shard | null, meta: Meta, style: string | null): Fan {
  const head = prefix.length ? `${progressionKey(prefix)},` : '';
  const candidates: Candidate[] = [];
  const firstSeen = new Map<string, number>();
  for (const [key, row] of Object.entries(shardNext.rows)) {
    if (!key.startsWith(head)) continue;
    const rest = key.slice(head.length);
    if (prefix.length === 0) {
      // Suite vide : on agrège les paires par premier accord (poids relatifs, pas une probabilité).
      const first = rest.split(',')[0]!;
      firstSeen.set(first, (firstSeen.get(first) ?? 0) + countOf(row, meta, style));
      continue;
    }
    if (rest.includes(',')) continue;
    const degree = parseDegreeLabel(rest);
    if (!degree) continue;
    const count = countOf(row, meta, style);
    if (count > 0) candidates.push({ degree, key: rest, count, p: 0 });
  }
  if (prefix.length === 0) {
    for (const [k, count] of firstSeen) {
      const degree = parseDegreeLabel(k);
      if (degree && count > 0) candidates.push({ degree, key: k, count, p: 0 });
    }
  }
  let base: number;
  if (prefix.length === 0) base = candidates.reduce((a, c) => a + c.count, 0);
  else if (prefix.length === 1) {
    // Pas de part de longueur 1 : la base est la somme des paires qui commencent par cet accord (même convention que l'éventail vide).
    base = 0;
    for (const [key, row] of Object.entries(shardNext.rows)) if (key.startsWith(head)) base += countOf(row, meta, style);
  } else {
    const row = shardPrefix?.rows[progressionKey(prefix)];
    base = row ? countOf(row, meta, style) : candidates.reduce((a, c) => a + c.count, 0);
  }
  if (base <= 0) base = Math.max(1, candidates.reduce((a, c) => a + c.count, 0));
  for (const c of candidates) c.p = c.count / base;
  candidates.sort((a, b) => b.count - a.count);
  const covered = candidates.reduce((a, c) => a + c.p, 0);
  return { base, candidates, other: Math.max(0, Math.min(1, 1 - covered)) };
}

/** Tirage pondéré par la probabilité. */
export function weightedPick(candidates: readonly Candidate[], rand = Math.random): Candidate | null {
  const total = candidates.reduce((a, c) => a + c.p, 0);
  if (total <= 0) return null;
  let r = rand() * total;
  for (const c of candidates) {
    r -= c.p;
    if (r <= 0) return c;
  }
  return candidates[candidates.length - 1] ?? null;
}

/* Noms réels dans une tonalité ---------------------------------------------------------------------------- */

const NOTE_NAMES = ['Do', 'Ré♭', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const SUFFIX: Record<TriadClass, string> = { maj: '', min: ' m', dim: ' °', aug: ' +', sus: ' sus', other: ' ?' };

/** « Sol », « La m », « Si ° » : l'accord d'un degré dans une tonalité majeure. */
export function chordName(d: Degree, tonic: number): string {
  return `${NOTE_NAMES[(tonic + d.step) % 12]}${SUFFIX[d.cls]}`;
}

export const progressionNames = (p: readonly Degree[], tonic: number) => p.map((d) => chordName(d, tonic)).join(' – ');
export { degreeLabel };

const pct = (x: number) => (x >= 0.1 ? `${Math.round(x * 100)} %` : x >= 0.01 ? `${(x * 100).toFixed(1).replace('.', ',')} %` : `${(x * 100).toFixed(2).replace('.', ',')} %`);

/** « Après Do – Sol – La m, 61 % des chansons vont au Fa. » */
export function fanSentence(prefix: readonly Degree[], fan: Fan, tonic: number, styleLabel: string | null): string {
  const top = fan.candidates[0];
  if (!top) return prefix.length ? `Après ${progressionNames(prefix, tonic)}, trop peu de chansons pour dire la suite.` : 'Choisis un premier accord.';
  const who = styleLabel ? `des chansons ${styleLabel}` : 'des chansons';
  if (prefix.length === 0) return `Le degré le plus fréquent est le ${chordName(top.degree, tonic)} (${degreeLabel(top.degree)}).`;
  return `Après ${progressionNames(prefix, tonic)}, ${pct(top.p)} ${who} vont au ${chordName(top.degree, tonic)}${fan.candidates[1] ? `, ${pct(fan.candidates[1].p)} au ${chordName(fan.candidates[1].degree, tonic)}` : ''}.`;
}

export { pct };
