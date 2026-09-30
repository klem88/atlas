/**
 * Les corpus de progressions d'accords, lus dans un format commun.
 *
 * - **Chordonomicon** (Kantarelis et al., 2024, CC BY-NC 4.0) : 680 000 progressions de tablatures, avec genres et
 *   décennies, sans titre ni tonalité. CSV de 264 Mo, lu en flux.
 * - **iRb** (Broze et Shanahan, OSU) : 1 185 standards de jazz, grilles complètes avec durées et tonalité.
 *   Paquet npm `sharp11-irb`.
 * - **McGill Billboard** (Burgoyne, Wild et Fujinaga, 2011, CC0) : 890 entrées du Hot 100 1958–1991, annotées à la
 *   main (notation Harte), avec structure et tonique.
 *
 * Le cache est commun à toutes les visualisations (`tools/.cache/corpora/`, ignoré par git).
 */
import { createReadStream } from 'node:fs';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { downloadCached } from './download';
import { log } from './log';

export type CorpusName = 'chordonomicon' | 'irb' | 'billboard';

export interface CorpusChord {
  /** Symbole tel qu'écrit dans le corpus (« Am7 », « G:7/5 », « Cø7 ») ; les silences sont « N ». */
  symbol: string;
  /** Durée en temps ; 1 quand le corpus n'a pas de durées (Chordonomicon). */
  beats: number;
}

export interface CorpusSection {
  /** « intro », « verse », « chorus », « bridge », « solo », « outro », « A », « B »… */
  name: string;
  chords: CorpusChord[];
}

export interface CorpusSong {
  id: string;
  corpus: CorpusName;
  title?: string;
  artist?: string;
  year?: number;
  /** Genre principal (Chordonomicon : douze catégories ; iRb : « jazz » ; Billboard : « billboard »). */
  genre?: string;
  /** Tonalité annotée : tonique et mode (iRb) ou tonique seule (Billboard). */
  key?: { tonic: number; mode?: 'major' | 'minor' };
  sections: CorpusSection[];
}

export const CORPORA_CACHE = join(import.meta.dirname, '..', '.cache', 'corpora');

export const SOURCES = {
  chordonomicon: {
    url: 'https://huggingface.co/datasets/ailsntua/Chordonomicon/resolve/main/chordonomicon_v2.csv',
    file: 'chordonomicon_v2.csv',
    minBytes: 200e6,
  },
  irb: {
    url: 'https://registry.npmjs.org/sharp11-irb/-/sharp11-irb-1.0.0.tgz',
    file: 'sharp11-irb-1.0.0.tgz',
    minBytes: 100e3,
  },
  billboardIndex: {
    url: 'https://www.dropbox.com/s/o0olz0uwl9z9stb/billboard-2.0-index.csv?dl=1',
    file: 'billboard-2.0-index.csv',
    minBytes: 50e3,
  },
  billboardChords: {
    url: 'https://www.dropbox.com/s/2lvny9ves8kns4o/billboard-2.0-salami_chords.tar.gz?dl=1',
    file: 'billboard-2.0-salami_chords.tar.gz',
    minBytes: 300e3,
  },
} as const;

/* CSV ------------------------------------------------------------------------------------------------- */

/** Découpe une ligne CSV (virgules, guillemets doublés). Pas de champ multiligne dans nos corpus. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      out.push(field);
      field = '';
    } else field += c;
  }
  out.push(field);
  return out;
}

/* Chordonomicon --------------------------------------------------------------------------------------- */

/** Une ligne du CSV → morceau. `chords` alterne marqueurs « <verse_1> » et symboles ; « s » y vaut dièse. */
export function parseChordonomiconRow(row: Readonly<Record<string, string>>): CorpusSong {
  const sections: CorpusSection[] = [];
  let current: CorpusSection | null = null;
  for (const tok of row.chords!.split(/\s+/)) {
    if (!tok) continue;
    if (tok.startsWith('<')) {
      current = { name: tok.slice(1, -1).replace(/_\d+$/, ''), chords: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { name: 'main', chords: [] };
      sections.push(current);
    }
    current.chords.push({ symbol: tok, beats: 1 });
  }
  const song: CorpusSong = { id: `cho:${row.id}`, corpus: 'chordonomicon', sections };
  const year = Number(row.release_date?.slice(0, 4));
  if (year >= 1900 && year <= 2100) song.year = year;
  else {
    const decade = Number(row.decade);
    if (decade >= 1900) song.year = decade; // seule la décennie est connue
  }
  if (row.main_genre) song.genre = row.main_genre;
  return song;
}

export async function* readChordonomicon(path = join(CORPORA_CACHE, SOURCES.chordonomicon.file)): AsyncGenerator<CorpusSong> {
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  let header: string[] | null = null;
  for await (const line of rl) {
    if (!header) {
      header = parseCsvLine(line);
      continue;
    }
    if (!line) continue;
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ''));
    yield parseChordonomiconRow(row);
  }
}

