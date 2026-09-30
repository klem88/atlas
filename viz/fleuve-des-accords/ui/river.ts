/**
 * Le fleuve en SVG (page) et en canvas (images). Les degrés de départ à gauche, les arrivées à droite,
 * les rubans dans la rampe ardoise ; le départ isolé passe à l'accent, le reste s'efface.
 */
import type { Flow } from '../domain/flow';
import { layoutRiver, ribbonPath, type Ribbon, type RiverLayout } from './river-layout';

const NS = 'http://www.w3.org/2000/svg';
const pct = (x: number) => `${Math.round(x * 100)} %`;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

export interface RiverRenderOptions {
  width: number;
  height: number;
  /** Jeton de départ isolé, ou null. */
  from: number | null;
  onPick(token: number): void;
  onHover(ribbon: Ribbon | null): void;
}

export function renderRiver(svg: SVGSVGElement, flow: Flow, o: RiverRenderOptions): RiverLayout {
  const layout = layoutRiver(flow, { width: o.width, height: o.height, labelSpace: 58, nodeWidth: 10, gap: 5, padTop: 4, padBottom: 4 });
  svg.setAttribute('viewBox', `0 0 ${o.width} ${o.height}`);
  svg.replaceChildren();

  const ribbons = el('g', { class: 'river-ribbons' });
  const focused = o.from !== null;
  // Les rubans du départ isolé sont dessinés en dernier, au-dessus des autres.
  const sorted = [...layout.ribbons].sort((a, b) => Number(a.from === o.from) - Number(b.from === o.from));
  for (const r of sorted) {
    const active = o.from === r.from;
    const p = el('path', { d: ribbonPath(r), class: `river-ribbon${active ? ' is-active' : focused ? ' is-dim' : ''}` });
    const title = el('title', {});
    title.textContent = `${labelText(r.from, layout)} → ${labelText(r.to, layout)} : ${pct(r.share)} des départs du ${labelText(r.from, layout)} (${r.value.toLocaleString('fr-FR')} transitions)`;
    p.append(title);
    p.addEventListener('pointerenter', () => o.onHover(r));
    p.addEventListener('pointerleave', () => o.onHover(null));
    p.addEventListener('click', () => o.onPick(r.from));
    ribbons.append(p);
  }
  svg.append(ribbons);

  const nodes = el('g', { class: 'river-nodes' });
  for (const n of layout.left) {
    const g = el('g', { class: `river-node river-node--left${o.from === n.token ? ' is-active' : ''}`, tabindex: 0, role: 'button', 'aria-pressed': String(o.from === n.token) });
    g.append(el('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 1.5 }));
    // Zone de toucher plus large que le nœud.
    g.append(el('rect', { x: 0, y: n.y - 2, width: n.x + n.w + 6, height: n.h + 4, class: 'river-hit' }));
    if (n.h >= 9) {
      const t = el('text', { x: n.x - 6, y: n.y + n.h / 2, 'text-anchor': 'end', 'dominant-baseline': 'middle' });
      t.textContent = n.label;
      g.append(t);
    }
    const title = el('title', {});
    title.textContent = `${n.label} : ${n.value.toLocaleString('fr-FR')} départs. Toucher pour isoler.`;
    g.append(title);
    const pick = () => o.onPick(n.token);
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick();
      }
    });
    nodes.append(g);
  }
  // Parts affichées à droite : celles du départ isolé (trois plus fortes), sinon rien (étiquettes sélectives).
  const shown = new Map<number, number>();
  if (focused) {
    layout.ribbons
      .filter((r) => r.from === o.from)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .forEach((r) => shown.set(r.to, r.share));
  }
  for (const n of layout.right) {
    const g = el('g', { class: 'river-node river-node--right' });
    g.append(el('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 1.5 }));
    if (n.h >= 9 || shown.has(n.token)) {
      const t = el('text', { x: n.x + n.w + 6, y: n.y + n.h / 2, 'dominant-baseline': 'middle' });
      t.textContent = n.label;
      g.append(t);
      const share = shown.get(n.token);
      if (share !== undefined) {
        const v = el('text', { x: n.x + n.w + 6 + n.label.length * 7.5 + 4, y: n.y + n.h / 2, 'dominant-baseline': 'middle', class: 'river-share' });
        v.textContent = pct(share);
        g.append(v);
      }
    }
    nodes.append(g);
  }
  svg.append(nodes);
  return layout;
}

function labelText(token: number, layout: RiverLayout): string {
  return layout.left.find((n) => n.token === token)?.label ?? layout.right.find((n) => n.token === token)?.label ?? '?';
}

export interface RiverColors {
  ribbon: string;
  ribbonDim: string;
  accent: string;
  node: string;
  ink: string;
  ink3: string;
}

/** Même dessin sur un canvas. */
export function drawRiverCanvas(ctx: CanvasRenderingContext2D, flow: Flow, box: { x: number; y: number; w: number; h: number }, from: number | null, colors: RiverColors, fontUi: string, fontPx = 18): void {
  const layout = layoutRiver(flow, { width: box.w, height: box.h, labelSpace: fontPx * 3.4, nodeWidth: 12, gap: 6, padTop: 2, padBottom: 2 });
  ctx.save();
  ctx.translate(box.x, box.y);
  const sorted = [...layout.ribbons].sort((a, b) => Number(a.from === from) - Number(b.from === from));
  for (const r of sorted) {
    const cx = (r.x0 + r.x1) / 2;
    ctx.beginPath();
    ctx.moveTo(r.x0, r.y0a);
    ctx.bezierCurveTo(cx, r.y0a, cx, r.y1a, r.x1, r.y1a);
    ctx.lineTo(r.x1, r.y1b);
    ctx.bezierCurveTo(cx, r.y1b, cx, r.y0b, r.x0, r.y0b);
    ctx.closePath();
    ctx.fillStyle = from === null ? colors.ribbon : r.from === from ? colors.accent : colors.ribbonDim;
    ctx.globalAlpha = from === null ? 0.75 : r.from === from ? 0.85 : 0.35;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = `600 ${fontPx}px ${fontUi}`;
  ctx.textBaseline = 'middle';
  for (const n of layout.left) {
    ctx.fillStyle = from === n.token ? colors.accent : colors.node;
    ctx.fillRect(n.x, n.y, n.w, n.h);
    if (n.h >= fontPx * 0.8) {
      ctx.fillStyle = colors.ink;
      ctx.textAlign = 'right';
      ctx.fillText(n.label, n.x - 8, n.y + n.h / 2);
    }
  }
  for (const n of layout.right) {
    ctx.fillStyle = colors.node;
    ctx.fillRect(n.x, n.y, n.w, n.h);
    if (n.h >= fontPx * 0.8) {
      ctx.fillStyle = colors.ink;
      ctx.textAlign = 'left';
      ctx.fillText(n.label, n.x + n.w + 8, n.y + n.h / 2);
    }
  }
  ctx.restore();
}
