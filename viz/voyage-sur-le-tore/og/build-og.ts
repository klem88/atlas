/**
 * Image d'aperçu des liens (1200×630) : le Tonnetz à plat avec le début du chemin de « Giant Steps ».
 *
 *   npm run og -- voyage-sur-le-tore
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, REPO_ROOT, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import type { SongsFile } from '../data/contract';
import { buildJourney, journeyPath } from '../domain/journey';
import { unwrapPath } from '../domain/plane';
import { drawPlane, fitView } from '../scene/draw-plane';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const file = JSON.parse(await readFile(join(REPO_ROOT, 'public', 'data', 'voyage-sur-le-tore', 'songs.json'), 'utf8')) as SongsFile;
  const giant = buildJourney(file.songs.find((s) => s.id === 'irb:362')!);
  const autumn = buildJourney(file.songs.find((s) => s.id === 'irb:63')!);
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  const pad = 64;
  const fr1 = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

  // Le plan à droite, dans un cadre
  const box = { x: 560, y: 56, w: 576, h: 518 };
  const path = unwrapPath(journeyPath(giant).map((p) => p.stop.triad!));
  const view = { ...fitView(path, box.w, box.h), scale: 62 };
  const sub = createOgCanvas();
  sub.width = box.w;
  sub.height = box.h;
  const sctx = sub.getContext('2d') as unknown as CanvasRenderingContext2D;
  drawPlane(
    sctx,
    { ...view, width: box.w, height: box.h },
    { path, head: 9, rings: new Set(), fontUi: OG_FONTS.ui, ascii: true },
    { background: t.page!, major: t.surface!, minor: t['surface-sunk']!, visited: t['seq-1']!, current: t['accent-soft']!, edge: t['rule-strong']!, node: t['ink-3']!, label: t['ink-2']!, labelStrong: t.ink!, trail: t['seq-5']!, ahead: t['seq-2']!, accent: t.accent! },
  );
  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
  ctx.drawImage(sub as unknown as CanvasImageSource, box.x, box.y);
  ctx.strokeStyle = t.rule!;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);

  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('MUSIQUE · GÉOMÉTRIE', pad, 84);
  ctx.fillStyle = t.ink!;
  ctx.font = `300 60px ${OG_FONTS.display}`;
  ctx.fillText('Le voyage', pad, 170);
  ctx.fillText('sur le tore', pad, 236);
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `300 26px ${OG_FONTS.display}`;
  ctx.fillText(`« Autumn Leaves » : ${autumn.stats.steps.length} pas,`, pad, 310);
  ctx.fillText(`${fr1(autumn.stats.mean)} de long en moyenne.`, pad, 346);
  ctx.fillText(`« Giant Steps » : ${giant.stats.steps.length} pas, ${fr1(giant.stats.mean)}.`, pad, 396);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 21px ${OG_FONTS.ui}`;
  ctx.fillText('Les bonds qu’on entend ne sont pas', pad, 452);
  ctx.fillText('ceux qu’on mesure.', pad, 482);
  ctx.fillText('À droite : le début de « Giant Steps ».', pad, 540);
  console.log(`écrit ${await writeOgImage('voyage-sur-le-tore', canvas)}`);
}