/* iRb -------------------------------------------------------------------------------------------------- */

interface IrbChart {
  sections: string[];
  content: Record<string, { chord: string; duration: { beats: number; subunits?: string[] } }[]>;
  info: { title: string; composer?: string; date?: string; key: string; minor: boolean };
}

const NOTE_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function pitchClassOf(name: string): number | null {
  const m = /^([A-G])([#b]?)/.exec(name);
  if (!m) return null;
  return (NOTE_PC[m[1]!]! + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
}

export function irbSong(chart: IrbChart, index: number): CorpusSong {
  const seen = new Map<string, number>();
  const sections = chart.sections.map((name) => {
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    // Les durées plus courtes qu'un temps sont en « subunits » (croches) : on les compte pour un demi-temps chacune.
    return { name, chords: (chart.content[name] ?? []).map((c) => ({ symbol: c.chord, beats: Math.max(0.5, c.duration.beats + 0.5 * (c.duration.subunits?.length ?? 0)) })) };
  });
  const song: CorpusSong = { id: `irb:${index}`, corpus: 'irb', title: chart.info.title, genre: 'jazz', sections };
  if (chart.info.composer) song.artist = chart.info.composer;
  const year = Number(chart.info.date);
  if (year >= 1800) song.year = year;
  const tonic = pitchClassOf(chart.info.key);
  if (tonic !== null) song.key = { tonic, mode: chart.info.minor ? 'minor' : 'major' };
  return song;
}

export async function readIrb(tgz = join(CORPORA_CACHE, SOURCES.irb.file)): Promise<CorpusSong[]> {
  const files = untar(gunzipSync(await readFile(tgz)));
  const js = files.get('package/index.js');
  if (!js) throw new Error('sharp11-irb : package/index.js introuvable');
  const json = js.toString('utf8').replace(/^module\.exports\s*=\s*/, '').replace(/;\s*$/, '');
  const { charts } = JSON.parse(json) as { charts: IrbChart[] };
  return charts.map(irbSong);
}

/* McGill Billboard ------------------------------------------------------------------------------------- */

export interface BillboardMeta {
  id: string;
  title: string;
  artist: string;
  year: number;
}

/**
 * Un fichier `salami_chords.txt` → morceau. Chaque ligne annotée : horodatage, éventuellement une lettre de
 * section et son nom, puis des mesures « | A:min | C:maj . G:maj | » ; « . » prolonge l'accord précédent,
 * un « x2 » répète la ligne. La métrique (« # metre: 4/4 ») fixe les temps par mesure ; la première tonique est retenue.
 */
export function parseSalami(text: string, meta: BillboardMeta): CorpusSong {
  const sections: CorpusSection[] = [];
  let current: CorpusSection | null = null;
  let beatsPerBar = 4;
  let tonic: number | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      const m = /^#\s*(\w+):\s*(.+)$/.exec(line);
      if (m?.[1] === 'metre') beatsPerBar = Number(m[2]!.split('/')[0]) || 4;
      if (m?.[1] === 'tonic' && tonic === null) tonic = pitchClassOf(m[2]!.trim());
      continue;
    }
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    let body = line.slice(tab + 1).trim();
    if (body === 'silence' || body === 'end' || body === 'Z') continue;
    const barStart = body.indexOf('|');
    const head = barStart >= 0 ? body.slice(0, barStart) : body;
    const sectionMatch = /^([A-Z]'*),\s*([^,]+),/.exec(head);
    if (sectionMatch) {
      current = { name: sectionMatch[2]!.trim(), chords: [] };
      sections.push(current);
    }
    if (barStart < 0) continue;
    body = body.slice(barStart);
    const repeat = /\|\s*,?\s*x(\d+)/.exec(body);
    const times = repeat ? Number(repeat[1]) : 1;
    const bars = body
      .split('|')
      .map((b) => b.trim())
      .filter((b) => b && !b.startsWith(',') && !/^x\d/.test(b));
    if (!current) {
      current = { name: 'main', chords: [] };
      sections.push(current);
    }
    const chords: CorpusChord[] = [];
    for (const rawBar of bars) {
      // Une métrique entre parenthèses en tête de mesure (« (2/4) D:maj ») ne vaut que pour cette mesure.
      const inline = /^\((\d+)\/\d+\)\s*/.exec(rawBar);
      const barBeats = inline ? Number(inline[1]) : beatsPerBar;
      const bar = inline ? rawBar.slice(inline[0].length) : rawBar;
      const toks = bar.split(/\s+/).filter((t) => t && !t.startsWith('(') && !t.startsWith('*') && t !== '->');
      if (toks.length === 0) continue;
      const per = barBeats / toks.length;
      for (const t of toks) {
        if (t === '.' && chords.length) chords[chords.length - 1]!.beats += per;
        else chords.push({ symbol: t === '&pause' ? 'N' : t, beats: per });
      }
    }
    for (let i = 0; i < times; i++) current.chords.push(...chords.map((c) => ({ ...c })));
  }
  const song: CorpusSong = {
    id: `bb:${meta.id}`,
    corpus: 'billboard',
    title: meta.title,
    artist: meta.artist,
    year: meta.year,
    genre: 'billboard',
    sections,
  };
  if (tonic !== null) song.key = { tonic };
  return song;
}

export function parseBillboardIndex(csv: string): Map<string, BillboardMeta> {
  const out = new Map<string, BillboardMeta>();
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]!);
  const col = (name: string) => header.indexOf(name);
  for (const line of lines.slice(1)) {
    const c = parseCsvLine(line);
    const title = c[col('title')];
    if (!title) continue;
    const id = c[col('id')]!.padStart(4, '0');
    out.set(id, { id, title, artist: c[col('artist')] ?? '', year: Number(c[col('chart_date')]!.slice(0, 4)) });
  }
  return out;
}

