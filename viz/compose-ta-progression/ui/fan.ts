/**
 * L'éventail : les accords possibles en disques sur un arc au-dessus de l'accord courant, taille = probabilité,
 * le plus probable au centre, les suivants de part et d'autre, sans chevauchement. Disposition pure, rendu SVG et canvas.
 */
import type { Candidate } from '../domain/next';

export interface Disc {
  candidate: Candidate | null;
  /** « autre chose » quand `candidate` est null. */
  x: number;
  y: number;
  r: number;
  label: string;
  sub: string;
  /** Rang de probabilité (0 = le plus probable). */
  rank: number;
}

export interface FanLayout {
  width: number;
  height: number;
  /** Centre de l'accord courant (pivot de l'éventail). */
  cx: number;
  cy: number;
  discs: Disc[];
}

export interface FanOptions {
  width: number;
  /** Au plus ce nombre de disques nommés ; le reste est regroupé dans « autre chose ». */
  maxDiscs?: number;
  nameOf: (c: Candidate) => string;
  subOf: (c: Candidate) => string;
  other: number;
}

const radiusFor = (p: number, scale: number) => Math.max(18, Math.min(0.5 * scale, 14 + Math.sqrt(p) * scale * 0.62));

export function layoutFan(candidates: readonly Candidate[], o: FanOptions): FanLayout {
  const width = o.width;
  const scale = Math.max(80, Math.min(130, width / 5.2));
  const R = Math.max(130, Math.min(230, width * 0.36));
  const cx = width / 2;
  const cy = R + scale * 0.62;
  const height = cy + 46;
  const max = o.maxDiscs ?? 9;
  const shown = candidates.slice(0, max);
  const rest = candidates.slice(max).reduce((a, c) => a + c.p, 0) + o.other;
  const items: { candidate: Candidate | null; r: number; rank: number }[] = shown.map((c, i) => ({ candidate: c, r: radiusFor(c.p, scale), rank: i }));
  if (rest > 0.002) items.push({ candidate: null, r: radiusFor(rest, scale) * 0.85, rank: items.length });
  // Ordre sur l'arc : le plus gros au centre, puis en alternance gauche/droite.
  const order: typeof items = [];
  items.forEach((it, i) => (i % 2 === 0 ? order.push(it) : order.unshift(it)));
  // Angles cumulés depuis la gauche, espacement = somme des rayons + marge, puis centrage.
  const gap = 8;
  const angles: number[] = [];
  let acc = 0;
  order.forEach((it, i) => {
    if (i > 0) acc += (order[i - 1]!.r + it.r + gap) / R;
    angles.push(acc);
  });
  // L'arc est centré sur le disque le plus probable (en haut, θ = 3π/2) ; on le resserre s'il déborde du demi-cercle.
  const idx0 = order.findIndex((it) => it.rank === 0);
  const left = angles[idx0]!;
  const right = acc - left;
  const half = (Math.PI / 2) * 0.95;
  const k = Math.min(1, half / Math.max(left, right, 1e-6));
  const discs: Disc[] = order.map((it, i) => {
    const θ = Math.PI * 1.5 + (angles[i]! - left) * k; // de gauche (π) vers la droite (2π), au-dessus du pivot
    return {
      candidate: it.candidate,
      x: cx + R * Math.cos(θ),
      y: cy + R * Math.sin(θ),
      r: it.r * (k < 1 ? Math.max(0.7, k) : 1),
      label: it.candidate ? o.nameOf(it.candidate) : it.r >= 20 ? 'autre chose' : '…',
      sub: it.candidate ? o.subOf(it.candidate) : `${Math.round(rest * 100)} %`,
      rank: it.rank,
    };
  });
  return { width, height, cx, cy, discs };
}

const NS = 'http://www.w3.org/2000/svg';

export interface FanRenderOptions {
  current: string | null;
  currentSub: string | null;
  onPick(c: Candidate): void;
  onHover(c: Candidate | null): void;
}

