/**
 * Image d'aperçu des liens (1200×630) pour « Les ii–V du jazz » : la grille du ii–V–I en do, comme sur la page,
 * et le nombre de standards de l'iRb qui le contiennent (lu dans les données).
 *
 *   npm run og -- jazz-ii-v
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OG_FONTS, OG_WIDTH, REPO_ROOT, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import type { Frequences } from '../data/contract';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const f = JSON.parse(await readFile(join(REPO_ROOT, 'public', 'data', 'jazz-ii-v', 'frequences.json'), 'utf8')) as Frequences;
  const n = f.progressions.find((p) => p.id === 'ii-v-i')!.n;
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d');
  const pad = 72;

  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, 630);

  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('EXERCICE AU PIANO · JAZZ · RYTHME', pad, 110);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 84px ${OG_FONTS.display}`;
  ctx.fillText('Les ii–V du jazz', pad, 205);

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 28px ${OG_FONTS.ui}`;
  // Espace insécable des milliers, écrite à la main : la police de l'image n'a pas d'espace fine.
  const total = String(f.total).replace(/\B(?=(\d{3})+$)/g, ' ');
  ctx.fillText(`Le ii–V–I est dans ${n} standards sur ${total}. Quel mode jouer sur quel accord,`, pad, 268, OG_WIDTH - pad * 2);
  ctx.fillText('sur quel rythme, dans la tonalité de ton choix.', pad, 306, OG_WIDTH - pad * 2);

  // La grille : quatre mesures, la deuxième allumée comme pendant la lecture.
  const cases = [
    ['Ré m7', 'ii m7', 'ré dorien'],
    ['Sol 7', 'V7', 'sol mixolydien'],
    ['Do 7M', 'I 7M', 'do ionien'],
    ['%', '', ''],
  ];
  const gap = 18;
  const w = (OG_WIDTH - pad * 2 - gap * 3) / 4;
  const y = 372;
  const h = 170;
  cases.forEach(([nom, degre, mode], i) => {
    const x = pad + i * (w + gap);
    ctx.fillStyle = t.surface!;
    ctx.strokeStyle = i === 1 ? t.accent! : t.rule!;
    ctx.lineWidth = i === 1 ? 3 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = nom === '%' ? t['ink-3']! : t.ink!;
    ctx.font = `600 38px ${OG_FONTS.ui}`;
    ctx.fillText(nom!, x + 22, y + 56);
    ctx.fillStyle = t['ink-2']!;
    ctx.font = `400 24px ${OG_FONTS.ui}`;
    ctx.fillText(degre!, x + 22, y + 92);
    ctx.font = `italic 300 26px ${OG_FONTS.display}`;
    ctx.fillText(mode!, x + 22, y + 128, w - 30);
    // Quatre temps, 2 et 4 marqués (le charleston), le temps joué à l'accent.
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = i === 1 && k === 1 ? t.accent! : k % 2 ? t['ink-3']! : t['rule-strong']!;
      ctx.beginPath();
      ctx.arc(x + 28 + k * 22, y + h - 18, i === 1 && k === 1 ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  console.log(`écrit ${await writeOgImage('jazz-ii-v', canvas)}`);
}
