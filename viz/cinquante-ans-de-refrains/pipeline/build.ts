/**
 * Pipeline : mesures par année et par style, dans public/data/cinquante-ans-de-refrains/years.json.
 *
 *   npm run data -- cinquante-ans-de-refrains
 *
 * Deux passes : le cache commun des degrés (accords distincts, mineurs, emprunts, degrés) et une relecture du CSV
 * de Chordonomicon pour les septièmes (le cache ne garde que les classes de triade). Le Billboard est mesuré à part.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseChord } from '@shell/music/chords';
import { tokensOf } from '@shell/music/degrees';
import { ensureCorpora, readChordonomicon } from '@tools/lib/corpora';
import { GENRES, MIN_PLAUSIBLE_YEAR, knownKey, loadChordonomiconDegrees, packSections } from '@tools/lib/degrees-corpus';
import { loadNamedSongs } from '@tools/lib/named-songs';
import { log } from '@tools/lib/log';
import { DEGREE_BINS, MIN_SONGS_YEAR, SCHEMA_VERSION, type Series, type YearsFile } from '../data/contract';
import { addSong, finishYear, isSeventh, measureSong, newYearAcc, type YearAcc } from '../domain/measures';

const PIPELINE = import.meta.dirname;
const REPO = join(PIPELINE, '..', '..', '..');
const OUT = join(REPO, 'public', 'data', 'cinquante-ans-de-refrains');
const FIRST_YEAR = 1950;
const LAST_YEAR = 2024;
const GENRE_LABELS: Record<string, string> = { pop: 'pop', rock: 'rock', country: 'country', alternative: 'alternatif', 'pop rock': 'pop rock', punk: 'punk', metal: 'metal', rap: 'rap', soul: 'soul', jazz: 'jazz (tablatures)', reggae: 'reggae', electronic: 'électro' };

type Table = Map<number, YearAcc>;
const table = (): Table => new Map();
const yearAcc = (t: Table, y: number) => {
  let a = t.get(y);
  if (!a) {
    a = newYearAcc(y);
    t.set(y, a);
  }
  return a;
};

export default async function buildData(): Promise<void> {
  const t0 = Date.now();
  await mkdir(OUT, { recursive: true });
  log.step('Corpus');
  await ensureCorpora();

  log.step('Tablatures : mesures par année et par genre (cache des degrés)');
  const degrees = await loadChordonomiconDegrees();
  const all = table();
  const byGenre = GENRES.map(() => table());
  for (const s of degrees.songs) {
    if (s.year === null || s.year < FIRST_YEAR || s.year > LAST_YEAR) continue;
    const m = measureSong(s.tokens);
    if (!m) continue;
    addSong(yearAcc(all, s.year), m);
    if (s.genre >= 0) addSong(yearAcc(byGenre[s.genre]!, s.year), m);
  }

  log.step('Tablatures : septièmes (relecture du CSV)');
  let read = 0;
  for await (const song of readChordonomicon()) {
    read++;
    const y = song.year;
    if (y === undefined || y < Math.max(FIRST_YEAR, MIN_PLAUSIBLE_YEAR) || y > LAST_YEAR) continue;
    let sevenths = 0;
    let total = 0;
    for (const sec of song.sections) {
      for (const c of sec.chords) {
        const chord = parseChord(c.symbol);
        if (!chord) continue;
        total++;
        if (isSeventh(chord.quality)) sevenths++;
      }
    }
    if (!total) continue;
    const targets = [yearAcc(all, y)];
    const gi = song.genre ? GENRES.indexOf(song.genre as (typeof GENRES)[number]) : -1;
    if (gi >= 0) targets.push(yearAcc(byGenre[gi]!, y));
    for (const a of targets) {
      a.seventhChords += sevenths;
      a.seventhTotal += total;
    }
    if (read % 200_000 === 0) log.info(`${read} lus`);
  }

  log.step('Billboard : mesures par année');
  const { billboard } = await loadNamedSongs();
  const bb = table();
  for (const song of billboard) {
    const k = knownKey(song);
    if (!k || !song.year) continue;
    const tokens = packSections(song.sections.map((sec) => tokensOf(sec.chords.map((c) => parseChord(c.symbol)), k.relativeMajor)).filter((t) => t.length));
    const m = measureSong(tokens);
    if (!m) continue;
    const a = yearAcc(bb, song.year);
    addSong(a, m, { title: song.title!, artist: song.artist ?? '' });
    for (const sec of song.sections) {
      for (const c of sec.chords) {
        const chord = parseChord(c.symbol);
        if (!chord) continue;
        a.seventhTotal++;
        if (isSeventh(chord.quality)) a.seventhChords++;
      }
    }
  }

  const toSeries = (key: string, label: string, corpus: Series['corpus'], t: Table, genre?: string): Series => {
    const years = [...t.values()].filter((a) => a.songs > 0).sort((a, b) => a.year - b.year).map(finishYear);
    const s: Series = { key, label, corpus, minSongs: MIN_SONGS_YEAR[corpus], years };
    if (genre) s.genre = genre;
    return s;
  };
  const series: Series[] = [
    toSeries('chordonomicon', 'toutes les tablatures', 'chordonomicon', all),
    toSeries('billboard', 'tubes du Billboard', 'billboard', bb),
    ...GENRES.map((g, i) => toSeries(`cho:${g}`, GENRE_LABELS[g] ?? g, 'chordonomicon', byGenre[i]!, g)),
  ];
  const file: YearsFile = { version: SCHEMA_VERSION, generatedAt: new Date().toISOString(), series };
  const text = JSON.stringify(file);
  await writeFile(join(OUT, 'years.json'), text);
  log.info(`years.json : ${(text.length / 1024).toFixed(0)} Ko (${(gzipSync(text).length / 1024).toFixed(0)} Ko gzippés)`);
  await writeFile(join(PIPELINE, 'REPORT.md'), renderReport(file, (Date.now() - t0) / 60_000));
  log.step(`Terminé en ${((Date.now() - t0) / 60_000).toFixed(1)} min.`);
}

const fr = (n: number) => n.toLocaleString('fr-FR');
const pct = (x: number | null) => (x === null ? '—' : `${(100 * x).toFixed(1)} %`);

function renderReport(f: YearsFile, minutes: number): string {
  const L: string[] = [];
  L.push('# Rapport qualité des données', '');
  L.push(`Généré le ${f.generatedAt} en ${minutes.toFixed(1)} min. Par année de sortie (tablatures : date de sortie Spotify, ou décennie seule quand la date manque, alors rangée à l’année ronde ; Billboard : année du classement). Accords distincts = classes degré × majeur/mineur ; mineurs, emprunts (fondamentale hors gamme) et degrés comptés sur les occurrences sans répétition immédiate ; septièmes comptées sur les symboles bruts. Années à moins de ${MIN_SONGS_YEAR.chordonomicon} tablatures (ou ${MIN_SONGS_YEAR.billboard} titres du Billboard) hachurées dans la page. Aucun lissage.`, '');
  L.push('> Fichier régénéré à chaque `npm run data`. Le versionner permet de voir, dans le diff, ce qu’une mise à jour des sources a changé.', '');
  for (const s of f.series.filter((x) => x.key === 'chordonomicon' || x.key === 'billboard')) {
    L.push(`## ${s.label}`, '', '| Année | Morceaux | Accords distincts | Mineurs | ≤ 4 accords | Septièmes | Emprunts | ' + DEGREE_BINS.join(' | ') + ' |', '| --: | --: | --: | --: | --: | --: | --: |' + DEGREE_BINS.map(() => ' --: |').join(''));
    for (const y of s.years) {
      if (s.key === 'chordonomicon' && y.year % 5 !== 0) continue;
      L.push(`| ${y.year} | ${fr(y.songs)} | ${y.distincts.toFixed(2)} | ${pct(y.mineurs)} | ${pct(y.quatre)} | ${pct(y.septiemes)} | ${pct(y.emprunts)} | ${y.degrees.map((d) => pct(d)).join(' | ')} |`);
    }
    L.push('');
    if (s.key === 'chordonomicon') L.push('(une année sur cinq affichée ici ; toutes sont dans le fichier)', '');
  }
  L.push('## Effectifs par genre (années couvertes à 200 morceaux et plus)', '', '| Genre | Années ≥ 200 | Première | Dernière |', '| --- | --: | --: | --: |');
  for (const s of f.series.filter((x) => x.genre)) {
    const ok = s.years.filter((y) => y.songs >= s.minSongs);
    L.push(`| ${s.label} | ${ok.length} | ${ok[0]?.year ?? '—'} | ${ok[ok.length - 1]?.year ?? '—'} |`);
  }
  L.push('', '## Note sur les dates', '');
  L.push('Un tiers des tablatures n’a qu’une décennie : elles sont rangées à l’année ronde (1990, 2000…), ce qui gonfle ces années. La page le signale ; les courbes par décennie ne sont pas affectées.', '');
  return L.join('\n');
}
