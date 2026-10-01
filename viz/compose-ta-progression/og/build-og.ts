/**
 * Image d'aperçu des liens (1200×630) : après Do – Sol – La m, l'éventail des suites, depuis les vraies données.
 *
 *   npm run og -- compose-ta-progression
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseProgression } from '@shell/music/degrees';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, REPO_ROOT, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import type { Meta, Shard } from '../../progression-jouee/data/contract';
import { chordName, fanSentence, nextChords, pct } from '../domain/next';
import { drawFanCanvas, layoutFan } from '../ui/fan';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const dir = join(REPO_ROOT, 'public', 'data', 'progression-jouee');
  const meta = JSON.parse(await readFile(join(dir, 'meta.json'), 'utf8')) as Meta;
  const p3 = JSON.parse(await readFile(join(dir, 'p3.json'), 'utf8')) as Shard;
  const p4 = JSON.parse(await readFile(join(dir, 'p4.json'), 'utf8')) as Shard;
  const prefix = parseProgression('I,V,vi')!;
  const fan = nextChords(prefix, p4, p3, meta, null);
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  const pad = 64;
  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('MUSIQUE · HARMONIE · JEU', pad, 72);
  ctx.fillStyle = t.ink!;
  ctx.font = `300 56px ${OG_FONTS.display}`;
  ctx.fillText('Compose ta progression', pad, 134);
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `300 27px ${OG_FONTS.display}`;
  const sentence = fanSentence(prefix, fan, 0, null).replace(/♭/g, 'b').replace(/♯/g, '#');
  ctx.fillText(sentence, pad, 182);
  const names = (s: string) => s.replace(/♭/g, 'b').replace(/♯/g, '#');
  const layout = layoutFan(fan.candidates, { width: 760, maxDiscs: 8, nameOf: (c) => names(chordName(c.degree, 0)), subOf: (c) => pct(c.p), other: fan.other });
  drawFanCanvas(ctx, layout, 'La m', { ray: t.rule!, disc: [t['seq-5']!, t['seq-4']!, t['seq-3']!, t['seq-2']!], discText: t.surface!, other: t['surface-sunk']!, pivot: t['seq-6']!, pivotText: t.ink!, ink3: t['ink-3']! }, OG_FONTS.ui, { x: (OG_WIDTH - 760) / 2, y: 200 });
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 18px ${OG_FONTS.ui}`;
  ctx.textAlign = 'center';
  ctx.fillText(`Après Do – Sol – La m : ce que ${fan.base.toLocaleString('fr-FR')} chansons font ensuite (Chordonomicon)`, OG_WIDTH / 2, 606);
  console.log(`écrit ${await writeOgImage('compose-ta-progression', canvas)}`);
}
