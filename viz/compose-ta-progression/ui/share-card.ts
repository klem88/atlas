/** Image de partage 1080×1350 : la progression en jetons, le compte, l'éventail du dernier pas. */
import { degreeLabel } from '@shell/music/degrees';
import { canvasToBlob, wrapText } from '@shell/share';
import { chordName, pct, progressionNames, type Fan } from '../domain/next';
import type { VizState } from '../state';
import { drawFanCanvas, layoutFan } from './fan';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export async function renderShareCard(o: { state: VizState; fan: Fan; count: number | null; corpus: number; siteUrl: string }): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim();
  const display = v('--font-display') || 'serif';
  const ui = v('--font-ui') || 'sans-serif';
  const pad = 72;
  const { progression, tonic } = o.state;
  ctx.fillStyle = v('--page');
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = v('--ink-3');
  ctx.font = `600 22px ${ui}`;
  ctx.fillText('MA PROGRESSION', pad, 100);
  // Jetons
  let x = pad;
  const y = 140;
  ctx.textBaseline = 'middle';
  for (const d of progression) {
    const name = chordName(d, tonic);
    ctx.font = `700 34px ${ui}`;
    const w = Math.max(96, ctx.measureText(name).width + 40);
    ctx.fillStyle = v('--seq-5');
    ctx.beginPath();
    ctx.roundRect(x, y, w, 84, 12);
    ctx.fill();
    ctx.fillStyle = v('--surface');
    ctx.textAlign = 'center';
    ctx.fillText(name, x + w / 2, y + 32);
    ctx.font = `400 20px ${ui}`;
    ctx.fillText(degreeLabel(d), x + w / 2, y + 62);
    x += w + 14;
    if (x > CARD_WIDTH - pad - 120) break;
  }
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = v('--ink');
  ctx.font = `300 120px ${display}`;
  ctx.fillText(o.count === null || progression.length < 2 ? '—' : o.count > 0 ? o.count.toLocaleString('fr-FR') : '< 20', pad - 4, 370);
  ctx.fillStyle = v('--ink-2');
  ctx.font = `300 38px ${display}`;
  const sub = progression.length < 2 ? 'Choisis au moins deux accords.' : o.count ? `chansons contiennent ${progressionNames(progression, tonic)}, soit ${pct(o.count / o.corpus)} des ${o.corpus.toLocaleString('fr-FR')} tablatures.` : `chansons contiennent ${progressionNames(progression, tonic)} : une rareté.`;
  let yy = 430;
  for (const line of wrapText(ctx, sub, CARD_WIDTH - pad * 2).slice(0, 3)) {
    ctx.fillText(line, pad, yy);
    yy += 48;
  }
  // L'éventail du dernier pas
  const layout = layoutFan(o.fan.candidates, { width: CARD_WIDTH - pad * 2, nameOf: (c) => chordName(c.degree, tonic), subOf: (c) => pct(c.p), other: o.fan.other });
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 24px ${ui}`;
  ctx.fillText(progression.length ? 'Et après ? Ce que les chansons font ensuite' : 'Par où commencer', pad, yy + 20);
  drawFanCanvas(ctx, layout, progression.length ? chordName(progression[progression.length - 1]!, tonic) : 'départ', { ray: v('--rule'), disc: [v('--seq-5'), v('--seq-4'), v('--seq-3'), v('--seq-2')], discText: v('--surface'), other: v('--surface-sunk'), pivot: v('--seq-6'), pivotText: v('--ink'), ink3: v('--ink-3') }, ui, { x: pad, y: yy + 40 });
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 22px ${ui}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Chordonomicon (679 602 tablatures) · probabilités conditionnées à toute la suite', pad, 1256);
  ctx.fillText(o.siteUrl, pad, 1296);
  return canvasToBlob(canvas);
}
