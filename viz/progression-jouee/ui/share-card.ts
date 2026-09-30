/**
 * Image de partage 1080×1350 : la progression en jetons, le grand chiffre, la phrase, la frise des décennies.
 */
import { degreeLabel, type Degree } from '@shell/music/degrees';
import { canvasToBlob, wrapText } from '@shell/share';
import type { Lookup } from '../domain/lookup';
import { fr, pct } from '../domain/lookup';
import { drawFriezeCanvas, type FriezeColors, type FriezeItem } from './frieze';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export function sharePhrase(l: Lookup): string {
  const label = l.degrees.map(degreeLabel).join('–');
  if (!l.found) return `Ma progression (${label}) est dans moins de ${l.threshold} morceaux. Rare, donc.`;
  return `Ma progression (${label}) est dans ${fr(l.found.total)} morceaux.${l.found.firstYear ? ` La première fois, c’était en ${l.found.firstYear}.` : ''}`;
}

export interface CardColors extends FriezeColors {
  page: string;
  surface: string;
  ink2: string;
  token: string;
  tokenText: string;
  rule: string;
}

export function readCardColors(): CardColors {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return {
    page: v('--page'),
    surface: v('--surface'),
    ink: v('--ink'),
    ink2: v('--ink-2'),
    ink3: v('--ink-3'),
    rule: v('--rule-strong'),
    bar: v('--seq-4'),
    peak: v('--accent'),
    weak: v('--seq-1'),
    token: v('--seq-5'),
    tokenText: v('--surface'),
  };
}

export function drawTokens(ctx: CanvasRenderingContext2D, degrees: readonly Degree[], x: number, y: number, colors: CardColors, fontUi: string, size = 1): number {
  ctx.font = `600 ${34 * size}px ${fontUi}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let cx = x;
  const h = 64 * size;
  degrees.forEach((d, i) => {
    const label = degreeLabel(d);
    const w = Math.max(h, ctx.measureText(label).width + 36 * size);
    ctx.fillStyle = colors.token;
    roundRect(ctx, cx, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = colors.tokenText;
    ctx.fillText(label, cx + w / 2, y + h / 2 + 2 * size);
    cx += w;
    if (i < degrees.length - 1) {
      ctx.fillStyle = colors.ink3;
      ctx.fillText('–', cx + 14 * size, y + h / 2);
      cx += 28 * size;
    }
  });
  ctx.textBaseline = 'alphabetic';
  return cx - x;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderShareCard(o: { lookup: Lookup; items: FriezeItem[] | null; corpusSize: number; siteUrl: string }): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const c = readCardColors();
  const display = getComputedStyle(document.body).getPropertyValue('--font-display') || 'Spectral, serif';
  const ui = getComputedStyle(document.body).getPropertyValue('--font-ui') || 'sans-serif';
  const pad = 72;

  ctx.fillStyle = c.page;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = c.ink3;
  ctx.font = `600 22px ${ui}`;
  ctx.textAlign = 'left';
  ctx.fillText('MA PROGRESSION', pad, 110);

  drawTokens(ctx, o.lookup.degrees, pad, 150, c, ui, 1.25);

  const f = o.lookup.found;
  ctx.fillStyle = c.ink;
  ctx.font = `300 150px ${display}`;
  ctx.textAlign = 'left';
  ctx.fillText(f ? fr(f.total) : `< ${o.lookup.threshold}`, pad - 6, 420);
  ctx.fillStyle = c.ink2;
  ctx.font = `300 44px ${display}`;
  const sub = f ? `morceaux la contiennent, soit ${pct(f.share)} de ${fr(o.corpusSize)}${f.firstYear ? ` · la première fois en ${f.firstYear}` : ''}` : `morceaux sur ${fr(o.corpusSize)} : une suite rare`;
  let y = 490;
  for (const line of wrapText(ctx, sub, CARD_WIDTH - pad * 2)) {
    ctx.fillText(line, pad, y);
    y += 54;
  }

  if (o.items) {
    ctx.fillStyle = c.ink3;
    ctx.font = `400 24px ${ui}`;
    ctx.fillText('Part des morceaux de chaque décennie qui la contiennent', pad, 660);
    drawFriezeCanvas(ctx, o.items, { x: pad, y: 690, w: CARD_WIDTH - pad * 2, h: 440 }, c, ui, 1.1);
  }

  ctx.fillStyle = c.ink3;
  ctx.font = `400 24px ${ui}`;
  ctx.fillText('Chordonomicon (680 000 tablatures), degrés en classe de triade, tonalité estimée.', pad, 1230);
  ctx.fillText(o.siteUrl, pad, 1290);
  return canvasToBlob(canvas);
}
