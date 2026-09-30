/**
 * Image d'aperçu des liens (1200×630) pour « Pourquoi une tierce sonne douce ».
 *
 *   npm run og -- consonance
 *
 * Le visuel est le paysage de rugosité (do4, six harmoniques), le curseur sur la tierce pure.
 */
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { equalFrequency } from '@shell/music/pitch';
import { findValleys, roughnessCurve } from '../domain/roughness';
import { drawLandscape } from '../ui/share-card';

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
  ctx.fillText('MUSIQUE · PSYCHOACOUSTIQUE', pad, 84);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 60px ${OG_FONTS.display}`;
  ctx.fillText('Pourquoi une tierce sonne douce', pad, 156);

  const curve = roughnessCurve(equalFrequency(60), 6);
  const valleys = findValleys(curve);
  drawLandscape(
    ctx as unknown as CanvasRenderingContext2D,
    curve,
    valleys,
    386,
    { x: pad, y: 190, w: OG_WIDTH - pad * 2, h: 360 },
    { area: t['seq-1']!, line: t['seq-5']!, base: t['rule-strong']!, tick: t.rule!, ink2: t['ink-2']!, ink3: t['ink-3']!, accent: t.accent!, surface: t.surface! },
    OG_FONTS.ui,
  );

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 24px ${OG_FONTS.ui}`;
  ctx.textAlign = 'left';
  ctx.fillText('La rugosité de deux notes, de l’unisson à l’octave. Les vallées sont les intervalles doux.', pad, 590);

  console.log(`écrit ${await writeOgImage('consonance', canvas)}`);
}
