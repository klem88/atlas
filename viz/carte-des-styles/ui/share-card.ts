/** Image de partage 1080×1350 : la rose en grand, le titre, les signatures. */
import { canvasToBlob, wrapText } from '@shell/share';
import type { Signature } from '../data/contract';
import { liftWords, transitionLabel } from '../domain/compass';
import { drawRoseCanvas } from './rose';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export async function renderShareCard(o: { title: string; subtitle: string; axes: number[]; axisLabels: string[]; signatures: Signature[]; siteUrl: string }): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim();
  const display = v('--font-display') || 'serif';
  const ui = v('--font-ui') || 'sans-serif';
  const pad = 72;
  ctx.fillStyle = v('--page');
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = v('--ink-3');
  ctx.font = `600 22px ${ui}`;
  ctx.fillText('LA BOUSSOLE DES STYLES', pad, 100);
  ctx.fillStyle = v('--ink');
  ctx.font = `300 60px ${display}`;
  let y = 170;
  for (const line of wrapText(ctx, o.title, CARD_WIDTH - pad * 2).slice(0, 2)) {
    ctx.fillText(line, pad, y);
    y += 66;
  }
  ctx.fillStyle = v('--ink-2');
  ctx.font = `300 32px ${display}`;
  ctx.fillText(o.subtitle, pad, y);
  drawRoseCanvas(ctx, o.axes, CARD_WIDTH / 2, y + 330, 240, { ring: v('--rule'), spoke: v('--rule'), shape: v('--seq-4'), accent: v('--accent'), label: v('--ink-2') }, true, o.axisLabels, ui, 22);
  let yy = y + 660;
  ctx.font = `400 24px ${ui}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = v('--ink-3');
  ctx.fillText('Enchaînements signatures', pad, yy);
  yy += 40;
  for (const s of o.signatures.slice(0, 5)) {
    ctx.fillStyle = v('--ink');
    ctx.font = `600 26px ${ui}`;
    ctx.fillText(transitionLabel([s.from, s.to]), pad, yy);
    ctx.fillStyle = v('--ink-2');
    ctx.font = `400 24px ${ui}`;
    ctx.fillText(`${(100 * s.share).toFixed(1).replace('.', ',')} % des enchaînements, ${liftWords(s.lift)}`, pad + 180, yy);
    yy += 38;
  }
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 22px ${ui}`;
  ctx.fillText('Chordonomicon, iRb, McGill Billboard · rayons = rapport à la moyenne, de ¼ à 4', pad, 1256);
  ctx.fillText(o.siteUrl, pad, 1296);
  return canvasToBlob(canvas);
}
