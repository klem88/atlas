/**
 * Image de partage 1080×1350 (format 4:5) : les notes, leur écart au pur, les battements et la vague.
 */
import { canvasToBlob, wrapText } from '@shell/share';
import type { PairBeats } from '../domain/beats';
import type { TuningId } from '@shell/music/tuning';
import { fmtBeats, fmtInterval, fmtNotes, pairSentence } from './strings';
import { createWaves, readWaveTheme } from './waves';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export interface ShareCardData {
  notes: readonly number[];
  tuning: TuningId;
  pair: PairBeats;
  windowS: number;
  siteUrl: string;
}

export const SHARE_PHRASE = 'Sur ton piano, aucune quinte n’est juste, et c’est voulu.';

export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const fontDisplay = v('--font-display');
  const fontUi = v('--font-ui');
  await Promise.all([
    document.fonts.load(`300 110px ${fontDisplay}`),
    document.fonts.load(`300 44px ${fontDisplay}`),
    document.fonts.load(`600 26px ${fontUi}`),
    document.fonts.load(`400 34px ${fontUi}`),
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
  ctx.fillText('POURQUOI TON PIANO EST (LÉGÈREMENT) FAUX', pad, 110);

  ctx.fillStyle = v('--ink');
  ctx.font = `300 110px ${fontDisplay}`;
  ctx.fillText(fmtNotes(data.notes), pad, 240, measure);

  ctx.fillStyle = v('--ink-2');
  ctx.font = `300 44px ${fontDisplay}`;
  const interval = data.notes.length === 2 ? `une ${fmtInterval(data.pair.semitones)}` : `un accord de ${data.notes.length} notes`;
  ctx.fillText(interval, pad, 310, measure);

  ctx.fillStyle = v('--ink-2');
  ctx.font = `400 34px ${fontUi}`;
  let y = 400;
  for (const line of wrapText(ctx, pairSentence(data.pair, data.tuning), measure)) {
    ctx.fillText(line, pad, y);
    y += 46;
  }

  ctx.fillStyle = v('--accent');
  ctx.fillRect(pad, y + 10, 48, 4);
  ctx.fillStyle = v('--ink');
  ctx.font = `300 44px ${fontDisplay}`;
  ctx.fillText(fmtBeats(data.pair.beatHz), pad, y + 70, measure);

  // La vague
  const waveCanvas = document.createElement('canvas');
  const waveH = 520;
  const waves = createWaves(waveCanvas, readWaveTheme, { width: measure, height: waveH });
  waves.resize();
  waves.render({ pair: data.pair, windowS: data.windowS, t: 0, playing: false });
  ctx.drawImage(waveCanvas, pad, 640);

  ctx.fillStyle = v('--ink');
  ctx.font = `300 40px ${fontDisplay}`;
  y = 1215;
  for (const line of wrapText(ctx, SHARE_PHRASE, measure)) {
    ctx.fillText(line, pad, y);
    y += 50;
  }
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 26px ${fontUi}`;
  ctx.fillText(data.siteUrl, pad, CARD_HEIGHT - 50);

  return canvasToBlob(canvas);
}
