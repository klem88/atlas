/**
 * Image d'aperçu des liens (1200×630) : la répartition des notes sur un accord de dominante, tout le corpus.
 *
 *   npm run og -- ou-le-solo-respire
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, REPO_ROOT, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import type { SolosFile } from '../data/contract';
import { DEGREE_LONG, onceEvery, read } from '../domain/solo';
import { drawDegreeBars } from '../ui/share-card';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const file = JSON.parse(await readFile(join(REPO_ROOT, 'public', 'data', 'ou-le-solo-respire', 'solos.json'), 'utf8')) as SolosFile;
  const dom = file.types.find((x) => x.quality === 'dom7')!;
  const r = read(dom.dist.all, 'dom7');
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  const pad = 64;
  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('MUSIQUE · JAZZ · IMPROVISATION', pad, 72);
  ctx.fillStyle = t.ink!;
  ctx.font = `300 54px ${OG_FONTS.display}`;
  ctx.fillText('Où le solo respire', pad, 134);
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `300 27px ${OG_FONTS.display}`;
  ctx.fillText(`Sur un accord de dominante, les solistes jouent ${DEGREE_LONG[r.top]!} ${onceEvery(r.shares[r.top]!)},`, pad, 186);
  ctx.fillText(`${DEGREE_LONG[r.top3[1]!]} ${onceEvery(r.shares[r.top3[1]!]!)}. La fondamentale : ${onceEvery(r.shares[0]!)}.`, pad, 222);
  drawDegreeBars(ctx, dom.dist.all, 'dom7', { x: pad, y: 250, w: OG_WIDTH - pad * 2, h: 330 }, { bar: t['seq-2']!, tone: t['seq-5']!, accent: t.accent!, ink: t.ink!, ink3: t['ink-3']!, rule: t['rule-strong']! }, OG_FONTS.ui, 20);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 18px ${OG_FONTS.ui}`;
  ctx.textAlign = 'left';
  ctx.fillText(`${dom.occurrences.toLocaleString('fr-FR')} accords de dominante dans 456 solos transcrits (Weimar Jazz Database)`, pad, 606);
  console.log(`écrit ${await writeOgImage('ou-le-solo-respire', canvas)}`);
}
