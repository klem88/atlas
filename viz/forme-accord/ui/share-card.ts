/**
 * Image de partage 1080×1350 : les notes, les rapports entiers, la vue actuelle de la courbe.
 */
import { noteName } from '@shell/music/pitch';
import { canvasToBlob, wrapText } from '@shell/share';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
export const SHARE_PHRASE = 'Un accord majeur pur est un nœud. Sur un piano, il tourne sans fin.';

export interface ShareCardData {
  notes: readonly number[];
  tuning: 'pur' | 'egal';
  ints: readonly number[];
  sceneCanvas: HTMLCanvasElement;
  siteUrl: string;
}

export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const fontDisplay = v('--font-display');
  const fontUi = v('--font-ui');
  await Promise.all([
    document.fonts.load(`300 120px ${fontDisplay}`),
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

  ctx.fillStyle = v('--page');
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = v('--ink-3');
  ctx.font = `600 26px ${fontUi}`;
  ctx.fillText('LA FORME D’UN ACCORD', pad, 110);

  ctx.fillStyle = v('--ink');
  ctx.font = `300 120px ${fontDisplay}`;
  ctx.fillText(data.ints.join(' : '), pad, 240);

  ctx.fillStyle = v('--ink-2');
  ctx.font = `300 44px ${fontDisplay}`;
  ctx.fillText(`${data.notes.map(noteName).join(' · ')}, ${data.tuning === 'pur' ? 'accord pur' : 'sur un piano'}`, pad, 310, measure);

  // La scène, recadrée au carré au centre, sur fond de surface
  const size = measure;
  const y0 = 370;
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
  for (const line of wrapText(ctx, SHARE_PHRASE, measure)) {
    ctx.fillText(line, pad, y);
    y += 50;
  }
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 26px ${fontUi}`;
  ctx.fillText(data.siteUrl, pad, CARD_HEIGHT - 50);

  return canvasToBlob(canvas);
}
