/**
 * Image d'aperçu des liens (1200×630) : les quatorze roses en petits multiples.
 *
 *   npm run og -- carte-des-styles
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, REPO_ROOT, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import type { StylesFile } from '../data/contract';
import { drawRoseCanvas } from '../ui/rose';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const file = JSON.parse(await readFile(join(REPO_ROOT, 'public', 'data', 'carte-des-styles', 'styles.json'), 'utf8')) as StylesFile;
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  const pad = 64;
  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('MUSIQUE · HARMONIE · DONNÉES', pad, 84);
  ctx.fillStyle = t.ink!;
  ctx.font = `300 60px ${OG_FONTS.display}`;
  ctx.fillText('La boussole', pad, 170);
  ctx.fillText('des styles', pad, 236);
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `300 26px ${OG_FONTS.display}`;
  ctx.fillText('Une rose par style, tracée sur', pad, 310);
  ctx.fillText('les mêmes douze enchaînements.', pad, 348);
  ctx.fillText('Le jazz est une île ; le reste,', pad, 400);
  ctx.fillText('un continent sans frontières.', pad, 438);

  const colors = { ring: t.rule!, spoke: t.rule!, shape: t['seq-4']!, accent: t.accent!, label: t['ink-2']! };
  const cols = 5;
  const cell = 150;
  const x0 = 470;
  const y0 = 70;
  file.styles.forEach((s, i) => {
    const cx = x0 + (i % cols) * cell + cell / 2;
    const cy = y0 + Math.floor(i / cols) * (cell + 22) + cell / 2;
    drawRoseCanvas(ctx, s.axes, cx, cy, 56, colors, s.key === 'irb');
    ctx.fillStyle = t['ink-2']!;
    ctx.font = `500 15px ${OG_FONTS.ui}`;
    ctx.textAlign = 'center';
    ctx.fillText(s.label.replace(' (tablatures)', ' (tabl.)').replace(' (standards)', ' (stand.)'), cx, cy + 74);
  });
  console.log(`écrit ${await writeOgImage('carte-des-styles', canvas)}`);
}
