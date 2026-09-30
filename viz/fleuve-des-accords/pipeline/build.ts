/**
 * Pipeline : corpus d'accords → transitions entre degrés par style, dans public/data/fleuve-des-accords/.
 *
 *   npm run data -- fleuve-des-accords
 *
 * Réutilise le cache commun (`tools/lib/degrees-corpus.ts`) : Chordonomicon déjà tokenisé par le pipeline
 * de « progression-jouee », ou tokenisé ici la première fois (deux minutes).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { degreeLabel, tokenToDegree } from '@shell/music/degrees';
import { dedupeBillboard, ensureCorpora, readBillboard, readIrb, type CorpusSong } from '@tools/lib/corpora';
import { DECADES, GENRES, knownKey, loadChordonomiconDegrees, packSections, sectionTokens } from '@tools/lib/degrees-corpus';
import { log } from '@tools/lib/log';
import { MIN_TRANSITIONS, SCHEMA_VERSION, type StyleAgg, type TransitionsFile } from '../data/contract';
import { validateTransitions } from '../data/validate';
import { addTransitions, matrixRows, newMatrix, type Matrix } from './transitions';

const PIPELINE = import.meta.dirname;
const REPO = join(PIPELINE, '..', '..', '..');
const OUT = join(REPO, 'public', 'data', 'fleuve-des-accords');

/** Libellés avec article : ils entrent tels quels dans les phrases (« après un V, la pop va au I… »). */
export const GENRE_LABELS: Record<string, string> = {
  pop: 'la pop',
  rock: 'le rock',
  country: 'la country',
  alternative: 'l’alternatif',
  'pop rock': 'le pop rock',
  punk: 'le punk',
  metal: 'le metal',
  rap: 'le rap',
  soul: 'la soul',
  jazz: 'le jazz des tablatures',
  reggae: 'le reggae',
  electronic: 'l’électro',
};

interface Bucket {
  agg: Omit<StyleAgg, 'rows'>;
  m: Matrix;
}

const bucket = (key: string, label: string, kind: StyleAgg['kind']): Bucket => ({ agg: { key, label, kind, songs: 0, transitions: 0 }, m: newMatrix() });

export default async function buildData(): Promise<void> {
  const t0 = Date.now();
  await mkdir(OUT, { recursive: true });
  log.step('Corpus');
  await ensureCorpora();

  log.step('Chordonomicon : transitions par genre et par décennie');
  const degrees = await loadChordonomiconDegrees();
  const all = bucket('all', 'l’ensemble des tablatures', 'all');
  const genres = GENRES.map((g) => bucket(g, GENRE_LABELS[g] ?? g, 'genre'));
  const decades = DECADES.map((d, i) => bucket(`d${d}`, i === 0 ? 'l’avant-1960' : `les années ${d}`, 'decade'));
  for (const s of degrees.songs) {
    const targets = [all];
    if (s.genre >= 0) targets.push(genres[s.genre]!);
    if (s.decade >= 0) targets.push(decades[s.decade]!);
    let n = -1;
    for (const b of targets) {
      const added = addTransitions(b.m, s.tokens);
      if (n < 0) n = added;
      b.agg.songs++;
      b.agg.transitions += added;
    }
  }

  log.step('Morceaux nommés : iRb et Billboard');
  const irb = bucket('irb', 'le jazz des standards', 'corpus');
  const billboard = bucket('billboard', 'les tubes du Billboard', 'corpus');
  for (const [b, songs] of [
    [irb, await readIrb()],
    [billboard, dedupeBillboard(await readBillboard())],
  ] as const) {
    for (const song of songs) {
      const key = knownKey(song as CorpusSong);
      if (!key) continue;
      const tokens = packSections(sectionTokens(song as CorpusSong, key.relativeMajor));
      b.agg.songs++;
      b.agg.transitions += addTransitions(b.m, tokens);
    }
  }

  log.step('Écriture');
  const styles: StyleAgg[] = [all, ...genres, irb, billboard, ...decades].map((b) => ({ ...b.agg, rows: matrixRows(b.m, MIN_TRANSITIONS) }));
  const file: TransitionsFile = validateTransitions({ version: SCHEMA_VERSION, generatedAt: new Date().toISOString(), styles });
  const text = JSON.stringify(file);
  await writeFile(join(OUT, 'transitions.json'), text);
  const gz = gzipSync(text).length;
  log.info(`transitions.json : ${(text.length / 1024).toFixed(0)} Ko, ${(gz / 1024).toFixed(0)} Ko gzippés`);

  await writeFile(join(PIPELINE, 'REPORT.md'), renderReport(file, gz, (Date.now() - t0) / 60_000));
  log.step(`Terminé en ${((Date.now() - t0) / 60_000).toFixed(1)} min.`);
}

const fr = (n: number) => n.toLocaleString('fr-FR');
const lbl = (t: number) => degreeLabel(tokenToDegree(t));
const pct = (a: number, b: number) => `${((100 * a) / Math.max(1, b)).toFixed(1)} %`;

function renderReport(f: TransitionsFile, gz: number, minutes: number): string {
  const L: string[] = [];
  L.push('# Rapport qualité des données', '');
  L.push(`Généré le ${f.generatedAt} en ${minutes.toFixed(1)} min. Une transition est un passage d’un degré au suivant à l’intérieur d’une partie (couplet, refrain…), sur la suite des degrés sans répétition immédiate, en classe de triade, dans l’armure estimée (voir le rapport de progression-jouee pour la précision). Chaque occurrence compte une fois ; les transitions vues moins de ${MIN_TRANSITIONS} fois dans un agrégat sont écartées.`, '');
  L.push('> Fichier régénéré à chaque `npm run data`. Le versionner permet de voir, dans le diff, ce qu’une mise à jour des sources a changé.', '');
  L.push(`Fichier : \`transitions.json\`, ${(gz / 1024).toFixed(0)} Ko gzippés, ${f.styles.length} agrégats.`, '');
  L.push('## Agrégats', '', '| Clé | Style | Morceaux | Transitions | Lignes gardées | Couverture |', '| --- | --- | --: | --: | --: | --: |');
  for (const s of f.styles) {
    const kept = s.rows.reduce((a, r) => a + r[2], 0);
    L.push(`| ${s.key} | ${s.label} | ${fr(s.songs)} | ${fr(s.transitions)} | ${fr(s.rows.length)} | ${pct(kept, s.transitions)} |`);
  }
  L.push('', '## Après un V, où va-t-on ?', '');
  L.push('Part des transitions qui partent du V (majeur), par style : les trois arrivées les plus fréquentes.', '');
  const V = 7 * 6; // step 7, classe maj (indice 0)
  for (const s of f.styles) {
    const from = s.rows.filter((r) => r[0] === V);
    const total = from.reduce((a, r) => a + r[2], 0);
    if (!total) continue;
    L.push(`- **${s.label}** : ${from.slice(0, 3).map((r) => `${lbl(r[1])} ${pct(r[2], total)}`).join(', ')} (${fr(total)} départs du V)`);
  }
  L.push('', '## Les dix transitions les plus fréquentes', '');
  for (const s of f.styles.filter((x) => ['all', 'irb', 'billboard', 'pop', 'metal'].includes(x.key))) {
    L.push(`### ${s.label}`, '');
    for (const [a, b, n] of s.rows.slice(0, 10)) L.push(`- ${lbl(a)} → ${lbl(b)} : ${fr(n)} (${pct(n, s.transitions)})`);
    L.push('');
  }
  return L.join('\n');
}
