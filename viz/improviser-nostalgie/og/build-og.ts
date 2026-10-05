/**
 * Image d'aperçu des liens (1200×630) pour « Improviser sur trois grilles nostalgiques ».
 *
 *   npm run og -- improviser-nostalgie
 */
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, drawGrandStaff, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { grille } from '../domain/partition';

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
  ctx.fillText('EXERCICE AU PIANO · IMPROVISATION', pad, 110);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 76px ${OG_FONTS.display}`;
  ctx.fillText('Improviser sur trois grilles nostalgiques', pad, 200, OG_WIDTH - pad * 2);

  const accords = grille('feuilles').mesures.map((m) => m.map((a) => a.nom).join(' ')).join('  ·  ').replace('♭', 'b'); // pas de glyphe « ♭ » dans la police des images
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `500 27px ${OG_FONTS.ui}`;
  ctx.fillText(accords, pad, 270, OG_WIDTH - pad * 2);

  // La ligne guide du cycle des quintes : do, si, si, la, la, sol♯, la.
  // Hauteurs en demi-interlignes au-dessus de la ligne du bas (mi4) : do5 = 5, si = 4, la = 3, sol = 2.
  const staff = { x: pad, y: 335, width: OG_WIDTH - pad * 2, gap: 13 };
  const notes = [5, 4, 4, 3, 3, 2, 3].map((step, i) => ({ x: 0.08 + i * 0.14, step, sharp: i === 5 }));
  drawGrandStaff(ctx, t, staff, notes);
  // Dièse tracé à la main : la police des images n'a pas le glyphe « ♯ ».
  ctx.strokeStyle = t.accent!;
  ctx.lineWidth = 2;
  for (const n of notes.filter((m) => m.sharp)) {
    const x = staff.x + n.x * staff.width - 30;
    const y = staff.y + 4 * staff.gap - (n.step * staff.gap) / 2;
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 16);
    ctx.lineTo(x + 3, y + 16);
    ctx.moveTo(x + 11, y - 18);
    ctx.lineTo(x + 11, y + 14);
    ctx.moveTo(x - 2, y - 3);
    ctx.lineTo(x + 16, y - 8);
    ctx.moveTo(x - 2, y + 6);
    ctx.lineTo(x + 16, y + 1);
    ctx.stroke();
  }

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 25px ${OG_FONTS.ui}`;
  ctx.fillText('Six étapes : la main gauche, la ligne guide, la gamme, les cibles, le motif, la question-réponse.', pad, OG_HEIGHT - 50, OG_WIDTH - pad * 2);

  console.log(`écrit ${await writeOgImage('improviser-nostalgie', canvas)}`);
}
