/**
 * Image d'aperçu des liens (1200×630) pour « Ce qu’une seule note contient ».
 *
 *   npm run og -- une-seule-note
 *
 * Le visuel : le clavier de do2 avec les seize harmoniques posées dessus, les rangs 4, 5, 6 allumés.
 */
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { harmonicSeries } from '../domain/partials';
import { drawKeyboardStrip } from '../ui/share-card';

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
  ctx.fillText('MUSIQUE · ACOUSTIQUE', pad, 84);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 60px ${OG_FONTS.display}`;
  ctx.fillText('Ce qu’une seule note contient', pad, 156);

  drawKeyboardStrip(
    ctx as unknown as CanvasRenderingContext2D,
    36,
    harmonicSeries(36),
    new Set([4, 5, 6]),
    { x: pad, y: 190, w: OG_WIDTH - pad * 2, h: 360 },
    { white: t.surface!, black: t.ink!, border: t['rule-strong']!, token: t['seq-5']!, tokenText: t.surface!, offKey: t.accent!, ink3: t['ink-3']! },
    OG_FONTS.ui,
  );

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 24px ${OG_FONTS.ui}`;
  ctx.textAlign = 'left';
  ctx.fillText('Les harmoniques d’un do, posées sur le clavier. En orange : celles qui tombent entre les touches.', pad, 590);

  console.log(`écrit ${await writeOgImage('une-seule-note', canvas)}`);
}
