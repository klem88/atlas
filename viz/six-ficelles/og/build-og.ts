/**
 * Image d'aperçu des liens (1200×630) pour « Six ficelles au piano » : le titre, la grille, une portée.
 *
 *   npm run og -- six-ficelles
 */
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, drawGrandStaff, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { GRILLE } from '../domain/partition';

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
  ctx.fillText('EXERCICE AU PIANO · HARMONIE', pad, 110);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 84px ${OG_FONTS.display}`;
  ctx.fillText('Six ficelles au piano', pad, 205, OG_WIDTH - pad * 2);

  const grille = GRILLE[0].bars.map((b) => b.replace(' · ', ' ')).join('  ·  ');
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `500 27px ${OG_FONTS.ui}`;
  ctx.fillText(grille, pad, 275, OG_WIDTH - pad * 2);

  // La ligne cachée des mesures 4 à 7 (si♭, la, la♭, sol) : quatre rondes qui descendent.
  // Hauteurs en demi-interlignes au-dessus de la ligne du bas (mi4) : si = 4, la = 3, sol = 2.
  const staff = { x: pad, y: 335, width: OG_WIDTH - pad * 2, gap: 13 };
  const notes = [
    { x: 0.14, step: 4, flat: true },
    { x: 0.38, step: 3, flat: false },
    { x: 0.62, step: 3, flat: true },
    { x: 0.86, step: 2, flat: false },
  ];
  drawGrandStaff(ctx, t, staff, notes);
  // Bémols tracés à la main : la police des images n'a pas le glyphe « ♭ ».
  ctx.strokeStyle = t.accent!;
  ctx.lineWidth = 2;
  for (const n of notes.filter((m) => m.flat)) {
    const x = staff.x + n.x * staff.width - 26;
    const y = staff.y + 4 * staff.gap - (n.step * staff.gap) / 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 24);
    ctx.lineTo(x, y + 7);
    ctx.bezierCurveTo(x + 14, y - 1, x + 11, y - 10, x, y - 3);
    ctx.stroke();
  }

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 25px ${OG_FONTS.ui}`;
  ctx.fillText('Quatre étapes, des accords plaqués à la mélodie, avec l’écoute.', pad, OG_HEIGHT - 50, OG_WIDTH - pad * 2);

  console.log(`écrit ${await writeOgImage('six-ficelles', canvas)}`);
}
