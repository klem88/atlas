/**
 * Chordonomicon en degrés : chaque morceau devient une suite compacte de jetons (degré × classe de triade, < 72),
 * sections séparées, avec son genre, sa décennie, son mode estimé. Partagé par toutes les pages du cycle
 * « progressions », et mis en cache (`tools/.cache/corpora/chordonomicon-degrees.*`) : la tokenisation prend
 * deux minutes, la relecture du cache une seconde.
 *
 * Les fonctions de conversion sont pures et exportées pour les pipelines qui travaillent sur les morceaux nommés.
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseChord } from '../../src/shell/music/chords';
import { tokensOf } from '../../src/shell/music/degrees';
import { estimateKey, relativeMajor, type WeightedChord } from '../../src/shell/music/key';
import { CORPORA_CACHE, readChordonomicon, type CorpusSong } from './corpora';
import { log } from './log';

/** Les douze genres principaux de Chordonomicon, dans l'ordre des agrégats. */
export const GENRES = ['pop', 'rock', 'country', 'alternative', 'pop rock', 'punk', 'metal', 'rap', 'soul', 'jazz', 'reggae', 'electronic'] as const;

/** Décennies couvertes : 1950 à 2020 ; avant 1950 (rares standards), on range dans 1950. */
export const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] as const;
/** En deçà, une date est tenue pour un bouche-trou (Chordonomicon a des « 1900 »). */
export const MIN_PLAUSIBLE_YEAR = 1920;

export function decadeIndex(year: number | null | undefined): number {
  if (year === null || year === undefined || year < MIN_PLAUSIBLE_YEAR) return -1;
  const d = Math.floor(year / 10) * 10;
  if (d < 1950) return 0;
  const i = DECADES.indexOf(d as (typeof DECADES)[number]);
  return i < 0 ? DECADES.length - 1 : i;
}

/** Sépare deux sections dans la suite compacte d'un morceau. */
export const SECTION_BREAK = 255;
/** Sépare deux morceaux dans le fichier de cache. */
const SONG_BREAK = 254;

export interface SongTokens {
  /** Jetons (< 72) de toutes les sections à la file, séparées par `SECTION_BREAK`. */
  tokens: Uint8Array;
  /** Indice dans `GENRES`, ou −1. */
  genre: number;
  /** Indice dans `DECADES`, ou −1. */
  decade: number;
  minor: boolean;
  year: number | null;
}

export function packSections(sections: readonly (readonly number[])[]): Uint8Array {
  const out: number[] = [];
  for (const sec of sections) {
    if (out.length) out.push(SECTION_BREAK);
    out.push(...sec);
  }
  return Uint8Array.from(out);
}

/** Les sections d'une suite compacte, en vues (sans copie). */
export function splitSections(tokens: Uint8Array): Uint8Array[] {
  const out: Uint8Array[] = [];
  let start = 0;
  for (let i = 0; i <= tokens.length; i++) {
    if (i < tokens.length && tokens[i] !== SECTION_BREAK) continue;
    if (i > start) out.push(tokens.subarray(start, i));
    start = i + 1;
  }
  return out;
}

/** Accords pondérés par la durée, avec le premier de chaque section marqué (indice pour la tonique). */
export function weightedChords(song: CorpusSong): WeightedChord[] {
  const out: WeightedChord[] = [];
  for (const sec of song.sections) {
    let first = true;
    for (const c of sec.chords) {
      const chord = parseChord(c.symbol);
      if (!chord) continue;
      out.push(first ? { chord, weight: c.beats, sectionStart: true } : { chord, weight: c.beats });
      first = false;
    }
  }
  return out;
}

export function sectionTokens(song: CorpusSong, tonic: number): number[][] {
  return song.sections.map((sec) => tokensOf(sec.chords.map((c) => parseChord(c.symbol)), tonic)).filter((t) => t.length > 0);
}

/** Tonalité estimée, jetons relatifs au relatif majeur. `null` si moins de deux degrés. */
export function tokenizeSong(song: CorpusSong): { tokens: SongTokens; margin: number } | null {
  const chords = weightedChords(song);
  const key = estimateKey(chords);
  if (!key) return null;
  const tonic = relativeMajor(key);
  const sections = sectionTokens(song, tonic);
  if (sections.reduce((a, s) => a + s.length, 0) < 2) return null;
  return {
    tokens: {
      tokens: packSections(sections),
      genre: song.genre ? GENRES.indexOf(song.genre as (typeof GENRES)[number]) : -1,
      decade: decadeIndex(song.year),
      minor: key.mode === 'minor',
      year: song.year !== undefined && song.year >= MIN_PLAUSIBLE_YEAR ? song.year : null,
    },
    margin: key.margin,
  };
}

