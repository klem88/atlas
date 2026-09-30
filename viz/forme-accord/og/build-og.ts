/**
 * Image d'aperçu des liens (1200×630) pour « La forme d’un accord ».
 *
 *   npm run og -- forme-accord
 *
 * Version de départ : titre et chapeau. À enrichir avec un vrai visuel issu des données
 * (voir viz/salaire-logement/og/build-og.ts pour un exemple avec une carte).
 */
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';

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
  ctx.fillText('Musique · Géométrie'.toUpperCase(), pad, 140);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 80px ${OG_FONTS.display}`;
  ctx.fillText('La forme d’un accord', pad, 250, OG_WIDTH - pad * 2);

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 28px ${OG_FONTS.ui}`;
  ctx.fillText('Chaque accord dessine une courbe dans l’espace : simple quand il est pur, qui tourne sans fin quand il vient d’un piano.', pad, 330, OG_WIDTH - pad * 2);

  ctx.fillStyle = t.accent!;
  ctx.fillRect(pad, OG_HEIGHT - 110, 48, 4);

  console.log(`écrit ${await writeOgImage('forme-accord', canvas)}`);
}
