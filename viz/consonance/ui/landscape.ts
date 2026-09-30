/**
 * Le paysage de la rugosité (élément signature) : la courbe de 0 à 1 200 cents en aire remplie,
 * les vallées nommées, les douze notes du piano en repères, et un curseur que l'on glisse.
 * SVG, sans D3 : quelques centaines de points suffisent.
 */
import { PITCH_NAMES } from '@shell/music/pitch';
import type { CurvePoint, Valley } from '../domain/roughness';

const NS = 'http://www.w3.org/2000/svg';
const HEIGHT = 320;
const TOP = 34;
const BOTTOM = 46;
const SIDE = 14;

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}, text?: string): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

export interface Landscape {
  setCurve(curve: readonly CurvePoint[], valleys: readonly Valley[], rootMidi: number): void;
  setCursor(cents: number): void;
  resize(): void;
}

export function createLandscape(svg: SVGSVGElement, onScrub: (cents: number, final: boolean) => void): Landscape {
  let width = Math.max(300, svg.clientWidth || 600);
  let curve: readonly CurvePoint[] = [];
  let valleys: readonly Valley[] = [];
  let rootMidi = 60;
  let cents = 0;

  const gCurve = el('g');
  const gTicks = el('g');
  const gValleys = el('g');
  const gCursor = el('g', { class: 'ls-cursor' });
  svg.append(gTicks, gCurve, gValleys, gCursor);

  const x = (c: number) => SIDE + (c / 1200) * (width - 2 * SIDE);
  const maxValue = () => Math.max(1e-9, ...curve.filter((p) => p.cents <= 1200).map((p) => p.value));
  const y = (v: number) => TOP + (1 - v / maxValue()) * (HEIGHT - TOP - BOTTOM);
  const centsAt = (clientX: number) => {
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * width;
    return Math.min(1200, Math.max(0, Math.round(((px - SIDE) / (width - 2 * SIDE)) * 1200)));
  };

  function drawCurve() {
    gCurve.innerHTML = '';
    if (curve.length === 0) return;
    const pts = curve.filter((p) => p.cents <= 1200);
    const base = HEIGHT - BOTTOM;
    let d = `M${x(0).toFixed(1)},${base}`;
    for (const p of pts) d += `L${x(p.cents).toFixed(1)},${y(p.value).toFixed(1)}`;
    d += `L${x(1200).toFixed(1)},${base}Z`;
    gCurve.append(el('path', { d, class: 'ls-area' }));
    let line = '';
    pts.forEach((p, i) => (line += `${i ? 'L' : 'M'}${x(p.cents).toFixed(1)},${y(p.value).toFixed(1)}`));
    gCurve.append(el('path', { d: line, class: 'ls-line' }));
    gCurve.append(el('line', { x1: SIDE, x2: width - SIDE, y1: base, y2: base, class: 'ls-base' }));
  }

  function drawTicks() {
    gTicks.innerHTML = '';
    const base = HEIGHT - BOTTOM;
    const dense = width < 520;
    for (let k = 0; k <= 12; k++) {
      const px = x(k * 100);
      gTicks.append(el('line', { x1: px, x2: px, y1: TOP - 6, y2: base + 6, class: 'ls-tick' }));
      const name = PITCH_NAMES[(rootMidi + k) % 12]!;
      if (!dense || k % 2 === 0) gTicks.append(el('text', { x: px, y: base + 20, class: 'ls-tick-label', 'text-anchor': 'middle' }, name));
    }
    gTicks.append(el('text', { x: SIDE, y: HEIGHT - 6, class: 'ls-axis-title' }, dense ? 'les notes du piano' : 'les notes du piano, à partir de la note grave'));
    if (!dense) gTicks.append(el('text', { x: width - SIDE, y: HEIGHT - 6, class: 'ls-axis-title', 'text-anchor': 'end' }, '1 200 cents = une octave'));
  }

  function drawValleys() {
    gValleys.innerHTML = '';
    const named = valleys.filter((v) => v.ratio && v.cents > 0 && v.cents <= 1200);
    named.forEach((v, i) => {
      const px = x(v.cents);
      const py = y(v.value);
      const up = i % 2 === 0 ? 0 : 14;
      const g = el('g', { class: 'ls-valley' });
      g.append(el('line', { x1: px, x2: px, y1: py - 4, y2: TOP - 4 - up, class: 'ls-valley-line' }));
      const label = `${v.ratio!.num}/${v.ratio!.den}`;
      const t = el('text', { x: px, y: TOP - 8 - up, class: 'ls-valley-label', 'text-anchor': 'middle' }, label);
      t.append(el('title', {}, `${v.ratio!.label} : ${v.ratio!.num}/${v.ratio!.den}, ${Math.round(v.ratio!.cents)} cents`));
      g.append(t);
      gValleys.append(g);
    });
  }

  function drawCursor() {
    gCursor.innerHTML = '';
    if (curve.length === 0) return;
    const px = x(cents);
    const p = curve[Math.round(cents)] ?? curve[curve.length - 1]!;
    const py = y(p.value);
    gCursor.append(el('line', { x1: px, x2: px, y1: TOP - 2, y2: HEIGHT - BOTTOM, class: 'ls-cursor-line' }));
    gCursor.append(el('circle', { cx: px, cy: py, r: 6, class: 'ls-cursor-dot' }));
  }

  function redraw() {
    svg.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`);
    drawTicks();
    drawCurve();
    drawValleys();
    drawCursor();
  }

  // Glisser au doigt ou à la souris : le pan vertical reste au navigateur (touch-action: pan-y en CSS).
  let dragging = false;
  svg.addEventListener('pointerdown', (e) => {
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    onScrub(centsAt(e.clientX), false);
  });
  svg.addEventListener('pointermove', (e) => {
    if (dragging) onScrub(centsAt(e.clientX), false);
  });
  const end = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    onScrub(centsAt(e.clientX), true);
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', () => (dragging = false));

  return {
    setCurve(nextCurve, nextValleys, root) {
      curve = nextCurve;
      valleys = nextValleys;
      rootMidi = root;
      redraw();
    },
    setCursor(c) {
      cents = c;
      drawCursor();
    },
    resize() {
      const w = Math.max(300, svg.clientWidth || 600);
      if (w === width) return;
      width = w;
      redraw();
    },
  };
}
