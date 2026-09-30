/** Image de partage 1080×1350 : le tore tel qu'affiché (capture du WebGL), le titre, les chiffres du voyage. */
import { canvasToBlob, wrapText } from '@shell/share';
import type { Journey } from '../domain/journey';
import { journeyWords } from '../domain/journey';
import { triadShort } from '../domain/tonnetz';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export function sharePhrase(j: Journey): string {
  const s = j.stats;
  return `« ${j.song.title} » fait ${s.steps.length} pas sur le tore des accords, ${s.mean.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} de long en moyenne : ${journeyWords(s)}.`;
}

export async function renderShareCard(o: { journey: Journey; scene: HTMLCanvasElement; siteUrl: string }): Promise<Blob> {
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
  ctx.fillText('LE VOYAGE SUR LE TORE', pad, 100);
  ctx.fillStyle = v('--ink');
  ctx.font = `300 60px ${display}`;
  let y = 170;
  for (const line of wrapText(ctx, `« ${o.journey.song.title} »`, CARD_WIDTH - pad * 2).slice(0, 2)) {
    ctx.fillText(line, pad, y);
    y += 66;
  }
  ctx.fillStyle = v('--ink-2');
  ctx.font = `300 34px ${display}`;
  const s = o.journey.stats;
  const sub = `${s.steps.length} pas, ${s.mean.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} de long en moyenne : ${journeyWords(s)}${s.longest ? ` ; le plus grand saut, de ${triadShort(s.longest.from)} à ${triadShort(s.longest.to)} (${s.longest.distance})` : ''}.`;
  for (const line of wrapText(ctx, sub, CARD_WIDTH - pad * 2).slice(0, 3)) {
    ctx.fillText(line, pad, y);
    y += 44;
  }
  // Le tore : la capture, recadrée au carré, posée au centre.
  const size = CARD_WIDTH - pad * 2;
  const src = o.scene;
  const side = Math.min(src.width, src.height);
  ctx.drawImage(src, (src.width - side) / 2, (src.height - side) / 2, side, side, pad, y + 10, size, size);
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 24px ${ui}`;
  ctx.fillText('Tonnetz replié en tore · distance P, L, R · iRb, McGill Billboard', pad, 1256);
  ctx.fillText(o.siteUrl, pad, 1296);
  return canvasToBlob(canvas);
}
