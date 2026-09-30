/**
 * Image d'aperçu des liens (1200×630) : le tore dessiné en projection, avec le chemin de « Giant Steps ».
 *
 *   npm run og -- voyage-sur-le-tore
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, REPO_ROOT, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import type { SongsFile } from '../data/contract';
import { buildJourney, journeyPath } from '../domain/journey';
import { MAJOR_RADIUS, MINOR_RADIUS, pathBetween, torusCoords, torusPoint } from '../domain/tonnetz';

/** Projection : le tore vu d'en haut, un peu de biais, en orthographique ; le troisième nombre dit si le point est devant (> 0). */
let spin = 0; // rotation du tore autour de son axe, choisie pour mettre le chemin devant
function project(p: { x: number; y: number; z: number }, cx: number, cy: number, scale: number): [number, number, number] {
  const tilt = 0.9; // inclinaison de la caméra au-dessus du plan du tore
  const x = p.x * Math.cos(spin) - p.z * Math.sin(spin);
  const z = p.x * Math.sin(spin) + p.z * Math.cos(spin);
  const yy = p.y * Math.sin(tilt) + z * Math.cos(tilt);
  const depth = p.y * Math.cos(tilt) - z * Math.sin(tilt);
  return [cx + x * scale, cy + yy * scale, depth];
}

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const file = JSON.parse(await readFile(join(REPO_ROOT, 'public', 'data', 'voyage-sur-le-tore', 'songs.json'), 'utf8')) as SongsFile;
  const giant = file.songs.find((s) => s.id === 'irb:362')!;
  const autumn = file.songs.find((s) => s.id === 'irb:63')!;
  const jg = buildJourney(giant);
  const ja = buildJourney(autumn);

  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  const pad = 64;
  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('MUSIQUE · GÉOMÉTRIE', pad, 84);
  ctx.fillStyle = t.ink!;
  ctx.font = `300 60px ${OG_FONTS.display}`;
  ctx.fillText('Le voyage', pad, 170);
  ctx.fillText('sur le tore', pad, 236);
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `300 26px ${OG_FONTS.display}`;
  const fr1 = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  ctx.fillText(`« Autumn Leaves » : ${ja.stats.steps.length} pas, ${fr1(ja.stats.mean)} de long.`, pad, 310);
  ctx.fillText(`« Giant Steps » : ${jg.stats.steps.length} pas, ${fr1(jg.stats.mean)} de long.`, pad, 350);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 22px ${OG_FONTS.ui}`;
  ctx.fillText('Les bonds qu’on entend ne sont pas ceux qu’on mesure.', pad, 400);

  // Le tore, tourné pour que le début du chemin soit face à nous
  const head = journeyPath(jg).slice(0, 10);
  let best = -Infinity;
  for (let k = 0; k < 120; k++) {
    spin = (k / 120) * 2 * Math.PI;
    const depth = head.reduce((a, p) => a + project(torusPoint(p.s, p.t, 0.08), 0, 0, 1)[2], 0);
    if (depth > best) {
      best = depth;
      var bestSpin = spin;
    }
  }
  spin = bestSpin!;
  const cx = 880;
  const cy = 320;
  const scale = 84;
  // Surface : la silhouette du tore (deux ellipses), puis les lignes du réseau
  const silhouette = (radius: number) => {
    ctx.beginPath();
    for (let i = 0; i <= 96; i++) {
      const θ = (i / 96) * 2 * Math.PI;
      const [x, y] = project({ x: radius * Math.cos(θ), y: 0, z: radius * Math.sin(θ) }, cx, cy, scale);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };
  ctx.fillStyle = t['surface-sunk']!;
  silhouette(MAJOR_RADIUS + MINOR_RADIUS);
  ctx.fill();
  ctx.fillStyle = t.page!;
  silhouette(MAJOR_RADIUS - MINOR_RADIUS);
  ctx.fill();
  ctx.strokeStyle = t['rule-strong']!;
  ctx.lineWidth = 1.2;
  const line = (a0: number, b0: number, da: number, db: number, period: number) => {
    ctx.beginPath();
    for (let i = 0; i <= period * 12; i++) {
      const { s, t: tt } = torusCoords(a0 + (da * i) / 12, b0 + (db * i) / 12);
      const [x, y] = project(torusPoint(s, tt, 0.01), cx, cy, scale);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  line(0, 0, 1, 0, 12);
  for (let a = 0; a < 4; a++) line(a, 0, 0, 1, 3);
  for (let k = 0; k < 3; k++) line(0, k, 1, -1, 4);
  // Le chemin de Giant Steps : ses dix premières positions, face avant seulement (le dos du tore brouillerait tout)
  const path = journeyPath(jg).slice(0, 10);
  ctx.strokeStyle = t.accent!;
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (let i = 1; i < path.length; i++) {
    const seg = pathBetween(path[i - 1]!, path[i]!, 12);
    ctx.beginPath();
    let pen = false;
    for (const q of seg) {
      const [x, y, z] = project(torusPoint(q.s, q.t, 0.08), cx, cy, scale);
      if (z < 0.05) {
        pen = false;
        continue;
      }
      if (!pen) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      pen = true;
    }
    ctx.stroke();
  }
  // Étiquettes : les accords du chemin, face avant
  const NAMES = ['do', 'réb', 'ré', 'mib', 'mi', 'fa', 'fa#', 'sol', 'lab', 'la', 'sib', 'si'];
  ctx.textAlign = 'center';
  const seen = new Set<string>();
  for (const p of path) {
    const tr = p.stop.triad!;
    const key = `${tr.root}${tr.mode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const [x, y, z] = project(torusPoint(p.s, p.t, 0.12), cx, cy, scale);
    if (z < 0.15) continue;
    const text = tr.mode === 'maj' ? NAMES[tr.root]!.toUpperCase() : NAMES[tr.root]!;
    ctx.font = `700 17px ${OG_FONTS.ui}`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = t.page!;
    ctx.strokeText(text, x, y - 10);
    ctx.fillStyle = t.ink!;
    ctx.fillText(text, x, y - 10);
    ctx.fillStyle = t.accent!;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 18px ${OG_FONTS.ui}`;
  ctx.textAlign = 'center';
  ctx.fillText('Le début de « Giant Steps » sur le tore des accords', cx, 600);
  console.log(`écrit ${await writeOgImage('voyage-sur-le-tore', canvas)}`);
}
