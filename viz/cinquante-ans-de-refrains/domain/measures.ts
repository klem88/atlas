/**
 * Les mesures d'un morceau depuis sa suite de jetons de degrés, et leur agrégation par année. Pur.
 */
import { tokenToDegree } from '@shell/music/degrees';
import { DEGREE_BINS, type YearPoint } from '../data/contract';

const SECTION_BREAK = 255;
const DIATONIC_STEPS = new Set([0, 2, 4, 5, 7, 9, 11]);
const BIN_OF_STEP: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5 };

export interface SongMeasures {
  /** Occurrences d'accords (sans répétition immédiate, comme les jetons). */
  chords: number;
  distincts: number;
  minor: number;
  borrowed: number;
  /** Comptes par degré, alignés sur DEGREE_BINS. */
  degrees: number[];
}

export function measureSong(tokens: ArrayLike<number>): SongMeasures | null {
  const seen = new Set<number>();
  const degrees = new Array<number>(DEGREE_BINS.length).fill(0);
  let chords = 0;
  let minor = 0;
  let borrowed = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t === SECTION_BREAK) continue;
    const d = tokenToDegree(t);
    const cls = d.cls === 'min' || d.cls === 'dim' ? 1 : 0;
    seen.add(d.step * 2 + cls);
    chords++;
    if (cls === 1) minor++;
    if (!DIATONIC_STEPS.has(d.step)) borrowed++;
    degrees[BIN_OF_STEP[d.step] ?? DEGREE_BINS.length - 1]!++;
  }
  if (chords === 0) return null;
  return { chords, distincts: seen.size, minor, borrowed, degrees };
}

/** Accumulateur d'une année. */
export interface YearAcc {
  year: number;
  songs: number;
  distinctsSum: number;
  four: number;
  chords: number;
  minor: number;
  borrowed: number;
  degrees: number[];
  /** Septièmes : comptés à part (depuis les symboles bruts). */
  seventhChords: number;
  seventhTotal: number;
  most?: { title: string; artist: string; distincts: number };
  least?: { title: string; artist: string; distincts: number };
}

export const newYearAcc = (year: number): YearAcc => ({ year, songs: 0, distinctsSum: 0, four: 0, chords: 0, minor: 0, borrowed: 0, degrees: new Array<number>(DEGREE_BINS.length).fill(0), seventhChords: 0, seventhTotal: 0 });

export function addSong(acc: YearAcc, m: SongMeasures, meta?: { title: string; artist: string }): void {
  acc.songs++;
  acc.distinctsSum += m.distincts;
  if (m.distincts <= 4) acc.four++;
  acc.chords += m.chords;
  acc.minor += m.minor;
  acc.borrowed += m.borrowed;
  for (let i = 0; i < m.degrees.length; i++) acc.degrees[i]! += m.degrees[i]!;
  if (meta) {
    if (!acc.most || m.distincts > acc.most.distincts) acc.most = { ...meta, distincts: m.distincts };
    if (!acc.least || m.distincts < acc.least.distincts) acc.least = { ...meta, distincts: m.distincts };
  }
}

export function finishYear(acc: YearAcc): YearPoint {
  const r = (x: number, d = 4) => Math.round(x * 10 ** d) / 10 ** d;
  const p: YearPoint = {
    year: acc.year,
    songs: acc.songs,
    distincts: acc.songs ? r(acc.distinctsSum / acc.songs, 3) : 0,
    mineurs: acc.chords ? r(acc.minor / acc.chords) : 0,
    quatre: acc.songs ? r(acc.four / acc.songs) : 0,
    septiemes: acc.seventhTotal ? r(acc.seventhChords / acc.seventhTotal) : null,
    emprunts: acc.chords ? r(acc.borrowed / acc.chords) : 0,
    degrees: acc.degrees.map((d) => (acc.chords ? r(d / acc.chords) : 0)),
  };
  if (acc.most) p.most = acc.most;
  if (acc.least) p.least = acc.least;
  return p;
}

/** Une septième ? (dominante, majeure, mineure, demi-diminuée). */
export const isSeventh = (quality: string) => quality === 'dom7' || quality === 'maj7' || quality === 'min7' || quality === 'hdim';
