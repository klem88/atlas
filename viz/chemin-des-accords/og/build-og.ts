/**
 * Image d'aperçu des liens (1200×630) : le cercle en Sol majeur, dans son anneau, après Do – La m – Ré – Sol – Si m.
 *
 *   npm run og -- chemin-des-accords
 */
import { Path2D } from '@napi-rs/canvas';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { diatonicChords, fifthsIndex, nameOf } from '../../suis-les-fleches/domain/harmony';
import { arrowPath, type Fn } from '../../suis-les-fleches/domain/layout';
import { CENTER, DISK, diatonicPoint, KEY_RING, TONIC_DISK } from '../domain/geometry';

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
  ctx.fillText('MUSIQUE · HARMONIE · APPRENDRE', pad, 140);
  ctx.fillStyle = t.ink!;
  ctx.font = `300 68px ${OG_FONTS.display}`;
  ctx.fillText('Le chemin', pad, 220);
  ctx.fillText('des accords', pad, 292);
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `300 30px ${OG_FONTS.display}`;
  ['Où tu es, où tu peux aller,', 'd’où tu viens.'].forEach((line, i) => ctx.fillText(line, pad, 360 + i * 42));
  ctx.fillStyle = t.accent!;
  ctx.font = `700 24px ${OG_FONTS.ui}`;
  ctx.fillText('Do – La m – Ré – Sol – Si m', pad, 480);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 22px ${OG_FONTS.ui}`;
  ctx.fillText('de Do majeur à Sol majeur', pad, 514);

  // La carte, à droite : cadre de 1000 unités ramené à 580 px.
  const k = 0.58;
  const ox = OG_WIDTH - 1000 * k - 30;
  const oy = (OG_HEIGHT - 1000 * k) / 2;
  const X = (p: { x: number; y: number }) => ({ x: ox + p.x * k, y: oy + p.y * k });
  const key = 7;
  const fill: Record<Fn, string> = { repos: t['seq-1']!, depart: t['seq-3']!, tension: t['seq-5']! };

  // L'anneau, tourné pour mettre Sol en haut.
  ctx.textAlign = 'center';
  ctx.font = `400 ${Math.round(26 * k)}px ${OG_FONTS.ui}`;
  for (let i = 0; i < 12; i++) {
    const tonic = (i * 7) % 12;
    const a = ((-90 + 30 * (fifthsIndex(tonic) - fifthsIndex(key))) * Math.PI) / 180;
    const p = X({ x: CENTER + KEY_RING * Math.cos(a), y: CENTER + KEY_RING * Math.sin(a) });
    if (tonic === key || tonic === 0) {
      ctx.strokeStyle = tonic === key ? t.accent! : t['ink-3']!;
      ctx.setLineDash(tonic === key ? [] : [4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 30 * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = tonic === key ? t.ink! : t['ink-3']!;
    ctx.fillText(nameOf({ root: tonic, cls: 'maj' }).replace('♯', '#').replace('♭', 'b'), p.x, p.y + 6);
  }

  // Le chemin Ré → Sol → Si m.
  const pos = (label: string) => X(diatonicPoint(label));
  const rad = (label: string) => (label === 'I' ? TONIC_DISK : DISK) * k;
  const trail = ['V', 'I', 'iii'];
  trail.slice(1).forEach((b, i) => {
    const a = trail[i]!;
    const path = arrowPath(pos(a), pos(b), rad(a), 0.18, 0, rad(b));
    ctx.strokeStyle = i === trail.length - 2 ? t.accent! : t['ink-3']!;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke(new Path2D(path.d));
  });

  for (const { chord, role } of diatonicChords(key)) {
    const p = pos(role.label);
    const r = rad(role.label);
    ctx.fillStyle = fill[role.fn];
    ctx.strokeStyle = role.label === 'iii' ? t.accent! : t.surface!;
    ctx.lineWidth = role.label === 'iii' ? 5 : 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = role.fn === 'tension' ? t.surface! : t.ink!;
    ctx.font = `700 ${Math.round(r * 0.48)}px ${OG_FONTS.ui}`;
    ctx.fillText(nameOf(chord).replace('♯', '#').replace('♭', 'b'), p.x, p.y + r * 0.08);
    ctx.font = `400 ${Math.round(r * 0.32)}px ${OG_FONTS.ui}`;
    ctx.fillText(role.label, p.x, p.y + r * 0.5);
  }

  console.log(`écrit ${await writeOgImage('chemin-des-accords', canvas)}`);
}
