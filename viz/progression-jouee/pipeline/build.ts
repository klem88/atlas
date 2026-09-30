/**
 * Pipeline : corpus d'accords → agrégats de progressions dans public/data/progression-jouee/.
 *
 *   npm run data -- progression-jouee                 # utilise le cache commun (tools/.cache/corpora)
 *   npm run data -- progression-jouee --clean-cache   # retélécharge les corpus
 *
 * Étapes : téléchargement → morceaux nommés (iRb, Billboard) et mesure de l'estimation de tonalité →
 * Chordonomicon en jetons de degrés → comptage des suites de 2 à 8 degrés → écriture et rapport qualité.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseChord, type Chord } from '@shell/music/chords';
import { degreeLabel, tokenToDegree, tokensOf } from '@shell/music/degrees';
import { estimateKey, relativeMajor, type WeightedChord } from '@shell/music/key';
import {
  CORPORA_CACHE,
  dedupeBillboard,
  ensureCorpora,
  readBillboard,
  readChordonomicon,
  readIrb,
  type CorpusSong,
} from '@tools/lib/corpora';
import { log } from '@tools/lib/log';
import { MIN_SONGS_BY_LENGTH, SCHEMA_VERSION, type Meta, type NamedSong, type ProgressionRow, type Shard, type SongsFile } from '../data/contract';
import { validateMeta, validateShard, validateSongs } from '../data/validate';
import { DECADES, FIRST_YEAR_SUPPORT, MIN_PLAUSIBLE_YEAR, countNgrams, decadeIndex, firstYear, packSections, tokensOfKey, type SongTokens, type Tally } from './ngrams';

const PIPELINE = import.meta.dirname;
const REPO = join(PIPELINE, '..', '..', '..');
const OUT = join(REPO, 'public', 'data', 'progression-jouee');

export const GENRES = ['pop', 'rock', 'country', 'alternative', 'pop rock', 'punk', 'metal', 'rap', 'soul', 'jazz', 'reggae', 'electronic'];
const LENGTHS = [2, 3, 4, 5, 6, 7, 8];

export default async function buildData(args: string[] = []): Promise<void> {
  const t0 = Date.now();
  if (args.includes('--clean-cache')) await rm(CORPORA_CACHE, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const generatedAt = new Date().toISOString();

  log.step('Corpus');
  await ensureCorpora();

  // 1. Morceaux nommés et précision de l'estimation de tonalité -----------------------------------------
  log.step('Morceaux nommés (iRb, Billboard)');
  const irb = await readIrb();
  const billboard = dedupeBillboard(await readBillboard());
  const irbAcc = measureIrb(irb);
  const bbAcc = measureBillboard(billboard);
  log.info(`iRb : ${irb.length} standards, armure juste ${pct(irbAcc.signature, irbAcc.n)}, tonalité exacte ${pct(irbAcc.exact, irbAcc.n)}`);
  log.info(`Billboard : ${billboard.length} titres, tonique juste ${pct(bbAcc.tonic, bbAcc.n)}, armure compatible ${pct(bbAcc.signature, bbAcc.n)}`);
  const named: NamedSong[] = [...irb.map(namedSong), ...billboard.map(namedSong)].filter((s): s is NamedSong => s !== null);
  const songsFile = validateSongs({ version: SCHEMA_VERSION, songs: named });
  await writeJson('songs.json', songsFile);

  // 2. Chordonomicon en jetons --------------------------------------------------------------------------
  log.step('Chordonomicon → degrés');
  const songs: SongTokens[] = [];
  const corpus = { songs: 0, withGenre: 0, withYear: 0, minor: 0, byGenre: new Array<number>(GENRES.length).fill(0), byDecade: new Array<number>(DECADES.length).fill(0) };
  let read = 0;
  let dropped = 0;
  const margins: number[] = [];
  for await (const song of readChordonomicon()) {
    read++;
    const st = toTokens(song);
    if (!st) {
      dropped++;
      continue;
    }
    songs.push(st.tokens);
    margins.push(st.margin);
    corpus.songs++;
    if (st.tokens.genre >= 0) {
      corpus.withGenre++;
      corpus.byGenre[st.tokens.genre]!++;
    }
    if (st.tokens.decade >= 0) {
      corpus.withYear++;
      corpus.byDecade[st.tokens.decade]!++;
    }
    if (st.tokens.minor) corpus.minor++;
    if (read % 100_000 === 0) log.info(`${read} lus`);
  }
  margins.sort((a, b) => a - b);
  log.info(`${read} morceaux lus, ${dropped} écartés (moins de deux degrés), ${corpus.songs} retenus`);

  // 3. Comptage -------------------------------------------------------------------------------------------
  log.step('Suites de degrés');
  let allowed: Set<string> | null = null;
  const shardSizes: Record<number, { rows: number; bytes: number; gzip: number }> = {};
  const top: Record<number, [string, Tally][]> = {};
  for (const n of LENGTHS) {
    const counts = countNgrams(songs, n, MIN_SONGS_BY_LENGTH[n]!, allowed, { genres: GENRES.length, decades: DECADES.length });
    const rows: Record<string, ProgressionRow> = {};
    for (const [k, t] of counts) rows[labelOfKey(k)] = [t.total, t.minor, firstYear(t) ?? 0, ...t.byGenre, ...t.byDecade];
    const shard: Shard = { n, rows };
    const bytes = await writeJson(`p${n}.json`, shard);
    shardSizes[n] = { rows: counts.size, bytes, gzip: gzipSync(JSON.stringify(shard)).length };
    top[n] = [...counts.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 12);
    log.info(`longueur ${n} : ${counts.size} suites retenues (${(shardSizes[n]!.gzip / 1024).toFixed(0)} Ko gzippés)`);
    allowed = new Set(counts.keys());
  }

  // 4. Meta et rapport -------------------------------------------------------------------------------------
  const meta: Meta = validateMeta({
    version: SCHEMA_VERSION,
    generatedAt,
    lengths: LENGTHS,
    minSongs: LENGTHS.map((n) => MIN_SONGS_BY_LENGTH[n]!),
    genres: GENRES,
    decades: [...DECADES],
    corpus,
    keyAccuracy: { irb: irbAcc, billboard: bbAcc },
    named: { irb: irb.length, billboard: billboard.length },
  });
  await writeJson('meta.json', meta);
  for (const n of LENGTHS) validateShard(JSON.parse(JSON.stringify({ n, rows: {} })) as Shard, meta);

  const report = renderReport({ meta, read, dropped, margins, shardSizes, top, minutes: (Date.now() - t0) / 60_000 });
  await writeFile(join(PIPELINE, 'REPORT.md'), report);
  log.step(`Terminé en ${((Date.now() - t0) / 60_000).toFixed(1)} min. Rapport : ${join(PIPELINE, 'REPORT.md')}`);
}

/* Tonalité et jetons ------------------------------------------------------------------------------------- */

