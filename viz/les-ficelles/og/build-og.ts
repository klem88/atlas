/**
 * Image d'aperçu des liens (1200×630) pour « Les ficelles » : la progression banale, puis ce qu'en font trois ficelles.
 *
 *   npm run og -- les-ficelles
 */
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { cliche } from '../domain/grille';
import { nomAccord } from '../domain/orthographe';
import { EXEMPLE, rejouer } from '../domain/pile';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d');
  const pad = 72;
  const avant = cliche(0).map(nomAccord).join(' – ');
  const apres = rejouer(cliche(0), EXEMPLE).grille.map(nomAccord).join(' – ');

  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('MUSIQUE · HARMONIE · APPRENDRE', pad, 120);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 84px ${OG_FONTS.display}`;
  ctx.fillText('Les ficelles', pad, 220, OG_WIDTH - pad * 2);

  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 34px ${OG_FONTS.ui}`;
  ctx.fillText(avant, pad, 330, OG_WIDTH - pad * 2);

  ctx.fillStyle = t.accent!;
  ctx.font = `500 34px ${OG_FONTS.ui}`;
  ctx.fillText('trois ficelles', pad + 36, 390);
  // Flèche tracée à la main : la police du site n'a pas le glyphe « ↓ ».
  ctx.strokeStyle = t.accent!;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pad + 10, 366);
  ctx.lineTo(pad + 10, 390);
  ctx.moveTo(pad + 1, 381);
  ctx.lineTo(pad + 10, 391);
  ctx.lineTo(pad + 19, 381);
  ctx.stroke();

  ctx.fillStyle = t.ink!;
  ctx.font = `400 40px ${OG_FONTS.ui}`;
  ctx.fillText(apres, pad, 460, OG_WIDTH - pad * 2);

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 26px ${OG_FONTS.ui}`;
  ctx.fillText('Six procédés de la chanson française, à voir sur la portée et à écouter.', pad, 540, OG_WIDTH - pad * 2);

  console.log(`écrit ${await writeOgImage('les-ficelles', canvas)}`);
}