/** Mode d'un morceau dont on connaît la tonique : le poids de ses accords de tonique, majeurs ou mineurs. */
export function modeGivenTonic(chords: readonly WeightedChord[], tonic: number): 'major' | 'minor' {
  let maj = 0;
  let min = 0;
  for (const { chord, weight } of chords) {
    if (chord.root !== tonic) continue;
    const q = chord.quality;
    if (q === 'min' || q === 'min7') min += weight;
    else if (q === 'maj' || q === 'maj7' || q === 'dom7') maj += weight;
  }
  return min > maj ? 'minor' : 'major';
}

/** Tonalité annotée complétée du mode s'il manque (Billboard), en tonique du mode et en relatif majeur. */
export function knownKey(song: CorpusSong): { tonic: number; mode: 'major' | 'minor'; relativeMajor: number } | null {
  if (!song.key) return null;
  const mode = song.key.mode ?? modeGivenTonic(weightedChords(song), song.key.tonic);
  return { tonic: song.key.tonic, mode, relativeMajor: mode === 'major' ? song.key.tonic : (song.key.tonic + 3) % 12 };
}

export interface DegreesCorpus {
  songs: SongTokens[];
  read: number;
  dropped: number;
  /** Marges de décision de l'estimation de tonalité, triées. */
  margins: number[];
}

const CACHE_BIN = join(CORPORA_CACHE, 'chordonomicon-degrees.bin');
const CACHE_META = join(CORPORA_CACHE, 'chordonomicon-degrees.json');
/** À incrémenter quand la tokenisation change (socle ou lecteur) : le cache est alors reconstruit. */
export const DEGREES_CACHE_VERSION = 1;

/** Chordonomicon tokenisé, depuis le cache s'il est à jour. */
export async function loadChordonomiconDegrees(): Promise<DegreesCorpus> {
  if (existsSync(CACHE_BIN) && existsSync(CACHE_META)) {
    const meta = JSON.parse(await readFile(CACHE_META, 'utf8')) as { version: number; read: number; dropped: number; margins: number[]; rows: [number, number, number, number][] };
    if (meta.version === DEGREES_CACHE_VERSION) {
      const bin = new Uint8Array(await readFile(CACHE_BIN));
      const songs: SongTokens[] = [];
      let start = 0;
      let i = 0;
      for (let p = 0; p < bin.length; p++) {
        if (bin[p] !== SONG_BREAK) continue;
        const [genre, decade, minor, year] = meta.rows[i++]!;
        songs.push({ tokens: bin.subarray(start, p), genre, decade, minor: minor === 1, year: year || null });
        start = p + 1;
      }
      log.info(`Chordonomicon en degrés : ${songs.length} morceaux (cache)`);
      return { songs, read: meta.read, dropped: meta.dropped, margins: meta.margins };
    }
  }
  log.info('Chordonomicon en degrés : tokenisation (deux minutes)…');
  const songs: SongTokens[] = [];
  const margins: number[] = [];
  let read = 0;
  let dropped = 0;
  for await (const song of readChordonomicon()) {
    read++;
    const t = tokenizeSong(song);
    if (!t) {
      dropped++;
      continue;
    }
    songs.push(t.tokens);
    margins.push(t.margin);
    if (read % 100_000 === 0) log.info(`${read} lus`);
  }
  margins.sort((a, b) => a - b);
  const total = songs.reduce((a, s) => a + s.tokens.length + 1, 0);
  const bin = new Uint8Array(total);
  let p = 0;
  for (const s of songs) {
    bin.set(s.tokens, p);
    p += s.tokens.length;
    bin[p++] = SONG_BREAK;
  }
  await writeFile(CACHE_BIN, bin);
  await writeFile(
    CACHE_META,
    JSON.stringify({ version: DEGREES_CACHE_VERSION, read, dropped, margins, rows: songs.map((s) => [s.genre, s.decade, s.minor ? 1 : 0, s.year ?? 0]) }),
  );
  log.info(`${read} morceaux lus, ${dropped} écartés, ${songs.length} tokenisés ; cache écrit`);
  return { songs, read, dropped, margins };
}