function weighted(song: CorpusSong): WeightedChord[] {
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

function sectionTokens(song: CorpusSong, tonic: number): number[][] {
  return song.sections.map((sec) => tokensOf(sec.chords.map((c) => parseChord(c.symbol)), tonic)).filter((t) => t.length > 0);
}

/** Chordonomicon : tonalité estimée, jetons relatifs au relatif majeur. `null` si moins de deux degrés. */
function toTokens(song: CorpusSong): { tokens: SongTokens; margin: number } | null {
  const chords = weighted(song);
  const key = estimateKey(chords);
  if (!key) return null;
  const tonic = relativeMajor(key);
  const sections = sectionTokens(song, tonic);
  const total = sections.reduce((a, s) => a + s.length, 0);
  if (total < 2) return null;
  return {
    tokens: {
      tokens: packSections(sections),
      genre: song.genre ? GENRES.indexOf(song.genre) : -1,
      decade: decadeIndex(song.year),
      minor: key.mode === 'minor',
      year: song.year !== undefined && song.year >= MIN_PLAUSIBLE_YEAR ? song.year : null,
    },
    margin: key.margin,
  };
}

/** Mode d'un morceau dont on connaît la tonique : le poids de ses accords de tonique, majeurs ou mineurs. */
function modeGivenTonic(chords: readonly WeightedChord[], tonic: number): 'major' | 'minor' {
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

function knownKey(song: CorpusSong): { tonic: number; mode: 'major' | 'minor' } | null {
  if (!song.key) return null;
  const mode = song.key.mode ?? modeGivenTonic(weighted(song), song.key.tonic);
  return { tonic: song.key.tonic, mode };
}

function namedSong(song: CorpusSong): NamedSong | null {
  const key = knownKey(song);
  if (!key || !song.title) return null;
  const tonic = key.mode === 'major' ? key.tonic : (key.tonic + 3) % 12;
  return {
    id: song.id,
    corpus: song.corpus as 'irb' | 'billboard',
    title: song.title,
    artist: song.artist ?? '',
    year: song.year ?? null,
    tonic,
    mode: key.mode,
    sections: song.sections
      .map((sec) => ({
        name: sec.name,
        chords: sec.chords.map((c) => [c.symbol, Math.round(c.beats * 100) / 100] as [string, number]),
      }))
      .filter((s) => s.chords.length > 0),
  };
}

function measureIrb(songs: readonly CorpusSong[]) {
  let n = 0;
  let signature = 0;
  let exact = 0;
  for (const s of songs) {
    if (!s.key?.mode) continue;
    const est = estimateKey(weighted(s));
    if (!est) continue;
    n++;
    const truthMajor = s.key.mode === 'major' ? s.key.tonic : (s.key.tonic + 3) % 12;
    if (relativeMajor(est) === truthMajor) signature++;
    if (est.tonic === s.key.tonic && est.mode === s.key.mode) exact++;
  }
  return { n, signature, exact };
}

function measureBillboard(songs: readonly CorpusSong[]) {
  let n = 0;
  let tonic = 0;
  let signature = 0;
  for (const s of songs) {
    if (!s.key) continue;
    const est = estimateKey(weighted(s));
    if (!est) continue;
    n++;
    if (est.tonic === s.key.tonic) tonic++;
    const rm = relativeMajor(est);
    if (rm === s.key.tonic || rm === (s.key.tonic + 3) % 12) signature++;
  }
  return { n, tonic, signature };
}

/* Sorties ------------------------------------------------------------------------------------------------- */

const labelOfKey = (k: string) => tokensOfKey(k).map((t) => degreeLabel(tokenToDegree(t))).join(',');

async function writeJson(name: string, value: unknown): Promise<number> {
  const text = JSON.stringify(value);
  await writeFile(join(OUT, name), text);
  return Buffer.byteLength(text);
}

const pct = (a: number, n: number) => `${((100 * a) / Math.max(1, n)).toFixed(1)} %`;
const fr = (n: number) => n.toLocaleString('fr-FR');

function renderReport(r: {
  meta: Meta;
  read: number;
  dropped: number;
  margins: number[];
  shardSizes: Record<number, { rows: number; bytes: number; gzip: number }>;
  top: Record<number, [string, Tally][]>;
  minutes: number;
}): string {
  const { meta } = r;
  const q = (p: number) => r.margins[Math.floor(p * (r.margins.length - 1))]!.toFixed(2);
  const lines: string[] = [];
  lines.push('# Rapport qualité des données', '');
  lines.push(`Généré le ${meta.generatedAt} en ${r.minutes.toFixed(1)} min. Seuil : une suite est retenue si assez de morceaux la contiennent (${meta.lengths.map((n, i) => `${meta.minSongs[i]} pour ${n} degrés`).join(', ')}).`, '');
  lines.push('> Fichier régénéré à chaque `npm run data`. Le versionner permet de voir, dans le diff, ce qu’une mise à jour des sources a changé.', '');
  lines.push('## Corpus', '');
  lines.push(`- Chordonomicon : ${fr(r.read)} progressions lues, ${fr(r.dropped)} écartées (moins de deux degrés distincts), **${fr(meta.corpus.songs)} retenues**.`);
  lines.push(`- Genre principal connu : ${fr(meta.corpus.withGenre)} (${pct(meta.corpus.withGenre, meta.corpus.songs)}) ; année ou décennie connue : ${fr(meta.corpus.withYear)} (${pct(meta.corpus.withYear, meta.corpus.songs)}).`);
  lines.push(`- Mode estimé mineur : ${fr(meta.corpus.minor)} (${pct(meta.corpus.minor, meta.corpus.songs)}).`);
  lines.push(`- iRb : ${fr(meta.named.irb)} standards de jazz ; McGill Billboard : ${fr(meta.named.billboard)} titres distincts (après dédoublonnage des entrées classées plusieurs fois).`, '');
  lines.push('| Genre | Morceaux |', '| --- | --: |');
  meta.genres.forEach((g, i) => lines.push(`| ${g} | ${fr(meta.corpus.byGenre[i]!)} |`));
  lines.push('', '| Décennie | Morceaux |', '| --- | --: |');
  meta.decades.forEach((d, i) => lines.push(`| ${d === 1950 ? 'jusqu’aux années 1950' : `années ${d}`} | ${fr(meta.corpus.byDecade[i]!)} |`));
  lines.push('', '## Estimation de tonalité', '');
  lines.push('Chordonomicon n’a pas de tonalité : elle est estimée depuis les accords (accord avec la gamme majeure, pondéré par la durée, bonus au premier et au dernier accord ; le mode se décide ensuite entre le majeur et son relatif mineur). Mesurée là où la tonalité est annotée :', '');
  const { irb, billboard } = meta.keyAccuracy;
  lines.push(`- **iRb** (${fr(irb.n)} standards, tonalité et mode annotés) : armure juste **${pct(irb.signature, irb.n)}**, tonique et mode exacts ${pct(irb.exact, irb.n)}.`);
  lines.push(`- **Billboard** (${fr(billboard.n)} titres, tonique annotée) : tonique juste **${pct(billboard.tonic, billboard.n)}**, armure compatible avec la tonique ${pct(billboard.signature, billboard.n)}.`);
  lines.push(`- Marge de décision sur Chordonomicon (écart relatif entre la meilleure armure et la deuxième) : médiane ${q(0.5)}, premier décile ${q(0.1)}, dernier décile ${q(0.9)}.`, '');
  lines.push('Les comptages se font dans l’armure (relatif majeur) : c’est la mesure « armure juste » qui compte pour la page. Le mode ne sert qu’à dire « dont N en mineur ». Les six poids de l’estimateur (premier accord, dernier, débuts de section, accords de tonique, emprunts, cadence V→I) ont été choisis par une recherche en grille sur ces deux mêmes corpus ; la grille est grossière (trois à cinq valeurs par poids), ce qui limite l’optimisme de la mesure, mais elle n’est pas indépendante.', '');
  lines.push(`« Vu dès » : la première année où au moins ${FIRST_YEAR_SUPPORT} morceaux datés contiennent la suite ; les dates antérieures à ${MIN_PLAUSIBLE_YEAR} sont tenues pour des bouche-trous et ignorées.`, '');
  lines.push('## Suites retenues', '');
  lines.push('| Longueur | Suites | JSON | gzippé |', '| --: | --: | --: | --: |');
  for (const n of meta.lengths) {
    const s = r.shardSizes[n]!;
    lines.push(`| ${n} | ${fr(s.rows)} | ${(s.bytes / 1024).toFixed(0)} Ko | ${(s.gzip / 1024).toFixed(0)} Ko |`);
  }
  const totalGzip = Object.values(r.shardSizes).reduce((a, s) => a + s.gzip, 0);
  lines.push('', `Total gzippé des agrégats : ${(totalGzip / 1024).toFixed(0)} Ko (chaque page ne charge que la longueur demandée).`, '');
  lines.push('## Les suites les plus fréquentes', '');
  for (const n of meta.lengths) {
    lines.push(`### ${n} degrés`, '');
    for (const [k, t] of r.top[n]!) lines.push(`- ${labelOfKey(k).replaceAll(',', '–')} : ${fr(t.total)} morceaux (${pct(t.total, meta.corpus.songs)}), dont ${pct(t.minor, t.total)} en mineur${firstYear(t) ? `, vu dès ${firstYear(t)}` : ''}`);
    lines.push('');
  }
  return lines.join('\n');
}

/** Exporté pour les tests du domaine : la conversion d'une grille nommée. */
export { namedSong as toNamedSong, type Chord };
