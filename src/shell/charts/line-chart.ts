/**
 * Petit graphique en ligne SVG, sans dépendance : une série, un repère « année courante ».
 * Conforme aux règles de la maison : trait 2 px, points ≥ 8 px entourés de la couleur de fond,
 * grille en filets discrets, texte en couleurs d'encre (jamais la couleur de la série).
 */

export interface LinePoint {
  x: number;
  y: number | null;
}

export interface LineChartOptions {
  width: number;
  height: number;
  /** Valeur x mise en avant (point + étiquette). */
  current?: number;
  formatY: (y: number) => string;
  /** Étiquettes de l'axe x à afficher. */
  xTicks: number[];
  /** Graduation horizontale de référence (ex. 0 et le max arrondi). */
  yTicks?: number[];
  yMin?: number;
  /** Titre accessible. */
  label: string;
  margin?: { top: number; right: number; bottom: number; left: number };
}

const NS = 'http://www.w3.org/2000/svg';

export interface ChartScales {
  x: (v: number) => number;
  y: (v: number) => number;
  xInvert: (px: number) => number;
}

export function renderLineChart(svg: SVGSVGElement, points: LinePoint[], o: LineChartOptions): ChartScales {
  const m = o.margin ?? { top: 22, right: 12, bottom: 22, left: 12 };
  const valid = points.filter((p): p is { x: number; y: number } => p.y !== null);
  const xs = points.map((p) => p.x);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const yMax = Math.max(...(o.yTicks ?? []), ...valid.map((p) => p.y), 1e-9);
  const yMin = o.yMin ?? 0;
  const iw = o.width - m.left - m.right;
  const ih = o.height - m.top - m.bottom;
  const x = (v: number) => m.left + (x1 === x0 ? iw / 2 : ((v - x0) / (x1 - x0)) * iw);
  const y = (v: number) => m.top + ih - ((v - yMin) / (yMax - yMin || 1)) * ih;
  const xInvert = (px: number) => x0 + ((px - m.left) / iw) * (x1 - x0);

  svg.setAttribute('viewBox', `0 0 ${o.width} ${o.height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', o.label);
  svg.replaceChildren();

  const g = (cls: string) => el('g', { class: cls });
  const grid = g('lc-grid');
  for (const t of o.yTicks ?? []) {
    grid.append(el('line', { x1: m.left, x2: o.width - m.right, y1: y(t), y2: y(t) }));
    const label = el('text', { x: m.left, y: y(t) - 4, 'text-anchor': 'start' });
    label.textContent = o.formatY(t);
    grid.append(label);
  }

  const axis = g('lc-axis');
  for (const t of o.xTicks) {
    const label = el('text', { x: x(t), y: o.height - 4, 'text-anchor': t === x0 ? 'start' : t === x1 ? 'end' : 'middle' });
    label.textContent = String(t);
    axis.append(label);
  }

  // Ligne interrompue là où la valeur manque.
  let d = '';
  let pen = false;
  for (const p of points) {
    if (p.y === null) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`;
    pen = true;
  }
  const line = el('path', { class: 'lc-line', d });

  const marks = g('lc-marks');
  if (o.current !== undefined) {
    const cur = points.find((p) => p.x === o.current);
    marks.append(el('line', { class: 'lc-cursor', x1: x(o.current), x2: x(o.current), y1: m.top - 6, y2: m.top + ih }));
    if (cur && cur.y !== null) {
      marks.append(el('circle', { class: 'lc-dot', cx: x(cur.x), cy: y(cur.y), r: 4.5 }));
      const tx = Math.min(Math.max(x(cur.x), m.left + 24), o.width - m.right - 24);
      const label = el('text', { class: 'lc-value', x: tx, y: Math.max(12, y(cur.y) - 10), 'text-anchor': 'middle' });
      label.textContent = o.formatY(cur.y);
      marks.append(label);
    }
  }

  svg.append(grid, axis, line, marks);
  return { x, y, xInvert };
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}
