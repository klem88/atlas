/**
 * Pipeline : la Weimar Jazz Database (SQLite) → comptes de degrés relatifs par accord, dans
 * public/data/ou-le-solo-respire/solos.json.
 *
 *   npm run data -- ou-le-solo-respire
 *
 * Lecture avec `node:sqlite` (Node 22.5+), sans dépendance. Chaque note d'un solo est rattachée à la section CHORD
 * qui la couvre (indices de notes dans le solo), puis comptée par degré relatif à la fondamentale de l'accord ;
 * « sur le temps » = premier tatum du temps. Aucune suite de notes n'est écrite.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { gzipSync } from 'node:zlib';
import { parseChord, type Quality } from '@shell/music/chords';
import { CORPORA_CACHE } from '@tools/lib/corpora';
import { downloadCached } from '@tools/lib/download';
import { log } from '@tools/lib/log';
import { SCHEMA_VERSION, type Dist, type SoloRecord, type SolosFile, type Tune, type TypeAgg } from '../data/contract';
import { DEGREE_LONG, onceEvery, parseChordChanges, read, relativeDegree, shares } from '../domain/solo';

const PIPELINE = import.meta.dirname;
const REPO = join(PIPELINE, '..', '..', '..');
const OUT = join(REPO, 'public', 'data', 'ou-le-solo-respire');
const WJD_URL = 'https://jazzomat.hfm-weimar.de/download/downloads/wjazzd.db';

const QUALITY_LABELS: Record<Quality, string> = { maj: 'majeur', min: 'mineur', dom7: 'dominante (7)', maj7: 'septième majeure', min7: 'mineur 7', dim: 'diminué', hdim: 'demi-diminué', sus: 'suspendu', aug: 'augmenté', other: 'autre' };

interface SoloRow {
  melid: number;
  compid: number;
  performer: string;
  title: string;
  instrument: string;
  style: string;
  key: string;
  chord_changes: string;
  composer: string | null;
  recordingdate: string | null;
  releasedate: string | null;
}

const newDist = (): Dist => ({ all: new Array<number>(12).fill(0), beat: new Array<number>(12).fill(0) });

export default async function buildData(): Promise<void> {
  const t0 = Date.now();
  await mkdir(OUT, { recursive: true });
  log.step('Weimar Jazz Database');
  const dbPath = await downloadCached(WJD_URL, join(CORPORA_CACHE, 'wjazzd.db'), { minBytes: 30e6 });
  const db = new DatabaseSync(dbPath, { readOnly: true });

  const solos = db
    .prepare(
      `select s.melid, s.compid, s.performer, s.title, s.instrument, s.style, s.key, s.chord_changes,
              c.composer, t.recordingdate, r.releasedate
       from solo_info s
       left join composition_info c on c.compid = s.compid
       left join track_info t on t.trackid = s.trackid
       left join record_info r on r.recordid = s.recordid
       order by s.compid, s.melid`,
    )
    .all() as unknown as SoloRow[];
  const notesStmt = db.prepare('select pitch, tatum from melody where melid = ? order by eventid');
  const chordsStmt = db.prepare("select start, end, value from sections where melid = ? and type = 'CHORD' order by start");

  log.step('Notes par accord');
  const tunes = new Map<number, Tune>();
  const types = new Map<Quality, TypeAgg>();
  let totalNotes = 0;
  let unmatched = 0;
  let unparsed = new Map<string, number>();
  const performers = new Set<string>();
  for (const s of solos) {
    const notes = notesStmt.all(s.melid) as unknown as { pitch: number; tatum: number }[];
    const sections = chordsStmt.all(s.melid) as unknown as { start: number; end: number; value: string }[];
    const rec: SoloRecord = { melid: s.melid, performer: s.performer, instrument: s.instrument, style: s.style, year: yearOf(s), chords: {}, notes: notes.length };
    performers.add(s.performer);
    const seenSymbols = new Set<string>();
    for (const sec of sections) {
      const sym = sec.value.trim();
      const chord = parseChord(sym);
      if (!chord) {
        if (sym !== 'NC') unparsed.set(sym, (unparsed.get(sym) ?? 0) + 1);
        continue;
      }
      const d = (rec.chords[sym] ??= newDist());
      seenSymbols.add(sym);
      const agg = types.get(chord.quality) ?? { quality: chord.quality, label: QUALITY_LABELS[chord.quality], occurrences: 0, dist: newDist() };
      agg.occurrences++;
      types.set(chord.quality, agg);
      for (let i = sec.start; i <= sec.end && i < notes.length; i++) {
        const n = notes[i]!;
        const deg = relativeDegree(n.pitch, chord.root);
        d.all[deg]!++;
        agg.dist.all[deg]!++;
        if (n.tatum === 1) {
          d.beat[deg]!++;
          agg.dist.beat[deg]!++;
        }
        totalNotes++;
      }
    }
    const covered = sections.reduce((a, sec) => a + Math.max(0, Math.min(sec.end, notes.length - 1) - sec.start + 1), 0);
    unmatched += Math.max(0, notes.length - covered);
    let tune = tunes.get(s.compid);
    if (!tune) {
      tune = { id: String(s.compid), title: s.title, composer: s.composer ?? '', key: s.key, grid: parseChordChanges(s.chord_changes), solos: [] };
      tunes.set(s.compid, tune);
    }
    tune.solos.push(rec);
  }
  log.info(`${solos.length} solos, ${tunes.size} standards, ${totalNotes} notes rattachées à un accord (${unmatched} hors section)`);
  if (unparsed.size) log.warn(`symboles illisibles : ${[...unparsed.entries()].map(([k, v]) => `${k} ×${v}`).join(', ')}`);

  const file: SolosFile = {
    version: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    totals: { tunes: tunes.size, solos: solos.length, notes: totalNotes, performers: performers.size },
    tunes: [...tunes.values()].sort((a, b) => a.title.localeCompare(b.title, 'en')),
    types: [...types.values()].sort((a, b) => b.occurrences - a.occurrences),
  };
  const text = JSON.stringify(file);
  await writeFile(join(OUT, 'solos.json'), text);
  log.info(`solos.json : ${(text.length / 1024).toFixed(0)} Ko (${(gzipSync(text).length / 1024).toFixed(0)} Ko gzippés)`);
  await writeFile(join(PIPELINE, 'REPORT.md'), renderReport(file, unmatched, unparsed, (Date.now() - t0) / 60_000));
  log.step(`Terminé en ${((Date.now() - t0) / 60_000).toFixed(1)} min.`);
}

function yearOf(s: SoloRow): number | null {
  for (const d of [s.recordingdate, s.releasedate]) {
    const y = Number(String(d ?? '').slice(0, 4));
    if (y >= 1900 && y <= 2100) return y;
  }
  return null;
}

const fr = (n: number) => n.toLocaleString('fr-FR');
const pct = (x: number) => `${(100 * x).toFixed(1)} %`;

function renderReport(f: SolosFile, unmatched: number, unparsed: Map<string, number>, minutes: number): string {
  const L: string[] = [];
  L.push('# Rapport qualité des données', '');
  L.push(`Généré le ${f.generatedAt} en ${minutes.toFixed(1)} min, depuis \`wjazzd.db\` (Weimar Jazz Database, Jazzomat, HfM Weimar). Chaque note d’un solo est rattachée à la section d’accord qui la couvre et comptée par degré relatif à la fondamentale de l’accord (0 = fondamentale, 4 = tierce, 7 = quinte, 10 = septième mineure…) ; « sur le temps » = premier tatum du temps. Aucune suite de notes n’est exportée.`, '');
  L.push('> Fichier régénéré à chaque `npm run data`. Le versionner permet de voir, dans le diff, ce qu’une mise à jour des sources a changé.', '');
  L.push('## Volumes', '');
  L.push(`- ${fr(f.totals.solos)} solos, ${fr(f.totals.tunes)} standards, ${fr(f.totals.performers)} solistes, ${fr(f.totals.notes)} notes rattachées à un accord ; ${fr(unmatched)} notes hors de toute section d’accord (ignorées).`);
  if (unparsed.size) L.push(`- Symboles d’accord illisibles (ignorés) : ${[...unparsed.entries()].map(([k, v]) => `${k} ×${v}`).join(', ')}.`);
  L.push('', '## Par type d’accord : où tombent les notes', '');
  L.push('| Type | Occurrences | Notes | ' + DEGREE_LONG.map((_, i) => ['1', 'b9', '9', '#9', '3', '11', '#11', '5', 'b13', '13', 'b7', '7'][i]).join(' | ') + ' |');
  L.push('| --- | --: | --: |' + DEGREE_LONG.map(() => ' --: |').join(''));
  for (const t of f.types) {
    const sh = shares(t.dist.all);
    const n = t.dist.all.reduce((a, b) => a + b, 0);
    L.push(`| ${t.label} | ${fr(t.occurrences)} | ${fr(n)} | ${sh.map((x) => pct(x)).join(' | ')} |`);
  }
  L.push('', '### Sur le temps seulement', '');
  L.push('| Type | Notes sur le temps | ' + ['1', 'b9', '9', '#9', '3', '11', '#11', '5', 'b13', '13', 'b7', '7'].join(' | ') + ' |');
  L.push('| --- | --: |' + DEGREE_LONG.map(() => ' --: |').join(''));
  for (const t of f.types) {
    const sh = shares(t.dist.beat);
    L.push(`| ${t.label} | ${fr(t.dist.beat.reduce((a, b) => a + b, 0))} | ${sh.map((x) => pct(x)).join(' | ')} |`);
  }
  const dom = f.types.find((t) => t.quality === 'dom7');
  if (dom) {
    const r = read(dom.dist.all, 'dom7');
    const b = read(dom.dist.beat, 'dom7');
    L.push('', '## La phrase', '');
    L.push(`Sur un accord de dominante, les solistes jouent ${DEGREE_LONG[2]!} ${onceEvery(r.shares[2]!)} (${pct(r.shares[2]!)}), ${DEGREE_LONG[4]!} ${onceEvery(r.shares[4]!)} (${pct(r.shares[4]!)}) ; la fondamentale : ${pct(r.shares[0]!)} des notes, ${pct(b.shares[0]!)} sur le temps. Note la plus jouée : ${DEGREE_LONG[r.top]!} ; la moins jouée parmi les notes attendues : ${r.avoided === null ? '—' : DEGREE_LONG[r.avoided]!}.`, '');
  }
  L.push('## Standards les plus joués', '');
  for (const t of [...f.tunes].sort((a, b) => b.solos.length - a.solos.length).slice(0, 15)) L.push(`- ${t.title} (${t.composer || 'compositeur inconnu'}, ${t.key}) : ${t.solos.length} solo${t.solos.length > 1 ? 's' : ''}`);
  L.push('');
  return L.join('\n');
}
