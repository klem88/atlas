/**
 * Image de partage 1080×1350 : le clavier dessiné avec les jetons des harmoniques, l'onde, la phrase.
 * `drawKeyboardStrip` sert aussi à l'image d'aperçu (Node).
 */
import { isBlack } from '@shell/music/keyboard';
import { noteName } from '@shell/music/pitch';
import { canvasToBlob, wrapText } from '@shell/share';
import type { Partial } from '../domain/partials';
import type { VizState } from '../state';
import { drawWave, type WaveColors } from './wave';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
export const SHARE_PHRASE = 'Dans un seul do, il y a déjà un accord majeur. Et une note que ton piano ne peut pas jouer.';

export interface StripColors {
  white: string;
  black: string;
  border: string;
  token: string;
  tokenText: string;
  offKey: string;
  ink3: string;
}

/** Quatre octaves de clavier dessinées, avec un jeton par harmonique (plein si allumé). */
export function drawKeyboardStrip(
  ctx: CanvasRenderingContext2D,
  fundamental: number,
  partials: readonly Partial[],
  on: ReadonlySet<number>,
  box: { x: number; y: number; w: number; h: number },
  colors: StripColors,
  fontUi: string,
): void {
  const low = fundamental;
  const high = fundamental + 48;
  const midis = Array.from({ length: high - low + 1 }, (_, i) => low + i);
  const whites = midis.filter((m) => !isBlack(m));
  const whiteW = box.w / whites.length;
  const blackW = whiteW * 0.62;
  const railH = 150;
  const keyY = box.y + railH;
  const keyH = box.h - railH;
  const centers = new Map<number, number>();

  let wi = 0;
  for (const m of midis) {
    if (!isBlack(m)) {
      const x = box.x + wi * whiteW;
      ctx.fillStyle = colors.white;
      ctx.fillRect(x, keyY, whiteW, keyH);
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, keyY, whiteW, keyH);
      centers.set(m, x + whiteW / 2);
      if (m % 12 === 0) {
        ctx.fillStyle = colors.ink3;
        ctx.font = `400 16px ${fontUi}`;
        ctx.textAlign = 'center';
        ctx.fillText(noteName(m), x + whiteW / 2, keyY + keyH - 10);
      }
      wi++;
    }
  }
  wi = 0;
  for (const m of midis) {
    if (isBlack(m)) {
      const x = box.x + wi * whiteW - blackW / 2;
      ctx.fillStyle = colors.black;
      ctx.fillRect(x, keyY, blackW, keyH * 0.6);
      centers.set(m, x + blackW / 2);
    } else wi++;
  }

  const semitone = (whiteW * 7) / 12;
  const placed: { x: number; row: number }[] = [];
  const items = partials.map((p) => ({ p, x: (centers.get(p.midi) ?? box.x) + (p.cents / 100) * semitone })).sort((a, b) => a.x - b.x);
  for (const it of items) {
    let row = 0;
    while (placed.some((q) => q.row === row && Math.abs(q.x - it.x) < 40)) row++;
    placed.push({ x: it.x, row });
    const cy = keyY - 26 - row * 40;
    ctx.strokeStyle = it.p.onKey ? colors.token : colors.offKey;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(it.x, cy + 17);
    ctx.lineTo(it.x, keyY);
    ctx.stroke();
    const lit = on.has(it.p.k);
    const color = it.p.onKey ? colors.token : colors.offKey;
    ctx.beginPath();
    ctx.arc(it.x, cy, 17, 0, Math.PI * 2);
    ctx.fillStyle = lit ? color : colors.white;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = lit ? colors.tokenText : color;
    ctx.font = `600 16px ${fontUi}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(it.p.k), it.x, cy + 1);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.textAlign = 'left';
}

export interface ShareCardData {
  state: VizState;
  partials: readonly Partial[];
  siteUrl: string;
}

export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const fontDisplay = v('--font-display');
  const fontUi = v('--font-ui');
  await Promise.all([
    document.fonts.load(`300 80px ${fontDisplay}`),
    document.fonts.load(`300 40px ${fontDisplay}`),
    document.fonts.load(`600 26px ${fontUi}`),
    document.fonts.load(`400 30px ${fontUi}`),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const pad = 60;
  const measure = CARD_WIDTH - pad * 2;
  const { state } = data;
  const on = new Set(state.ranks);

  ctx.fillStyle = v('--page');
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = v('--ink-3');
  ctx.font = `600 26px ${fontUi}`;
  ctx.fillText('CE QU’UNE SEULE NOTE CONTIENT', pad, 100);
  ctx.fillStyle = v('--ink');
  ctx.font = `300 80px ${fontDisplay}`;
  ctx.fillText(`${noteName(state.fundamental)} et ses ${state.ranks.length} harmonique${state.ranks.length > 1 ? 's' : ''}`, pad, 200, measure);

  drawKeyboardStrip(
    ctx,
    state.fundamental,
    data.partials,
    on,
    { x: pad, y: 260, w: measure, h: 470 },
    { white: v('--surface'), black: v('--ink'), border: v('--rule-strong'), token: v('--seq-5'), tokenText: v('--surface'), offKey: v('--accent'), ink3: v('--ink-3') },
    fontUi,
  );

  ctx.fillStyle = v('--surface');
  ctx.fillRect(pad, 780, measure, 220);
  ctx.strokeStyle = v('--rule');
  ctx.strokeRect(pad, 780, measure, 220);
  const waveColors: WaveColors = { line: v('--seq-5'), fill: v('--seq-1'), axis: v('--rule') };
  drawWave(ctx, state.ranks, { x: pad + 20, y: 800, w: measure - 40, h: 180 }, waveColors);

  ctx.fillStyle = v('--ink');
  ctx.font = `300 40px ${fontDisplay}`;
  let y = 1090;
  for (const line of wrapText(ctx, SHARE_PHRASE, measure)) {
    ctx.fillText(line, pad, y);
    y += 50;
  }
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 26px ${fontUi}`;
  ctx.fillText(data.siteUrl, pad, CARD_HEIGHT - 50);

  return canvasToBlob(canvas);
}
