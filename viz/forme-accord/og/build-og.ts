/**
 * Image d'aperçu des liens (1200×630) pour « La forme d’un accord ».
 *
 *   npm run og -- forme-accord
 *
 * Le visuel est la courbe de l'accord majeur pur (4:5:6), projetée en 2D (do sur la largeur, mi sur la hauteur,
 * sol en profondeur avec une légère perspective), tracée par le domaine.
 */
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { curvePoints } from '../domain/curve';

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
  ctx.fillText('MUSIQUE · GÉOMÉTRIE', pad, 96);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 72px ${OG_FONTS.display}`;
  ctx.fillText('La forme', pad, 190);
  ctx.fillText('d’un accord', pad, 268);

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 26px ${OG_FONTS.ui}`;
  ctx.fillText('do – mi – sol pur : 4 : 5 : 6', pad, 340);
  ctx.fillText('un nœud qui se referme.', pad, 378);
  ctx.fillText('Sur un piano, il tourne sans fin.', pad, 416);

  // La courbe, en légère perspective isométrique
  const cx = 860;
  const cy = OG_HEIGHT / 2;
  const r = 200;
  const pts = curvePoints([4, 5, 6], 0, 1, 1600);
  const project = (x: number, y: number, z: number): [number, number] => {
    // rotation douce autour de l'axe vertical puis de l'axe horizontal
    const a = 0.55;
    const b = 0.35;
    const x1 = x * Math.cos(a) + z * Math.sin(a);
    const z1 = -x * Math.sin(a) + z * Math.cos(a);
    const y1 = y * Math.cos(b) - z1 * Math.sin(b);
    return [cx + x1 * r, cy - y1 * r];
  };
  const ramp = ['seq-3', 'seq-4', 'seq-5', 'seq-6'].map((k) => t[k]!);
  const n = pts.length / 3;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 1; i < n; i++) {
    const [x0, y0] = project(pts[(i - 1) * 3]!, pts[(i - 1) * 3 + 1]!, pts[(i - 1) * 3 + 2]!);
    const [x1, y1] = project(pts[i * 3]!, pts[i * 3 + 1]!, pts[i * 3 + 2]!);
    ctx.strokeStyle = ramp[Math.min(ramp.length - 1, Math.floor((i / n) * ramp.length))]!;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  const [hx, hy] = project(pts[(n - 1) * 3]!, pts[(n - 1) * 3 + 1]!, pts[(n - 1) * 3 + 2]!);
  ctx.fillStyle = t.accent!;
  ctx.beginPath();
  ctx.arc(hx, hy, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = t.accent!;
  ctx.fillRect(pad, OG_HEIGHT - 56, 48, 4);

  console.log(`écrit ${await writeOgImage('forme-accord', canvas)}`);
}
