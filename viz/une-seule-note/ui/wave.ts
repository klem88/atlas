/**
 * L'onde résultante : deux périodes de la fondamentale, somme des rangs allumés (amplitudes en 1/k).
 * Le timbre, c'est la forme de cette onde.
 */
import { sumWave } from '../domain/partials';

export interface WaveColors {
  line: string;
  fill: string;
  axis: string;
}

export function readWaveColors(): WaveColors {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return { line: v('--seq-5'), fill: v('--seq-1'), axis: v('--rule') };
}

/** Dessine deux périodes de la somme dans le rectangle donné (utilisable aussi hors page). */
export function drawWave(ctx: CanvasRenderingContext2D, ranks: readonly number[], box: { x: number; y: number; w: number; h: number }, colors: WaveColors): void {
  const mid = box.y + box.h / 2;
  const n = Math.max(200, Math.round(box.w * 2));
  const values: number[] = [];
  let peak = 1e-9;
  for (let i = 0; i <= n; i++) {
    const v = sumWave(ranks, (i / n) * 2);
    values.push(v);
    peak = Math.max(peak, Math.abs(v));
  }
  const amp = (box.h / 2) * 0.9;
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(box.x, mid);
  ctx.lineTo(box.x + box.w, mid);
  ctx.stroke();

  ctx.fillStyle = colors.fill;
  ctx.beginPath();
  ctx.moveTo(box.x, mid);
  values.forEach((v, i) => ctx.lineTo(box.x + (i / n) * box.w, mid - (v / peak) * amp));
  ctx.lineTo(box.x + box.w, mid);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = box.x + (i / n) * box.w;
    const y = mid - (v / peak) * amp;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

export interface Wave {
  render(ranks: readonly number[]): void;
  resize(): void;
}

export function createWave(canvas: HTMLCanvasElement, colors: () => WaveColors): Wave {
  const ctx = canvas.getContext('2d')!;
  let width = 0;
  let height = 0;
  let last: readonly number[] = [];

  function render(ranks: readonly number[]) {
    last = ranks;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawWave(ctx, ranks, { x: 0, y: 0, w: width, h: height }, colors());
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    render(last);
  }

  return { render, resize };
}
