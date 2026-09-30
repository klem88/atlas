/**
 * Une rose : douze rayons (les axes communs), longueur = rapport au corpus en échelle log bornée ; le cercle du
 * milieu vaut « comme tout le monde ». En SVG pour la page, en canvas pour les images.
 */
import { radius } from '../domain/compass';

const NS = 'http://www.w3.org/2000/svg';

export interface RoseOptions {
  size: number;
  /** Étiquettes des axes (affichées seulement si `labels` est vrai). */
  axisLabels?: string[];
  labels?: boolean;
  accent?: boolean;
}

function polygonPoints(values: readonly number[], cx: number, cy: number, r: number): string {
  return values
    .map((v, i) => {
      const a = (i / values.length) * 2 * Math.PI - Math.PI / 2;
      const rr = radius(v) * r;
      return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
    })
    .join(' ');
}

export function renderRose(svg: SVGSVGElement, values: readonly number[], o: RoseOptions): void {
  const s = o.size;
  const cx = s / 2;
  const cy = s / 2;
  const r = (s / 2) * (o.labels ? 0.72 : 0.9);
  svg.setAttribute('viewBox', `0 0 ${s} ${s}`);
  svg.replaceChildren();
  const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    svg.append(e);
    return e;
  };
  // Cercles de repère : ×¼, ×1, ×4
  el('circle', { cx, cy, r, class: 'rose-ring' });
  el('circle', { cx, cy, r: r * 0.5, class: 'rose-ring rose-ring--one' });
  values.forEach((_, i) => {
    const a = (i / values.length) * 2 * Math.PI - Math.PI / 2;
    el('line', { x1: cx, y1: cy, x2: cx + r * Math.cos(a), y2: cy + r * Math.sin(a), class: 'rose-spoke' });
  });
  el('polygon', { points: polygonPoints(values, cx, cy, r), class: `rose-shape${o.accent ? ' is-accent' : ''}` });
  values.forEach((v, i) => {
    const a = (i / values.length) * 2 * Math.PI - Math.PI / 2;
    const rr = radius(v) * r;
    el('circle', { cx: cx + rr * Math.cos(a), cy: cy + rr * Math.sin(a), r: o.labels ? 3 : 1.6, class: `rose-dot${o.accent ? ' is-accent' : ''}` });
    if (o.labels && o.axisLabels) {
      const lx = cx + (r + 16) * Math.cos(a);
      const ly = cy + (r + 16) * Math.sin(a);
      const t = el('text', { x: lx, y: ly, 'text-anchor': Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end', 'dominant-baseline': 'middle', class: 'rose-label' });
      t.textContent = o.axisLabels[i] ?? '';
    }
  });
}

export interface RoseColors {
  ring: string;
  spoke: string;
  shape: string;
  accent: string;
  label: string;
}

export function drawRoseCanvas(ctx: CanvasRenderingContext2D, values: readonly number[], cx: number, cy: number, r: number, colors: RoseColors, accent = false, labels?: string[], fontUi = 'sans-serif', fontPx = 14): void {
  ctx.save();
  ctx.strokeStyle = colors.ring;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = colors.spoke;
  values.forEach((_, i) => {
    const a = (i / values.length) * 2 * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.stroke();
  });
  ctx.beginPath();
  values.forEach((v, i) => {
    const a = (i / values.length) * 2 * Math.PI - Math.PI / 2;
    const rr = radius(v) * r;
    const x = cx + rr * Math.cos(a);
    const y = cy + rr * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = accent ? colors.accent : colors.shape;
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = accent ? colors.accent : colors.shape;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (labels) {
    ctx.fillStyle = colors.label;
    ctx.font = `500 ${fontPx}px ${fontUi}`;
    ctx.textBaseline = 'middle';
    values.forEach((_, i) => {
      const a = (i / values.length) * 2 * Math.PI - Math.PI / 2;
      ctx.textAlign = Math.abs(Math.cos(a)) < 0.2 ? 'center' : Math.cos(a) > 0 ? 'left' : 'right';
      ctx.fillText(labels[i] ?? '', cx + (r + fontPx) * Math.cos(a), cy + (r + fontPx) * Math.sin(a));
    });
  }
  ctx.restore();
}
