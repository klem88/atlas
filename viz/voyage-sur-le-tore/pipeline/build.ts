/**
 * Pipeline : morceaux nommés et distances PLR par style, dans public/data/voyage-sur-le-tore/.
 *
 *   npm run data -- voyage-sur-le-tore
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseChord } from '@shell/music/chords';
import { tokenToDegree } from '@shell/music/degrees';
import { ensureCorpora, type CorpusSong } from '@tools/lib/corpora';
import { DECADES, GENRES, SECTION_BREAK, knownKey, loadChordonomiconDegrees } from '@tools/lib/degrees-corpus';
import { loadNamedSongs } from '@tools/lib/named-songs';
import { log } from '@tools/lib/log';
import { SCHEMA_VERSION, type SongsFile, type StyleSteps, type StylesFile } from '../data/contract';
import { validateSongs, validateStyles } from '../data/validate';
import { nearestTriad, plrDistance, triadIndex, type Triad } from '../domain/tonnetz';

const PIPELINE = import.meta.dirname;
const REPO = join(PIPELINE, '..', '..', '..');
const OUT = join(REPO, 'public', 'data', 'voyage-sur-le-tore');

const GENRE_LABELS: Record<string, string> = { pop: 'pop', rock: 'rock', country: 'country', alternative: 'alternatif', 'pop rock': 'pop rock', punk: 'punk', metal: 'metal', rap: 'rap', soul: 'soul', jazz: 'jazz (tablatures)', reggae: 'reggae', electronic: 'électro' };

/** Triade d'un jeton de degré (dans une tonalité quelconque : la distance PLR est invariante par transposition). */
function triadOfToken(t: number): Triad {
  const d = tokenToDegree(t);
  return { root: d.step, mode: d.cls === 'min' || d.cls === 'dim' ? 'min' : 'maj' };
}
const TOKEN_DISTANCE: Uint8Array = (() => {
  const table = new Uint8Array(72 * 72);
  for (let a = 0; a < 72; a++) for (let b = 0; b < 72; b++) table[a * 72 + b] = plrDistance(triadOfToken(a), triadOfToken(b));
  return table;
})();

interface Acc {
  key: string;
  label: string;
  kind: StyleSteps['kind'];
  songs: number;
  histogram: number[];
}
const acc = (key: string, label: string, kind: StyleSteps['kind']): Acc => ({ key, label, kind, songs: 0, histogram: new Array<number>(6).fill(0) });

function addTokens(a: Acc, tokens: ArrayLike<number>) {
  let prev = -1;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t === SECTION_BREAK) {
      prev = -1;
      continue;
    }
    if (prev >= 0 && prev !== t) {
      const ta = triadIndex(triadOfToken(prev));
      const tb = triadIndex(triadOfToken(t));
      if (ta !== tb) a.histogram[Math.min(5, TOKEN_DISTANCE[prev * 72 + t]!)]!++;
    }
    prev = t;
  }
}

function addSong(a: Acc, song: CorpusSong) {
  let prev: Triad | null = null;
  for (const sec of song.sections) {
    prev = null;
    for (const c of sec.chords) {
      const chord = parseChord(c.symbol);
      if (!chord) continue;
      const { triad } = nearestTriad(chord);
      if (prev && triadIndex(prev) !== triadIndex(triad)) a.histogram[Math.min(5, plrDistance(prev, triad))]!++;
      prev = triad;
    }
  }
}

const finish = (a: Acc): StyleSteps => {
  const steps = a.histogram.reduce((x, y) => x + y, 0);
  const mean = steps ? a.histogram.reduce((x, n, d) => x + n * d, 0) / steps : 0;
  return { key: a.key, label: a.label, kind: a.kind, songs: a.songs, steps, mean: Math.round(mean * 1000) / 1000, histogram: a.histogram };
};

