/**
 * Pipeline : les roses des styles, dans public/data/carte-des-styles/.
 *
 *   npm run data -- carte-des-styles
 *
 * Pour chaque style (douze genres de Chordonomicon, standards de l'iRb, tubes du Billboard) : les parts des 576
 * transitions entre classes, les rayons sur les douze axes communs, les cinq signatures et le centre des vecteurs.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseChord } from '@shell/music/chords';
import { tokensOf } from '@shell/music/degrees';
import { ensureCorpora, type CorpusSong } from '@tools/lib/corpora';
import { GENRES, knownKey, loadChordonomiconDegrees, packSections, SECTION_BREAK } from '@tools/lib/degrees-corpus';
import { loadNamedSongs } from '@tools/lib/named-songs';
import { log } from '@tools/lib/log';
import { AXES, SCHEMA_VERSION, type SongsFile, type StyleRose, type StylesFile } from '../data/contract';
import { CLASSES, DIMS, roseAxes, shares, signatures, topTransitions, transitionLabel } from '../domain/compass';
import { classOfToken, songVector } from './vectors';

const PIPELINE = import.meta.dirname;
const REPO = join(PIPELINE, '..', '..', '..');
const OUT = join(REPO, 'public', 'data', 'carte-des-styles');

const GENRE_LABELS: Record<string, string> = { pop: 'pop', rock: 'rock', country: 'country', alternative: 'alternatif', 'pop rock': 'pop rock', punk: 'punk', metal: 'metal', rap: 'rap', soul: 'soul', jazz: 'jazz (tablatures)', reggae: 'reggae', electronic: 'électro' };

interface Acc {
  key: string;
  label: string;
  kind: 'genre' | 'corpus';
  songs: number;
  counts: Float64Array;
  centroid: Float64Array;
  vectors: number;
}
const acc = (key: string, label: string, kind: Acc['kind']): Acc => ({ key, label, kind, songs: 0, counts: new Float64Array(DIMS), centroid: new Float64Array(DIMS), vectors: 0 });

function addTokens(a: Acc, tokens: ArrayLike<number>) {
  a.songs++;
  let prev = -1;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t === SECTION_BREAK) {
      prev = -1;
      continue;
    }
    const c = classOfToken(t);
    if (prev >= 0 && prev !== c) a.counts[prev * CLASSES + c]!++;
    prev = c;
  }
  const v = songVector(tokens);
  if (v) {
    a.vectors++;
    for (let i = 0; i < DIMS; i++) a.centroid[i]! += v[i]!;
  }
}

const namedTokens = (song: CorpusSong, tonic: number) => packSections(song.sections.map((sec) => tokensOf(sec.chords.map((c) => parseChord(c.symbol)), tonic)).filter((t) => t.length));

export default async function buildData(): Promise<void> {
  const t0 = Date.now();
  await mkdir(OUT, { recursive: true });
  log.step('Corpus');
  await ensureCorpora();

  log.step('Morceaux nommés');
  const { irb, billboard, named } = await loadNamedSongs();
  const songsText = JSON.stringify({ version: SCHEMA_VERSION, songs: named } satisfies SongsFile);
  await writeFile(join(OUT, 'songs.json'), songsText);

  log.step('Transitions par style');
  const degrees = await loadChordonomiconDegrees();
  const all = acc('all', 'ensemble', 'corpus');
  const genres = GENRES.map((g) => acc(g, GENRE_LABELS[g] ?? g, 'genre'));
  for (const s of degrees.songs) {
    addTokens(all, s.tokens);
    if (s.genre >= 0) addTokens(genres[s.genre]!, s.tokens);
  }
  const irbAcc = acc('irb', 'jazz (standards)', 'corpus');
  const bbAcc = acc('billboard', 'tubes du Billboard', 'corpus');
  for (const [a, songs] of [
    [irbAcc, irb],
    [bbAcc, billboard],
  ] as const) {
    for (const song of songs) {
      const k = knownKey(song);
      if (k) addTokens(a, namedTokens(song, k.relativeMajor));
    }
  }

  log.step('Roses et signatures');
  const baseShares = shares(all.counts);
  const axes = topTransitions(baseShares, AXES);
  const styles: StyleRose[] = [...genres, irbAcc, bbAcc].map((a) => {
    const sh = shares(a.counts);
    return {
      key: a.key,
      label: a.label,
      kind: a.kind,
      songs: a.songs,
      transitions: a.counts.reduce((x, y) => x + y, 0),
      axes: roseAxes(sh, baseShares, axes).map((x) => Math.round(x * 1000) / 1000),
      signatures: signatures(sh, baseShares).map((s) => ({ ...s, share: round(s.share, 5), base: round(s.base, 5), lift: round(s.lift, 3) })),
      centroid: Array.from(a.centroid, (x) => round(x / Math.max(1, a.vectors), 4)),
    };
  });
  const file: StylesFile = { version: SCHEMA_VERSION, generatedAt: new Date().toISOString(), axes, baseShares: baseShares.map((x) => round(x, 6)), styles };
  const text = JSON.stringify(file);
  await writeFile(join(OUT, 'styles.json'), text);
  log.info(`styles.json : ${(text.length / 1024).toFixed(0)} Ko (${(gzipSync(text).length / 1024).toFixed(0)} Ko gzippés) ; songs.json : ${(gzipSync(songsText).length / 1024).toFixed(0)} Ko gzippés`);

  await writeFile(join(PIPELINE, 'REPORT.md'), renderReport(file, (Date.now() - t0) / 60_000));
  log.step(`Terminé en ${((Date.now() - t0) / 60_000).toFixed(1)} min.`);
}

const round = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;
const fr = (n: number) => n.toLocaleString('fr-FR');
const pct = (x: number) => `${(100 * x).toFixed(1)} %`;

function renderReport(f: StylesFile, minutes: number): string {
  const L: string[] = [];
  L.push('# Rapport qualité des données', '');
  L.push(`Généré le ${f.generatedAt} en ${minutes.toFixed(1)} min. Transitions entre 24 classes (degré × majeur/mineur ; diminués comptés mineurs, augmentés et suspendus majeurs), à l’intérieur d’une partie, sans répétition immédiate, dans l’armure estimée pour les tablatures et annotée pour l’iRb et le Billboard. La sonde de faisabilité de la carte est dans \`PROBE.md\` : elle a conduit à cette boussole.`, '');
  L.push('> Fichier régénéré à chaque `npm run data`. Le versionner permet de voir, dans le diff, ce qu’une mise à jour des sources a changé.', '');
  L.push('## Les douze axes (transitions les plus fréquentes de l’ensemble)', '', '| Axe | Transition | Part |', '| --: | --- | --: |');
  f.axes.forEach((a, i) => L.push(`| ${i + 1} | ${transitionLabel(a.transition)} | ${pct(a.base)} |`));
  L.push('', '## Les styles et leurs signatures', '');
  for (const s of f.styles) {
    L.push(`### ${s.label} (${fr(s.songs)} morceaux, ${fr(s.transitions)} transitions)`, '');
    for (const sig of s.signatures) L.push(`- ${transitionLabel([sig.from, sig.to])} : ${pct(sig.share)} contre ${pct(sig.base)} dans l’ensemble (× ${sig.lift.toFixed(1)})`);
    L.push(`- Rayons : ${s.axes.map((x) => x.toFixed(2)).join(' · ')}`, '');
  }
  return L.join('\n');
}
