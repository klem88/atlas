/**
 * Image d'aperçu des liens (1200×630) pour « Ta progression a déjà été jouée 40 000 fois ».
 *
 *   npm run og -- progression-jouee
 *
 * Le visuel : les quatre accords en jetons, le vrai chiffre de I–V–vi–IV et sa frise des décennies, lus dans les données.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseProgression } from '@shell/music/degrees';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, REPO_ROOT, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import type { Meta, Shard } from '../data/contract';
import { fr, lookup, pct } from '../domain/lookup';
import { drawFriezeCanvas, friezeItems } from '../ui/frieze';
import { drawTokens, type CardColors } from '../ui/share-card';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const dataDir = join(REPO_ROOT, 'public', 'data', 'progression-jouee');
  const meta = JSON.parse(await readFile(join(dataDir, 'meta.json'), 'utf8')) as Meta;
  const shard = JSON.parse(await readFile(join(dataDir, 'p4.json'), 'utf8')) as Shard;
  const p = parseProgression('I,V,vi,IV')!;
  const l = lookup(p, shard, meta);
  if (!l.found) throw new Error('I–V–vi–IV absent des agrégats : pipeline à relancer ?');

  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  const pad = 64;
  const colors: CardColors = {
    page: t.page!,
    surface: t.surface!,
    ink: t.ink!,
    ink2: t['ink-2']!,
    ink3: t['ink-3']!,
    rule: t['rule-strong']!,
    bar: t['seq-4']!,
    peak: t.accent!,
    weak: t['seq-1']!,
    token: t['seq-5']!,
    tokenText: t.surface!,
  };

  ctx.fillStyle = colors.page;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  ctx.fillStyle = colors.ink3;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.textAlign = 'left';
  ctx.fillText('MUSIQUE · HARMONIE · DONNÉES', pad, 72);

  ctx.fillStyle = colors.ink;
  ctx.font = `300 54px ${OG_FONTS.display}`;
  ctx.fillText('Ta progression a déjà été jouée', pad, 136);
  ctx.fillText(`${fr(l.found.total)} fois`, pad, 200);

  drawTokens(ctx, p, pad, 236, colors, OG_FONTS.ui, 0.9);

  ctx.fillStyle = colors.ink2;
  ctx.font = `300 26px ${OG_FONTS.display}`;
  ctx.textAlign = 'left';
  ctx.fillText(`Les « quatre accords » sont dans ${pct(l.found.share)} des ${fr(meta.corpus.songs)} morceaux du corpus${l.found.firstYear ? `, dès ${l.found.firstYear}` : ''}.`, pad, 340);

  drawFriezeCanvas(ctx, friezeItems(l.found.byDecade, meta.corpus.byDecade), { x: pad, y: 370, w: OG_WIDTH - pad * 2, h: 220 }, colors, OG_FONTS.ui, 0.8);

  console.log(`écrit ${await writeOgImage('progression-jouee', canvas)}`);
}