export async function readBillboard(
  tgz = join(CORPORA_CACHE, SOURCES.billboardChords.file),
  indexCsv = join(CORPORA_CACHE, SOURCES.billboardIndex.file),
): Promise<CorpusSong[]> {
  const index = parseBillboardIndex(await readFile(indexCsv, 'utf8'));
  const files = untar(gunzipSync(await readFile(tgz)));
  const songs: CorpusSong[] = [];
  for (const [name, buf] of files) {
    const m = /McGill-Billboard\/(\d{4})\/salami_chords\.txt$/.exec(name);
    if (!m) continue;
    const meta = index.get(m[1]!);
    if (!meta) continue;
    songs.push(parseSalami(buf.toString('utf8'), meta));
  }
  return songs.sort((a, b) => a.id.localeCompare(b.id));
}

/** Le Billboard répète les morceaux classés plusieurs fois : on garde une entrée par (titre, artiste), la plus ancienne. */
export function dedupeBillboard(songs: readonly CorpusSong[]): CorpusSong[] {
  const byKey = new Map<string, CorpusSong>();
  for (const s of songs) {
    const k = `${s.title}`.toLowerCase().trim() + '|' + `${s.artist}`.toLowerCase().trim();
    const prev = byKey.get(k);
    if (!prev || (s.year ?? 9999) < (prev.year ?? 9999)) byKey.set(k, s);
  }
  return [...byKey.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/* Téléchargement ---------------------------------------------------------------------------------------- */

export async function ensureCorpora(): Promise<void> {
  await mkdir(CORPORA_CACHE, { recursive: true });
  for (const src of Object.values(SOURCES)) {
    await downloadCached(src.url, join(CORPORA_CACHE, src.file), { minBytes: src.minBytes });
  }
  log.info(`corpus en cache dans ${CORPORA_CACHE}`);
}

/* tar minimal ------------------------------------------------------------------------------------------- */

/** Lit une archive tar (en-têtes de 512 octets, format ustar/GNU) : nom → contenu. Suffit pour nos deux archives. */
export function untar(buf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let off = 0;
  let longName: string | null = null;
  while (off + 512 <= buf.length) {
    const header = buf.subarray(off, off + 512);
    if (header.every((b) => b === 0)) break;
    let name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/, '');
    if (prefix) name = `${prefix}/${name}`;
    const size = parseInt(header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim() || '0', 8);
    const type = String.fromCharCode(header[156]!);
    const data = buf.subarray(off + 512, off + 512 + size);
    if (type === 'L') longName = data.toString('utf8').replace(/\0.*$/, '');
    else {
      if (longName) {
        name = longName;
        longName = null;
      }
      if (type === '0' || type === '\0' || type === '') files.set(name.replace(/^\.\//, ''), Buffer.from(data));
    }
    off += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}

/* Divers ------------------------------------------------------------------------------------------------- */

/** Nombre de lignes d'un gros fichier sans le charger (pour les barres de progression). */
export async function fileSize(path: string): Promise<number> {
  return (await stat(path)).size;
}

export async function writeJsonPretty(path: string, value: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(value));
}

export async function listDir(path: string): Promise<string[]> {
  return readdir(path);
}
