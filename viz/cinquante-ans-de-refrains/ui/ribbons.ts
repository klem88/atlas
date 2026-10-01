/**
 * Les rubans empilés : pour chaque année, la part de chaque degré (I, ii, iii, IV, V, vi, autres) en aires empilées,
 * rampe ardoise du foncé (I) au clair (autres). Années fragiles hachurées, curseur sur l'année choisie.
 * En SVG pour la page, en canvas pour les images.
 */
import { DEGREE_BINS, type YearPoint } from '../data/contract';

const NS = 'http://www.w3.org/2000/svg';
const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};

export interface RibbonOptions {
  width: number;
  height: number;
  current: number | null;
  xTicks: number[];
  /** Années à moins de morceaux que ce seuil : hachurées. */
  minSongs: number;
}

export interface RibbonScales {
  x: (year: number) => number;
  xInvert: (px: number) => number;
}

/** Rubans dans `svg` ; renvoie l'échelle x pour le glissé. */
export function renderRibbons(svg: SVGSVGElement, years: readonly YearPoint[], o: RibbonOptions): RibbonScales | null {
  svg.setAttribute('viewBox', `0 0 ${o.width} ${o.height}`);
  svg.replaceChildren();
  if (years.length < 2) return null;
  const m = { top: 8, right: 12, bottom: 22, left: 12 };
  const iw = o.width - m.left - m.right;
  const ih = o.height - m.top - m.bottom;
  const y0 = years[0]!.year;
  const y1 = years[years.length - 1]!.year;
  const x = (yr: number) => m.left + ((yr - y0) / (y1 - y0)) * iw;
  const xInvert = (px: number) => y0 + ((px - m.left) / iw) * (y1 - y0);
  const y = (v: number) => m.top + ih - v * ih;

  const defs = el('defs', {});
  const pat = el('pattern', { id: 'rb-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
  pat.append(el('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'rb-hatch-line' }));
  defs.append(pat);
  svg.append(defs);

  // Aires empilées, du bas (I) vers le haut (autres).
  const n = DEGREE_BINS.length;
  const cum = years.map(() => 0);
  for (let k = 0; k < n; k++) {
    let top = '';
    let bottom = '';
    years.forEach((p, i) => {
      const b = cum[i]!;
      const t = b + p.degrees[k]!;
      top += `${top ? 'L' : 'M'}${x(p.year).toFixed(1)},${y(t).toFixed(1)}`;
      bottom = `L${x(p.year).toFixed(1)},${y(b).toFixed(1)}${bottom}`;
      cum[i] = t;
    });
    const path = el('path', { d: `${top}${bottom}Z`, class: `rb-area rb-area--${k}` });
    const title = el('title', {});
    title.textContent = DEGREE_BINS[k]!;
    path.append(title);
    svg.append(path);
  }
  // Hachures sur les années fragiles (bande centrée sur l'année).
  const step = iw / Math.max(1, y1 - y0);
  for (const p of years) {
    if (p.songs >= o.minSongs) continue;
    svg.append(el('rect', { x: x(p.year) - step / 2, y: m.top, width: step, height: ih, fill: 'url(#rb-hatch)', class: 'rb-weak' }));
  }
  // Étiquettes directes des rubans, à droite, si la bande est assez haute.
  const last = years[years.length - 1]!;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const h = last.degrees[k]! * ih;
    if (h >= 11) {
      const t = el('text', { x: x(last.year) - 4, y: y(acc + last.degrees[k]! / 2) + 4, 'text-anchor': 'end', class: 'rb-label' });
      t.textContent = DEGREE_BINS[k]!;
      svg.append(t);
    }
    acc += last.degrees[k]!;
  }
  for (const t of o.xTicks) {
    const lbl = el('text', { x: x(t), y: o.height - 6, 'text-anchor': t === y0 ? 'start' : t === y1 ? 'end' : 'middle', class: 'rb-axis' });
    lbl.textContent = String(t);
    svg.append(lbl);
  }
  if (o.current !== null && o.current >= y0 && o.current <= y1) svg.append(el('line', { x1: x(o.current), x2: x(o.current), y1: m.top, y2: m.top + ih, class: 'rb-cursor' }));
  return { x, xInvert };
}

export interface RibbonColors {
  ramp: string[];
  ink3: string;
  hatch: string;
}

export function drawRibbonsCanvas(ctx: CanvasRenderingContext2D, years: readonly YearPoint[], box: { x: number; y: number; w: number; h: number }, colors: RibbonColors, fontUi: string, fontPx = 16, minSongs = 200): void {
  if (years.length < 2) return;
  const y0 = years[0]!.year;
  const y1 = years[years.length - 1]!.year;
  const labelH = fontPx * 1.6;
  const ih = box.h - labelH;
  const x = (yr: number) => box.x + ((yr - y0) / (y1 - y0)) * box.w;
  const y = (v: number) => box.y + ih - v * ih;
  const cum = years.map(() => 0);
  for (let k = 0; k < DEGREE_BINS.length; k++) {
    ctx.beginPath();
    years.forEach((p, i) => {
      const t = cum[i]! + p.degrees[k]!;
      if (i === 0) ctx.moveTo(x(p.year), y(t));
      else ctx.lineTo(x(p.year), y(t));
    });
    for (let i = years.length - 1; i >= 0; i--) ctx.lineTo(x(years[i]!.year), y(cum[i]!));
    ctx.closePath();
    ctx.fillStyle = colors.ramp[k] ?? colors.ramp[colors.ramp.length - 1]!;
    ctx.fill();
    years.forEach((p, i) => (cum[i]! += p.degrees[k]!));
  }
  ctx.strokeStyle = colors.hatch;
  ctx.lineWidth = 1;
  const step = box.w / Math.max(1, y1 - y0);
  for (const p of years) {
    if (p.songs >= minSongs) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x(p.year) - step / 2, box.y, step, ih);
    ctx.clip();
    for (let d = -ih; d < step + ih; d += 7) {
      ctx.beginPath();
      ctx.moveTo(x(p.year) - step / 2 + d, box.y + ih);
      ctx.lineTo(x(p.year) - step / 2 + d + ih, box.y);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle = colors.ink3;
  ctx.font = `400 ${fontPx}px ${fontUi}`;
  ctx.textAlign = 'left';
  ctx.fillText(String(y0), box.x, box.y + box.h - 2);
  ctx.textAlign = 'right';
  ctx.fillText(String(y1), box.x + box.w, box.y + box.h - 2);
}
