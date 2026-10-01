/**
 * Image d'aperçu des liens (1200×630) : la carte en cercle, en do, avec le chemin de I–V–vi–IV tracé à l'accent.
 *
 *   npm run og -- suis-les-fleches
 */
import { Path2D } from '@napi-rs/canvas';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { chordName } from '../../compose-ta-progression/domain/next';
import { arrowPath, BACKGROUND_ARROWS, DIATONIC, FN_LABELS, layoutOf, type Fn } from '../domain/layout';
import { progressionById } from '../domain/library';

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
  ctx.fillText('MUSIQUE · HARMONIE · APPRENDRE', pad, 130);
  ctx.fillStyle = t.ink!;
  ctx.font = `300 72px ${OG_FONTS.display}`;
  ctx.fillText('Suis les flèches', pad, 215);
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `300 30px ${OG_FONTS.display}`;
  ['Sept accords, toujours à la même place.', 'Les progressions courantes s’y dessinent', 'pendant qu’elles sonnent.'].forEach((line, i) => ctx.fillText(line, pad, 285 + i * 42));
  ctx.fillStyle = t.accent!;
  ctx.font = `700 26px ${OG_FONTS.ui}`;
  ctx.fillText('I – V – vi – IV', pad, 470);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 22px ${OG_FONTS.ui}`;
  ctx.fillText('Do – Sol – La m – Fa : l’axe de la pop', pad, 505);

  // La carte, à droite.
  const l = layoutOf('cercle');
  const size = 560;
  const ox = OG_WIDTH - size - 40;
  const oy = (OG_HEIGHT - size) / 2;
  const P = (label: string) => ({ x: ox + l.positions[label]!.x * size, y: oy + l.positions[label]!.y * size });
  const radius = (label: string) => l.radius * size * (label === 'I' ? 1.25 : 1);
  const fill: Record<Fn, string> = { repos: t['seq-1']!, depart: t['seq-3']!, tension: t['seq-5']! };

  ctx.globalAlpha = 0.22;
  for (const s of l.sectors) {
    ctx.fillStyle = fill[s.fn];
    ctx.beginPath();
    ctx.arc(ox + size / 2, oy + size / 2, 0.445 * size, ((s.from + 1.5) * Math.PI) / 180, ((s.to - 1.5) * Math.PI) / 180);
    ctx.arc(ox + size / 2, oy + size / 2, 0.15 * size, ((s.to - 1.5) * Math.PI) / 180, ((s.from + 1.5) * Math.PI) / 180, true);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const drawArrow = (a: string, b: string, color: string, width: number) => {
    const path = arrowPath(P(a), P(b), Math.max(radius(a), radius(b)), l.bend);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke(new Path2D(path.d));
    ctx.save();
    ctx.translate(path.end.x, path.end.y);
    ctx.rotate((path.angle * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-width * 3.2, -width * 1.6);
    ctx.lineTo(-width * 3.2, width * 1.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  for (const [a, b] of BACKGROUND_ARROWS) drawArrow(a, b, t['rule-strong']!, 2);
  const pop = progressionById('pop')!.labels;
  pop.forEach((a, i) => drawArrow(a, pop[(i + 1) % pop.length]!, t.accent!, 4));

  ctx.textAlign = 'center';
  for (const c of DIATONIC) {
    const p = P(c.label);
    const r = radius(c.label);
    ctx.fillStyle = fill[c.fn];
    ctx.strokeStyle = pop.includes(c.label) ? t.accent! : t.surface!;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const onDark = c.fn === 'tension';
    ctx.fillStyle = onDark ? t.surface! : t.ink!;
    ctx.font = `700 ${Math.round(r * 0.56)}px ${OG_FONTS.ui}`;
    ctx.fillText(chordName(c.degree, 0).replace('♯', '#'), p.x, p.y + r * 0.1);
    ctx.font = `400 ${Math.round(r * 0.36)}px ${OG_FONTS.ui}`;
    ctx.fillText(c.label, p.x, p.y + r * 0.55);
  }
  ctx.font = `700 15px ${OG_FONTS.ui}`;
  ctx.fillStyle = t['ink-2']!;
  for (const [fn, deg] of [['tension', -90], ['repos', 64], ['depart', 116]] as const) {
    const a = (deg * Math.PI) / 180;
    ctx.fillText(FN_LABELS[fn].name.toUpperCase(), ox + size / 2 + 0.478 * size * Math.cos(a), oy + size / 2 + 0.478 * size * Math.sin(a) + 5);
  }

  console.log(`écrit ${await writeOgImage('suis-les-fleches', canvas)}`);
}
