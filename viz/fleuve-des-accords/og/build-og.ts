/**
 * Image d'aperçu des liens (1200×630) : le jazz des standards et la pop côte à côte, après un V.
 *
 *   npm run og -- fleuve-des-accords
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { wrapText } from '@shell/share';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, REPO_ROOT, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import type { TransitionsFile } from '../data/contract';
import { buildFlow, compareSentence } from '../domain/flow';
import { drawRiverCanvas } from '../ui/river';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const file = JSON.parse(await readFile(join(REPO_ROOT, 'public', 'data', 'fleuve-des-accords', 'transitions.json'), 'utf8')) as TransitionsFile;
  const irb = file.styles.find((s) => s.key === 'irb')!;
  const pop = file.styles.find((s) => s.key === 'pop')!;
  const V = 7 * 6;
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  const colors = { page: t.page!, ink: t.ink!, ink2: t['ink-2']!, ink3: t['ink-3']!, ribbon: t['seq-3']!, ribbonDim: t['seq-1']!, accent: t.accent!, node: t['seq-6']! };
  const pad = 64;
  ctx.fillStyle = colors.page;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
  ctx.fillStyle = colors.ink3;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('MUSIQUE · HARMONIE · DONNÉES', pad, 66);
  ctx.fillStyle = colors.ink;
  ctx.font = `300 50px ${OG_FONTS.display}`;
  ctx.fillText('Le fleuve des enchaînements', pad, 124);
  ctx.fillStyle = colors.ink2;
  ctx.font = `300 26px ${OG_FONTS.display}`;
  let y = 166;
  for (const line of wrapText(ctx, compareSentence(pop, irb, V), OG_WIDTH - pad * 2).slice(0, 2)) {
    ctx.fillText(line, pad, y);
    y += 34;
  }
  const w = (OG_WIDTH - pad * 2 - 40) / 2;
  [
    [pop, pad],
    [irb, pad + w + 40],
  ].forEach(([s, x]) => {
    const agg = s as typeof pop;
    ctx.fillStyle = colors.ink2;
    ctx.font = `400 22px ${OG_FONTS.ui}`;
    ctx.fillText(agg.label.charAt(0).toUpperCase() + agg.label.slice(1), x as number, 250);
    drawRiverCanvas(ctx, buildFlow(agg), { x: x as number, y: 266, w, h: 330 }, V, colors, OG_FONTS.ui, 18);
  });
  console.log(`écrit ${await writeOgImage('fleuve-des-accords', canvas)}`);
}
