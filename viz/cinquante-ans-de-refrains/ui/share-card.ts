/** Image de partage 1080×1350 : la phrase, la courbe de la mesure, les rubans des degrés. */
import { canvasToBlob, wrapText } from '@shell/share';
import type { Measure, Series, YearPoint } from '../data/contract';
import { drawRibbonsCanvas } from './ribbons';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

type Labels = Record<Measure, { chip: string; title: string; unit: (v: number) => string; word: string }>;
const valueOf = (p: YearPoint, m: Measure): number | null => (m === 'septiemes' ? p.septiemes : p[m]);

export function drawLineCanvas(ctx: CanvasRenderingContext2D, years: readonly YearPoint[], m: Measure, box: { x: number; y: number; w: number; h: number }, colors: { line: string; grid: string; ink3: string; hatch: string }, fontUi: string, unit: (v: number) => string, minSongs = 200): void {
  const pts = years.map((p) => ({ x: p.year, y: valueOf(p, m), weak: p.songs < minSongs }));
  const y0 = years[0]!.year;
  const y1 = years[years.length - 1]!.year;
  const max = Math.max(...pts.map((p) => p.y ?? 0)) || 1;
  const top = m === 'distincts' ? Math.ceil(max) : Math.ceil(max * 10) / 10;
  const x = (yr: number) => box.x + ((yr - y0) / (y1 - y0)) * box.w;
  const y = (v: number) => box.y + box.h - 30 - (v / top) * (box.h - 50);
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (const t of [0, top]) {
    ctx.beginPath();
    ctx.moveTo(box.x, y(t));
    ctx.lineTo(box.x + box.w, y(t));
    ctx.stroke();
    ctx.fillStyle = colors.ink3;
    ctx.font = `400 18px ${fontUi}`;
    ctx.textAlign = 'left';
    ctx.fillText(unit(t), box.x, y(t) - 6);
  }
  ctx.strokeStyle = colors.hatch;
  const step = box.w / Math.max(1, y1 - y0);
  for (const p of pts) {
    if (!p.weak) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x(p.x) - step / 2, box.y, step, box.h - 30);
    ctx.clip();
    for (let d = -box.h; d < step + box.h; d += 7) {
      ctx.beginPath();
      ctx.moveTo(x(p.x) - step / 2 + d, box.y + box.h - 30);
      ctx.lineTo(x(p.x) - step / 2 + d + box.h, box.y);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let pen = false;
  for (const p of pts) {
    if (p.y === null) {
      pen = false;
      continue;
    }
    if (!pen) ctx.moveTo(x(p.x), y(p.y));
    else ctx.lineTo(x(p.x), y(p.y));
    pen = true;
  }
  ctx.stroke();
  ctx.fillStyle = colors.ink3;
  ctx.font = `400 18px ${fontUi}`;
  ctx.textAlign = 'left';
  ctx.fillText(String(y0), box.x, box.y + box.h - 6);
  ctx.textAlign = 'right';
  ctx.fillText(String(y1), box.x + box.w, box.y + box.h - 6);
}

export async function renderShareCard(o: { series: Series; measure: Measure; year: number | null; labels: Labels; siteUrl: string }): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim();
  const display = v('--font-display') || 'serif';
  const ui = v('--font-ui') || 'sans-serif';
  const pad = 72;
  const m = o.measure;
  const L = o.labels[m];
  const good = o.series.years.filter((p) => p.songs >= o.series.minSongs);
  const a = good[0] ?? o.series.years[0]!;
  const b = good[good.length - 1] ?? o.series.years[o.series.years.length - 1]!;
  ctx.fillStyle = v('--page');
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = v('--ink-3');
  ctx.font = `600 22px ${ui}`;
  ctx.fillText('CINQUANTE ANS DE REFRAINS', pad, 100);
  ctx.fillStyle = v('--ink');
  ctx.font = `300 52px ${display}`;
  let y = 170;
  const va = valueOf(a, m);
  const vb = valueOf(b, m);
  const head = `En ${a.year}, ${va === null ? '—' : L.unit(va)} ${L.word}. En ${b.year}, ${vb === null ? '—' : L.unit(vb)}. Et pourtant.`;
  for (const line of wrapText(ctx, head, CARD_WIDTH - pad * 2).slice(0, 4)) {
    ctx.fillText(line, pad, y);
    y += 60;
  }
  ctx.fillStyle = v('--ink-2');
  ctx.font = `400 24px ${ui}`;
  ctx.fillText(`${L.title} — ${o.series.label}`, pad, y + 10);
  drawLineCanvas(ctx, o.series.years, m, { x: pad, y: y + 30, w: CARD_WIDTH - pad * 2, h: 320 }, { line: v('--seq-5'), grid: v('--rule'), ink3: v('--ink-3'), hatch: v('--hatch-ink') }, ui, L.unit, o.series.minSongs);
  ctx.fillStyle = v('--ink-2');
  ctx.font = `400 24px ${ui}`;
  ctx.fillText('La part de chaque degré, du I (en bas) aux autres (en haut)', pad, y + 390);
  drawRibbonsCanvas(ctx, o.series.years, { x: pad, y: y + 410, w: CARD_WIDTH - pad * 2, h: 300 }, { ramp: [v('--seq-6'), v('--seq-5'), v('--seq-4'), v('--seq-3'), v('--seq-2'), v('--seq-1'), v('--seq-0')], ink3: v('--ink-3'), hatch: v('--hatch-ink') }, ui, 18, o.series.minSongs);
  ctx.fillStyle = v('--ink-3');
  ctx.font = `400 22px ${ui}`;
  ctx.fillText(`Chordonomicon, McGill Billboard · sans lissage · années hachurées : moins de ${o.series.minSongs} morceaux`, pad, 1256);
  ctx.fillText(o.siteUrl, pad, 1296);
  return canvasToBlob(canvas);
}