export function renderFan(svg: SVGSVGElement, layout: FanLayout, o: FanRenderOptions): void {
  svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
  svg.replaceChildren();
  const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent: Element = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    parent.append(e);
    return e;
  };
  // Rayons du pivot vers chaque disque
  for (const d of layout.discs) el('line', { x1: layout.cx, y1: layout.cy, x2: d.x, y2: d.y, class: `fan-ray${d.candidate ? '' : ' fan-ray--other'}` });
  // Le pivot : l'accord courant (ou le départ)
  const pivot = el('g', { class: 'fan-pivot' });
  el('circle', { cx: layout.cx, cy: layout.cy, r: 34 }, pivot);
  const pt = el('text', { x: layout.cx, y: layout.cy - 2, 'text-anchor': 'middle', class: 'fan-pivot-label' }, pivot);
  pt.textContent = o.current ?? 'départ';
  if (o.currentSub) {
    const ps = el('text', { x: layout.cx, y: layout.cy + 14, 'text-anchor': 'middle', class: 'fan-pivot-sub' }, pivot);
    ps.textContent = o.currentSub;
  }
  // Les disques
  for (const d of layout.discs) {
    const g = el('g', { class: `fan-disc${d.candidate ? '' : ' fan-disc--other'} fan-disc--rank-${Math.min(d.rank, 5)}`, tabindex: d.candidate ? 0 : -1, role: d.candidate ? 'button' : 'img' });
    el('circle', { cx: d.x, cy: d.y, r: d.r }, g);
    const t = el('text', { x: d.x, y: d.y - (d.r > 26 ? 2 : 0), 'text-anchor': 'middle', class: 'fan-disc-label' }, g);
    t.textContent = d.label;
    if (d.r > 24) {
      const s = el('text', { x: d.x, y: d.y + 14, 'text-anchor': 'middle', class: 'fan-disc-sub' }, g);
      s.textContent = d.sub;
    }
    const title = el('title', {}, g);
    title.textContent = `${d.label} · ${d.sub}`;
    if (d.candidate) {
      const c = d.candidate;
      g.addEventListener('click', () => o.onPick(c));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          o.onPick(c);
        }
      });
      g.addEventListener('pointerenter', () => o.onHover(c));
      g.addEventListener('pointerleave', () => o.onHover(null));
    }
  }
}

export interface FanColors {
  ray: string;
  disc: string[];
  discText: string;
  other: string;
  pivot: string;
  pivotText: string;
  ink3: string;
}

export function drawFanCanvas(ctx: CanvasRenderingContext2D, layout: FanLayout, current: string, colors: FanColors, fontUi: string, offset = { x: 0, y: 0 }): void {
  ctx.save();
  ctx.translate(offset.x, offset.y);
  ctx.strokeStyle = colors.ray;
  ctx.lineWidth = 1;
  for (const d of layout.discs) {
    ctx.beginPath();
    ctx.moveTo(layout.cx, layout.cy);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const d of layout.discs) {
    ctx.fillStyle = d.candidate ? (colors.disc[Math.min(d.rank, colors.disc.length - 1)] ?? colors.disc[0]!) : colors.other;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = d.candidate && d.rank < 2 ? colors.discText : colors.pivotText;
    ctx.font = `700 ${Math.max(13, d.r * 0.42)}px ${fontUi}`;
    ctx.fillText(d.label, d.x, d.y - (d.r > 26 ? d.r * 0.18 : 0));
    if (d.r > 24) {
      ctx.font = `400 ${Math.max(11, d.r * 0.32)}px ${fontUi}`;
      ctx.fillText(d.sub, d.x, d.y + d.r * 0.32);
    }
  }
  ctx.fillStyle = colors.pivot;
  ctx.beginPath();
  ctx.arc(layout.cx, layout.cy, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.discText;
  ctx.font = `700 18px ${fontUi}`;
  ctx.fillText(current, layout.cx, layout.cy);
  ctx.restore();
}
