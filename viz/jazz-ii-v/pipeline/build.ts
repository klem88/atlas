/**
 * Pipeline : iRb (1 185 standards de jazz) → combien de standards contiennent chacune des onze progressions.
 *
 *   npm run data -- jazz-ii-v                 # utilise le cache commun (tools/.cache/corpora)
 *   npm run data -- jazz-ii-v --clean-cache   # retélécharge les corpus
 *
 * Chaque grille est aplatie (sections dans l'ordre du morceau, accords répétés fusionnés, la fin rejoint le début),
 * puis on y cherche les motifs de chaque progression par intervalles et qualités (voir motifs.ts).
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseChord, type Chord, type Quality } from '@shell/music/chords';
import { CORPORA_CACHE, ensureCorpora, readIrb, type CorpusSong } from '@tools/lib/corpora';
import { log } from '@tools/lib/log';
import { PROGRESSIONS } from '../domain/progressions';
import { tonicName } from '../domain/spelling';
import { SCHEMA_VERSION, validerFrequences, validerStandards, type Frequences, type Standard, type Standards } from '../data/contract';
import { fusionnerRepetitions, occurrences } from './motifs';

const PIPELINE = import.meta.dirname;
const REPO = join(PIPELINE, '..', '..', '..');
const OUT = join(REPO, 'public', 'data', 'jazz-ii-v');

const SUFFIXES: Record<Quality, string> = { maj: '', maj7: ' 7M', min: ' m', min7: ' m7', dom7: ' 7', hdim: ' ø', dim: ' °', sus: ' sus', aug: ' +', other: '' };
const BEMOLS = ['Do', 'Ré♭', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Sol♭', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const DIESES = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
/** Toniques majeures écrites avec des dièses (sol, ré, la, mi, si) ; les mineures relatives de même. */
const TONS_DIESES = new Set([7, 2, 9, 4, 11]);

function nomAccord(c: Chord, song: CorpusSong): string {
  const relatif = song.key ? (song.key.mode === 'minor' ? (song.key.tonic + 3) % 12 : song.key.tonic) : 0;
  const noms = TONS_DIESES.has(relatif) ? DIESES : BEMOLS;
  return noms[c.root]! + SUFFIXES[c.quality];
}

export default async function buildData(args: string[] = []): Promise<void> {
  const t0 = Date.now();
  if (args.includes('--clean-cache')) await rm(CORPORA_CACHE, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  log.step('Corpus');
  await ensureCorpora();
  const irb = await readIrb();
  log.info(`iRb : ${irb.length} standards`);

  log.step('Recherche des progressions');
  const suites = irb.map((song) => fusionnerRepetitions(song.sections.flatMap((s) => s.chords.map((c) => parseChord(c.symbol)))));
  const nonLus = irb.reduce((n, song) => n + song.sections.flatMap((s) => s.chords).filter((c) => c.symbol !== 'N' && !parseChord(c.symbol)).length, 0);

  const retenus = new Map<number, number>(); // indice iRb → indice dans standards.json
  const progressions = PROGRESSIONS.map((p) => {
    const morceaux: { s: number; m: [number, number][] }[] = [];
    suites.forEach((suite, i) => {
      const m = occurrences(suite, p.motifs);
      if (m.length) morceaux.push({ s: i, m });
    });
    log.info(`${p.titre} : ${morceaux.length} standards`);
    return { id: p.id, n: morceaux.length, morceaux };
  });

  // Les morceaux trouvés au moins une fois, par ordre alphabétique.
  const indices = [...new Set(progressions.flatMap((p) => p.morceaux.map((m) => m.s)))].sort((a, b) =>
    (irb[a]!.title ?? '').localeCompare(irb[b]!.title ?? '', 'en'),
  );
  indices.forEach((i, k) => retenus.set(i, k));
  const standards: Standards = {
    version: SCHEMA_VERSION,
    morceaux: indices.map((i) => {
      const song = irb[i]!;
      const s: Standard = { t: song.title ?? '(sans titre)', accords: suites[i]!.map((c) => nomAccord(c, song)) };
      if (song.artist) s.c = song.artist;
      if (song.year) s.a = song.year;
      if (song.key) s.ton = `${tonicName(song.key.tonic, song.key.mode === 'minor' ? 'mineur' : 'majeur')} ${song.key.mode === 'minor' ? 'mineur' : 'majeur'}`;
      return s;
    }),
  };
  const frequences: Frequences = {
    version: SCHEMA_VERSION,
    total: irb.length,
    progressions: progressions.map((p) => ({ ...p, morceaux: p.morceaux.map((m) => ({ s: retenus.get(m.s)!, m: m.m })).sort((a, b) => a.s - b.s) })),
  };
  validerFrequences(frequences);
  validerStandards(standards, frequences);

  log.step('Écriture');
  const f = JSON.stringify(frequences);
  const s = JSON.stringify(standards);
  await writeFile(join(OUT, 'frequences.json'), f);
  await writeFile(join(OUT, 'standards.json'), s);
  log.info(`frequences.json : ${(f.length / 1024).toFixed(0)} Ko ; standards.json : ${(s.length / 1024).toFixed(0)} Ko (${standards.morceaux.length} morceaux)`);

  const pct = (n: number) => `${((100 * n) / irb.length).toFixed(1).replace('.', ',')} %`;
  const report = [
    '# Rapport qualité : Les ii–V du jazz',
    '',
    `Généré le ${new Date().toISOString().slice(0, 10)} par \`npm run data -- jazz-ii-v\`, en ${((Date.now() - t0) / 1000).toFixed(1)} s.`,
    '',
    '## Source',
    '',
    `- **iRb** (Broze et Shanahan, Ohio State University), paquet npm \`sharp11-irb\` : ${irb.length} grilles de standards de jazz, issues des grilles iRealPro.`,
    `- Symboles d’accords non lus : ${nonLus} (ignorés).`,
    '',
    '## Méthode',
    '',
    '- Grille aplatie dans l’ordre des sections, accords répétés fusionnés ; la fin rejoint le début.',
    '- Un motif est une suite d’intervalles entre fondamentales et de qualités admises (voir `domain/progressions.ts`) : la tonalité du morceau n’intervient pas, une progression dans une tonalité de passage compte aussi.',
    '- Les qualités sont réduites à dix classes (`src/shell/music/chords.ts`) : un « C6 » compte comme majeur, un « C-6 » comme mineur, un « G7♭9 » comme dominante.',
    '',
    '## Résultats',
    '',
    '| Progression | Standards | Part | Occurrences |',
    '|---|---:|---:|---:|',
    ...PROGRESSIONS.map((p, i) => {
      const x = progressions[i]!;
      return `| ${p.titre} | ${x.n} | ${pct(x.n)} | ${x.morceaux.reduce((n, m) => n + m.m.length, 0)} |`;
    }),
    '',
    '## Limites',
    '',
    '- L’iRb est un corpus de grilles « de fake book » : une seule version par morceau, celle de ses contributeurs.',
    '- Le motif ne regarde que les accords : un ii–V–I « caché » par une substitution ou une pédale n’est pas compté, et une suite d’accords qui ressemble au motif sans en avoir la fonction l’est.',
    '- Les variantes du backdoor comptent aussi un simple ♭VII7–I.',
    '',
  ].join('\n');
  await writeFile(join(PIPELINE, 'REPORT.md'), report);
  log.info(`Terminé en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
