/**
 * Image d'aperçu des liens (1200×630) : la courbe des accords distincts par morceau, tablatures 1950–2024.
 *
 *   npm run og -- cinquante-ans-de-refrains
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, REPO_ROOT, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import type { YearsFile } from '../data/contract';
import { drawRibbonsCanvas } from '../ui/ribbons';
import { drawLineCanvas } from '../ui/share-card';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const file = JSON.parse(await readFile(join(REPO_ROOT, 'public', 'data', 'cinquante-ans-de-refrains', 'years.json'), 'utf8')) as YearsFile;
  const s = file.series.find((x) => x.key === 'chordonomicon')!;
  const good = s.years.filter((p) => p.songs >= s.minSongs);
  const a = good[0]!;
  const b = good[good.length - 1]!;
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  const pad = 64;
  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('MUSIQUE · HARMONIE · HISTOIRE', pad, 72);
  ctx.fillStyle = t.ink!;
  ctx.font = `300 54px ${OG_FONTS.display}`;
  ctx.fillText('Cinquante ans de refrains', pad, 134);
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `300 28px ${OG_FONTS.display}`;
  const f1 = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  ctx.fillText(`En ${a.year}, une chanson tablée avait en moyenne ${f1(a.distincts)} accords distincts. En ${b.year}, ${f1(b.distincts)}. Et pourtant.`, pad, 182);
  drawLineCanvas(ctx, s.years, 'distincts', { x: pad, y: 210, w: 640, h: 380 }, { line: t['seq-5']!, grid: t.rule!, ink3: t['ink-3']!, hatch: t['hatch-ink']! }, OG_FONTS.ui, f1);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 18px ${OG_FONTS.ui}`;
  ctx.textAlign = 'left';
  ctx.fillText('La part de chaque degré', 760, 236);
  drawRibbonsCanvas(ctx, s.years, { x: 760, y: 250, w: 376, h: 320 }, { ramp: [t['seq-6']!, t['seq-5']!, t['seq-4']!, t['seq-3']!, t['seq-2']!, t['seq-1']!, t['seq-0']!], ink3: t['ink-3']!, hatch: t['hatch-ink']! }, OG_FONTS.ui, 16);
  console.log(`écrit ${await writeOgImage('cinquante-ans-de-refrains', canvas)}`);
}
