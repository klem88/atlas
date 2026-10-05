/**
 * Image d'aperçu des liens (1200×630) pour « __TITLE__ ».
 *
 *   npm run og -- __SLUG__
 */
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, drawGrandStaff, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d');
  const pad = 72;

  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('EXERCICE AU PIANO · __TAGS__'.toUpperCase(), pad, 120);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 80px ${OG_FONTS.display}`;
  ctx.fillText('__TITLE__', pad, 220, OG_WIDTH - pad * 2);

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 28px ${OG_FONTS.ui}`;
  ctx.fillText('__SUMMARY__', pad, 290, OG_WIDTH - pad * 2);

  drawGrandStaff(ctx, t, { x: pad, y: 380, width: OG_WIDTH - pad * 2 }, [
    { x: 0.2, step: 2 },
    { x: 0.45, step: 3 },
    { x: 0.7, step: 4 },
  ]);

  console.log(`écrit ${await writeOgImage('__SLUG__', canvas)}`);
}
