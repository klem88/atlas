/**
 * Image d'aperçu des liens (1200×630) pour « La gamme qui monte sans fin ».
 *
 *   npm run og -- gamme-sans-fin
 *
 * Le visuel est l'hélice des hauteurs vue de côté, avec les composantes du son de Shepard.
 */
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { OCTAVES, helixPoint, shepardComponents } from '../domain/shepard';

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
  ctx.fillText('MUSIQUE · ILLUSION', pad, 96);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 66px ${OG_FONTS.display}`;
  ctx.fillText('La gamme', pad, 186);
  ctx.fillText('qui monte sans fin', pad, 260);

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 26px ${OG_FONTS.ui}`;
  ctx.fillText('Un son qui monte, monte, monte…', pad, 340);
  ctx.fillText('et ne va nulle part.', pad, 378);

  // L'hélice, projection oblique : x = x, y = −(hauteur) + z·pente
  const cx = 880;
  const bottom = 560;
  const radius = 150;
  const pitch = 48;
  const project = (octaves: number): [number, number] => {
    const p = helixPoint(octaves, 1, 1);
    return [cx + p.x * radius, bottom - octaves * pitch - p.z * radius * 0.28];
  };
  ctx.strokeStyle = t['rule-strong']!;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= OCTAVES * 96; i++) {
    const [x, y] = project(i / 96);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const comps = shepardComponents(500);
  const best = comps.reduce((m, c) => (c.amp > m.amp ? c : m));
  for (const c of comps) {
    const [x, y] = project(c.octaves);
    ctx.fillStyle = c === best ? t.accent! : t['seq-4']!;
    ctx.globalAlpha = 0.2 + 0.8 * c.amp;
    ctx.beginPath();
    ctx.arc(x, y, 6 + c.amp * 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = t.accent!;
  ctx.fillRect(pad, OG_HEIGHT - 56, 48, 4);

  console.log(`écrit ${await writeOgImage('gamme-sans-fin', canvas)}`);
}
