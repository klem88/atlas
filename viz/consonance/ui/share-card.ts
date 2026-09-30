/**
 * Image de partage 1080×1350 : le paysage de la rugosité, le curseur, les vallées, la phrase.
 */
import { equalFrequency, intervalName, noteName } from '@shell/music/pitch';
import { canvasToBlob, wrapText } from '@shell/share';
import type { CurvePoint, Valley } from '../domain/roughness';
import type { VizState } from '../state';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
export const SHARE_PHRASE = 'Sans harmoniques, une tierce n’est pas plus douce qu’un triton.';

export interface ShareCardData {
  state: VizState;
  curve: readonly CurvePoint[];
  valleys: readonly Valley[];
  siteUrl: string;
}

export interface LandscapeColors {
  area: string;
  line: string;
  base: string;
  tick: string;
  ink2: string;
  ink3: string;
  accent: string;
  surface: string;
}

/** Dessine le paysage sur un contexte canvas (partagé avec l'image d'aperçu). */
export function drawLandscape(
  ctx: CanvasRenderingContext2D,
  curve: readonly CurvePoint[],
  valleys: readonly Valley[],
  cents: number | null,
  box: { x: number; y: number; w: number; h: number },
  colors: LandscapeColors,
  fontUi: string,
): void {
  const pts = curve.filter((p) => p.cents <= 1200);
  const max = Math.max(1e-9, ...pts.map((p) => p.value));
  const top = box.y + 40;
  const base = box.y + box.h - 40;
  const x = (c: number) => box.x + (c / 1200) * box.w;
  const y = (v: number) => top + (1 - v / max) * (base - top);

  ctx.strokeStyle = colors.tick;
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.ink3;
  ctx.font = `400 18px ${fontUi}`;
  ctx.textAlign = 'center';
  for (let k = 0; k <= 12; k++) {
    ctx.beginPath();
    ctx.moveTo(x(k * 100), top - 6);
    ctx.lineTo(x(k * 100), base + 6);
    ctx.stroke();
  }

  ctx.fillStyle = colors.area;
  ctx.beginPath();
  ctx.moveTo(x(0), base);
  for (const p of pts) ctx.lineTo(x(p.cents), y(p.value));
  ctx.lineTo(x(1200), base);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(x(p.cents), y(p.value)) : ctx.moveTo(x(p.cents), y(p.value))));
  ctx.stroke();

  ctx.strokeStyle = colors.base;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x(0), base);
  ctx.lineTo(x(1200), base);
  ctx.stroke();

  ctx.fillStyle = colors.ink2;
  ctx.font = `400 20px ${fontUi}`;
  valleys
    .filter((v) => v.ratio && v.cents > 0 && v.cents <= 1200)
    .forEach((v, i) => {
      const up = i % 2 ? 24 : 0;
      ctx.fillText(`${v.ratio!.num}/${v.ratio!.den}`, x(v.cents), top - 12 - up);
    });

  if (cents !== null) {
    const px = x(cents);
    const p = curve[Math.round(cents)]!;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, top - 4);
    ctx.lineTo(px, base);
    ctx.stroke();
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(px, y(p.value), 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.surface;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.textAlign = 'left';
}

export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const fontDisplay = v('--font-display');
  const fontUi = v('--font-ui');
  await Promise.all([
    document.fonts.load(`300 96px ${fontDisplay}`),
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
  const { state } = data;

  ctx.fillStyle = v('--page');
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = v('--ink-3');
  ctx.font = `600 26px ${fontUi}`;
  ctx.fillText('POURQUOI UNE TIERCE SONNE DOUCE', pad, 110);

  const semis = Math.round(state.cents / 100);
  const off = state.cents - semis * 100;
  ctx.fillStyle = v('--ink');
  ctx.font = `300 96px ${fontDisplay}`;
  ctx.fillText(`${state.cents.toLocaleString('fr-FR')} cents`, pad, 230);
  ctx.fillStyle = v('--ink-2');
  ctx.font = `300 44px ${fontDisplay}`;
  ctx.fillText(`${semis === 0 && off === 0 ? 'unisson' : intervalName(semis)}${off ? ` ${off > 0 ? '+' : '−'} ${Math.abs(off)} cents` : ''}, depuis ${noteName(state.root)} (${equalFrequency(state.root).toFixed(1).replace('.', ',')} Hz)`, pad, 300, measure);
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 30px ${fontUi}`;
  ctx.fillText(`${state.harmonics} harmonique${state.harmonics > 1 ? 's' : ''} par note`, pad, 350);

  ctx.fillStyle = v('--surface');
  ctx.fillRect(pad, 400, measure, 560);
  ctx.strokeStyle = v('--rule');
  ctx.strokeRect(pad, 400, measure, 560);
  drawLandscape(
    ctx,
    data.curve,
    data.valleys,
    state.cents,
    { x: pad + 30, y: 420, w: measure - 60, h: 520 },
    { area: v('--seq-1'), line: v('--seq-5'), base: v('--rule-strong'), tick: v('--rule'), ink2: v('--ink-2'), ink3: v('--ink-3'), accent: v('--accent'), surface: v('--surface') },
    fontUi,
  );

  ctx.fillStyle = v('--ink');
  ctx.font = `300 40px ${fontDisplay}`;
  let yy = 1060;
  for (const line of wrapText(ctx, SHARE_PHRASE, measure)) {
    ctx.fillText(line, pad, yy);
    yy += 50;
  }
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 26px ${fontUi}`;
  ctx.fillText(data.siteUrl, pad, CARD_HEIGHT - 50);

  return canvasToBlob(canvas);
}
