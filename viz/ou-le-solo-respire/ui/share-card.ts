/** Image de partage 1080×1350 : l'accord, la répartition des douze degrés en barres, la phrase. */
import type { Quality } from '@shell/music/chords';
import { canvasToBlob, wrapText } from '@shell/share';
import { DEGREE_LONG, DEGREE_NAMES, chordTones, onceEvery, read } from '../domain/solo';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export interface BarColors {
  bar: string;
  tone: string;
  accent: string;
  ink: string;
  ink3: string;
  rule: string;
}

/** Douze barres verticales, notes de l'accord plus foncées, la plus jouée à l'accent. */
export function drawDegreeBars(ctx: CanvasRenderingContext2D, counts: ArrayLike<number>, quality: Quality, box: { x: number; y: number; w: number; h: number }, colors: BarColors, fontUi: string, fontPx = 20): void {
  const r = read(counts, quality);
  const tones = new Set(chordTones(quality));
  const gap = 10;
  const bw = (box.w - gap * 11) / 12;
  const max = Math.max(1e-6, ...r.shares);
  const labelH = fontPx * 1.8;
  const ih = box.h - labelH - fontPx * 1.4;
  ctx.strokeStyle = colors.rule;
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + fontPx * 1.4 + ih);
  ctx.lineTo(box.x + box.w, box.y + fontPx * 1.4 + ih);
  ctx.stroke();
  r.shares.forEach((v, i) => {
    const x = box.x + i * (bw + gap);
    const h = (v / max) * ih;
    const top = box.y + fontPx * 1.4 + ih - h;
    ctx.fillStyle = i === r.top ? colors.accent : tones.has(i) ? colors.tone : colors.bar;
    ctx.fillRect(x, top, bw, h);
    ctx.fillStyle = i === r.top ? colors.ink : colors.ink3;
    ctx.font = `${i === r.top ? 700 : 400} ${fontPx * 0.9}px ${fontUi}`;
    ctx.textAlign = 'center';
    if (v > 0.005) ctx.fillText(`${Math.round(v * 100)} %`, x + bw / 2, top - 6);
    ctx.fillStyle = tones.has(i) ? colors.ink : colors.ink3;
    ctx.font = `${tones.has(i) ? 700 : 400} ${fontPx}px ${fontUi}`;
    ctx.fillText(DEGREE_NAMES[i]!, x + bw / 2, box.y + box.h - 4);
  });
}

export async function renderShareCard(o: { title: string; subtitle: string; counts: ArrayLike<number>; quality: Quality; siteUrl: string }): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim();
  const display = v('--font-display') || 'serif';
  const ui = v('--font-ui') || 'sans-serif';
  const pad = 72;
  const r = read(o.counts, o.quality);
  ctx.fillStyle = v('--page');
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = v('--ink-3');
  ctx.font = `600 22px ${ui}`;
  ctx.fillText('OÙ LE SOLO RESPIRE', pad, 100);
  ctx.fillStyle = v('--ink');
  ctx.font = `300 54px ${display}`;
  let y = 170;
  for (const line of wrapText(ctx, o.title, CARD_WIDTH - pad * 2).slice(0, 2)) {
    ctx.fillText(line, pad, y);
    y += 60;
  }
  ctx.fillStyle = v('--ink-2');
  ctx.font = `300 34px ${display}`;
  const phrase = r.total ? `Les solistes y jouent ${DEGREE_LONG[r.top]!} ${onceEvery(r.shares[r.top]!)}${r.top3[1] !== undefined ? `, ${DEGREE_LONG[r.top3[1]!]} ${onceEvery(r.shares[r.top3[1]!]!)}` : ''}. La fondamentale : ${onceEvery(r.shares[0]!)}.` : 'Aucune note comptée.';
  for (const line of wrapText(ctx, phrase, CARD_WIDTH - pad * 2).slice(0, 4)) {
    ctx.fillText(line, pad, y);
    y += 44;
  }
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 24px ${ui}`;
  ctx.fillText(o.subtitle, pad, y + 6);
  drawDegreeBars(ctx, o.counts, o.quality, { x: pad, y: y + 50, w: CARD_WIDTH - pad * 2, h: 620 }, { bar: v('--seq-2'), tone: v('--seq-5'), accent: v('--accent'), ink: v('--ink'), ink3: v('--ink-3'), rule: v('--rule-strong') }, ui, 24);
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 22px ${ui}`;
  ctx.textAlign = 'left';
  ctx.fillText('Weimar Jazz Database (456 solos transcrits) · degrés relatifs à l’accord, modulo l’octave', pad, 1256);
  ctx.fillText(o.siteUrl, pad, 1296);
  return canvasToBlob(canvas);
}
