/**
 * Image d'aperçu des liens (1200×630) pour « Pourquoi ton piano est (légèrement) faux ».
 *
 *   npm run og -- piano-temperament
 *
 * Le visuel est la vague des battements de la quinte do4–sol4 tempérée, calculée par le domaine.
 */
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { beatEnvelope, beatWindow, pairBeats } from '../domain/beats';

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
  ctx.fillText('MUSIQUE · PHYSIQUE', pad, 96);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 66px ${OG_FONTS.display}`;
  ctx.fillText('Pourquoi ton piano', pad, 180);
  ctx.fillText('est (légèrement) faux', pad, 254);

  // La vague : quinte do4–sol4 tempérée, 3ᵉ harmonique du do contre 2ᵉ du sol.
  const pair = pairBeats(60, 67, 'egal');
  const windowS = beatWindow(pair.beatHz);
  const x0 = pad;
  const x1 = OG_WIDTH - pad;
  const w = x1 - x0;
  const mid = 430;
  const amp = 92;

  ctx.fillStyle = t['seq-1']!;
  ctx.beginPath();
  const perCol = Math.ceil(((pair.lowHz * windowS) / w) * 5);
  const maxes: number[] = [];
  const mins: number[] = [];
  for (let x = 0; x < w; x++) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let s = 0; s < perCol; s++) {
      const tau = ((x + s / perCol) / w) * windowS;
      const v = Math.sin(2 * Math.PI * pair.lowHz * tau) + Math.sin(2 * Math.PI * pair.highHz * tau);
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    maxes.push(hi);
    mins.push(lo);
  }
  ctx.moveTo(x0, mid - (amp / 2) * maxes[0]!);
  for (let x = 1; x < w; x++) ctx.lineTo(x0 + x, mid - (amp / 2) * maxes[x]!);
  for (let x = w - 1; x >= 0; x--) ctx.lineTo(x0 + x, mid - (amp / 2) * mins[x]!);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = t.ink!;
  ctx.lineWidth = 2;
  for (const sign of [1, -1]) {
    ctx.beginPath();
    for (let x = 0; x <= w; x++) {
      const e = beatEnvelope(pair.beatHz, (x / w) * windowS);
      const y = mid - sign * (amp / 2) * e;
      if (x === 0) ctx.moveTo(x0 + x, y);
      else ctx.lineTo(x0 + x, y);
    }
    ctx.stroke();
  }

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 26px ${OG_FONTS.ui}`;
  ctx.fillText(`do – sol, une quinte : ${pair.beatHz.toFixed(2).replace('.', ',')} battement par seconde`, pad, 560);

  ctx.fillStyle = t.accent!;
  ctx.fillRect(pad, OG_HEIGHT - 56, 48, 4);

  console.log(`écrit ${await writeOgImage('piano-temperament', canvas)}`);
}