export default async function buildData(): Promise<void> {
  const t0 = Date.now();
  await mkdir(OUT, { recursive: true });
  log.step('Corpus');
  await ensureCorpora();

  log.step('Morceaux nommés');
  const { irb, billboard, named } = await loadNamedSongs();
  const songs: SongsFile = validateSongs({ version: SCHEMA_VERSION, songs: named });
  const songsText = JSON.stringify(songs);
  await writeFile(join(OUT, 'songs.json'), songsText);
  log.info(`${named.length} morceaux (${(gzipSync(songsText).length / 1024).toFixed(0)} Ko gzippés)`);

  log.step('Distances PLR par style');
  const degrees = await loadChordonomiconDegrees();
  const all = acc('all', 'toutes les tablatures', 'all');
  const genres = GENRES.map((g) => acc(g, GENRE_LABELS[g] ?? g, 'genre'));
  const decades = DECADES.map((d, i) => acc(`d${d}`, i === 0 ? 'avant 1960' : `années ${d}`, 'decade'));
  for (const s of degrees.songs) {
    const targets = [all];
    if (s.genre >= 0) targets.push(genres[s.genre]!);
    if (s.decade >= 0) targets.push(decades[s.decade]!);
    for (const a of targets) {
      a.songs++;
      addTokens(a, s.tokens);
    }
  }
  const irbAcc = acc('irb', 'jazz (standards)', 'corpus');
  for (const s of irb) {
    if (!knownKey(s)) continue;
    irbAcc.songs++;
    addSong(irbAcc, s);
  }
  const bbAcc = acc('billboard', 'tubes du Billboard', 'corpus');
  for (const s of billboard) {
    if (!knownKey(s)) continue;
    bbAcc.songs++;
    addSong(bbAcc, s);
  }
  const styles: StylesFile = validateStyles({ version: SCHEMA_VERSION, generatedAt: new Date().toISOString(), styles: [all, ...genres, irbAcc, bbAcc, ...decades].map(finish) });
  await writeFile(join(OUT, 'styles.json'), JSON.stringify(styles));

  await writeFile(join(PIPELINE, 'REPORT.md'), renderReport(styles, named.length, (Date.now() - t0) / 60_000));
  log.step(`Terminé en ${((Date.now() - t0) / 60_000).toFixed(1)} min.`);
}

const fr = (n: number) => n.toLocaleString('fr-FR');
const pct = (a: number, b: number) => `${((100 * a) / Math.max(1, b)).toFixed(1)} %`;

function renderReport(f: StylesFile, namedCount: number, minutes: number): string {
  const L: string[] = [];
  L.push('# Rapport qualité des données', '');
  L.push(`Généré le ${f.generatedAt} en ${minutes.toFixed(1)} min. Un pas est un changement d’accord à l’intérieur d’une partie ; sa longueur est la distance néo-riemannienne entre les deux triades (nombre minimal de transformations P, L, R ; septièmes repliées sur leur triade, diminués comptés mineurs, augmentés et suspendus majeurs). Les tablatures sont lues dans l’armure estimée (la distance PLR ne dépend pas de la tonalité, seulement de l’intervalle entre fondamentales et des modes).`, '');
  L.push('> Fichier régénéré à chaque `npm run data`. Le versionner permet de voir, dans le diff, ce qu’une mise à jour des sources a changé.', '');
  L.push(`Morceaux nommés servis : ${fr(namedCount)} (iRb et Billboard).`, '');
  L.push('## Longueur des pas par style', '', '| Clé | Style | Morceaux | Pas | Moyenne | 1 pas | 2 pas | 3 pas | 4 pas | 5 et plus |', '| --- | --- | --: | --: | --: | --: | --: | --: | --: | --: |');
  for (const s of f.styles) L.push(`| ${s.key} | ${s.label} | ${fr(s.songs)} | ${fr(s.steps)} | ${s.mean.toFixed(2)} | ${pct(s.histogram[1]!, s.steps)} | ${pct(s.histogram[2]!, s.steps)} | ${pct(s.histogram[3]!, s.steps)} | ${pct(s.histogram[4]!, s.steps)} | ${pct(s.histogram[5]!, s.steps)} |`);
  L.push('', 'Repères : un pas de 1 est un changement d’une seule note (do majeur → la mineur) ; la quinte (do → sol) vaut 2 ; le ton (do → ré) vaut 4 ; le triton est le plus loin.', '');
  return L.join('\n');
}
