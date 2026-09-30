/**
 * Image de partage 1080×1350 : le compteur, l'hélice (vue WebGL du moment), la phrase.
 */
import { canvasToBlob, wrapText } from '@shell/share';
import { counter, pitchAt } from '../domain/shepard';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

const fr = (n: number) => n.toLocaleString('fr-FR');

/** « J'ai monté 48 demi-tons. Je suis toujours au même endroit. » */
export function sharePhrase(travelled: number): string {
  const c = counter(travelled);
  const n = Math.abs(c.semitones);
  return `J’ai ${c.semitones >= 0 ? 'monté' : 'descendu'} ${fr(n)} demi-ton${n > 1 ? 's' : ''}. Je suis toujours au même endroit.`;
}

export interface ShareCardData {
  travelled: number;
  sceneCanvas: HTMLCanvasElement;
  siteUrl: string;
}

export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const fontDisplay = v('--font-display');
  const fontUi = v('--font-ui');
  await Promise.all([
    document.fonts.load(`300 150px ${fontDisplay}`),
    document.fonts.load(`300 44px ${fontDisplay}`),
    document.fonts.load(`600 26px ${fontUi}`),
    document.fonts.load(`400 30px ${fontUi}`),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const pad = 72;
  const measure = CARD_WIDTH - pad * 2;
  const c = counter(data.travelled);
  const at = pitchAt(data.travelled);

  ctx.fillStyle = v('--page');
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = v('--ink-3');
  ctx.font = `600 26px ${fontUi}`;
  ctx.fillText('LA GAMME QUI MONTE SANS FIN', pad, 110);

  ctx.fillStyle = v('--ink');
  ctx.font = `300 150px ${fontDisplay}`;
  ctx.fillText(`${fr(Math.abs(c.semitones))}`, pad, 270);
  ctx.fillStyle = v('--ink-2');
  ctx.font = `300 44px ${fontDisplay}`;
  ctx.fillText(`demi-tons ${c.semitones >= 0 ? 'montés' : 'descendus'} à l’oreille. En vrai : toujours sur ${at.name}.`, pad, 340, measure);

  const size = measure;
  const y0 = 400;
  ctx.fillStyle = v('--surface');
  ctx.fillRect(pad, y0, size, size);
  const src = data.sceneCanvas;
  const s = Math.min(src.width, src.height);
  ctx.drawImage(src, (src.width - s) / 2, (src.height - s) / 2, s, s, pad, y0, size, size);
  ctx.strokeStyle = v('--rule');
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, y0, size, size);

  ctx.fillStyle = v('--ink');
  ctx.font = `300 40px ${fontDisplay}`;
  let y = y0 + size + 70;
  for (const line of wrapText(ctx, sharePhrase(data.travelled), measure)) {
    ctx.fillText(line, pad, y);
    y += 50;
  }
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 26px ${fontUi}`;
  ctx.fillText(data.siteUrl, pad, CARD_HEIGHT - 50);

  return canvasToBlob(canvas);
}
