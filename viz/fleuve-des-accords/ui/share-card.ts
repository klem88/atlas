/** Image de partage 1080×1350 : la phrase, puis les deux fleuves l'un sous l'autre. */
import { canvasToBlob, wrapText } from '@shell/share';
import type { StyleAgg } from '../data/contract';
import { buildFlow, compareSentence, labelOf } from '../domain/flow';
import { drawRiverCanvas, type RiverColors } from './river';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export interface CardColors extends RiverColors {
  page: string;
  ink2: string;
  rule: string;
}

export function readCardColors(): CardColors {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return { page: v('--page'), ink: v('--ink'), ink2: v('--ink-2'), ink3: v('--ink-3'), rule: v('--rule-strong'), ribbon: v('--seq-3'), ribbonDim: v('--seq-1'), accent: v('--accent'), node: v('--seq-6') };
}

export async function renderShareCard(o: { a: StyleAgg; b: StyleAgg | null; from: number | null; siteUrl: string }): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const c = readCardColors();
  const display = getComputedStyle(document.body).getPropertyValue('--font-display') || 'serif';
  const ui = getComputedStyle(document.body).getPropertyValue('--font-ui') || 'sans-serif';
  const pad = 72;
  ctx.fillStyle = c.page;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = c.ink3;
  ctx.font = `600 22px ${ui}`;
  ctx.fillText(o.from === null ? 'D’UN ACCORD AU SUIVANT' : `APRÈS UN ${labelOf(o.from).toUpperCase()}`, pad, 100);
  ctx.fillStyle = c.ink;
  ctx.font = `300 44px ${display}`;
  const sentence = o.from === null ? `${cap(o.a.label)}${o.b ? ` et ${o.b.label}` : ''} : où va chaque accord.` : compareSentence(o.a, o.b, o.from);
  let y = 160;
  for (const line of wrapText(ctx, sentence, CARD_WIDTH - pad * 2)) {
    ctx.fillText(line, pad, y);
    y += 56;
  }
  const top = y + 20;
  const styles = o.b ? [o.a, o.b] : [o.a];
  const each = (1200 - top - 40) / styles.length;
  styles.forEach((s, i) => {
    const yy = top + i * each;
    ctx.fillStyle = c.ink2;
    ctx.font = `400 26px ${ui}`;
    ctx.fillText(`${cap(s.label)} · ${s.songs.toLocaleString('fr-FR')} morceaux`, pad, yy + 20);
    drawRiverCanvas(ctx, buildFlow(s), { x: pad, y: yy + 44, w: CARD_WIDTH - pad * 2, h: each - 80 }, o.from, c, ui, 22);
  });
  ctx.fillStyle = c.ink3;
  ctx.font = `400 24px ${ui}`;
  ctx.fillText('Chordonomicon, iRb, McGill Billboard · degrés en classe de triade', pad, 1250);
  ctx.fillText(o.siteUrl, pad, 1292);
  return canvasToBlob(canvas);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
