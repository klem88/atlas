/**
 * Dessin du Tonnetz à plat sur un canvas 2D : la mosaïque de triangles (majeurs pointe en haut, mineurs pointe en bas),
 * les noms de notes aux nœuds, les accords visités, le chemin (traîne parcourue, suite en filigrane, tête à l'accent)
 * et les anneaux des accords ramenés à une triade voisine. Pur : sert à la page et à l'image d'aperçu (canvas Node).
 */
import { nodeXY, nodesInView, rootOfInstance, triadAt, triangleOf, type PlanePoint } from '../domain/plane';
import type { Triad } from '../domain/tonnetz';

export interface PlaneView {
  /** Centre de la fenêtre, en unités du plan. */
  cx: number;
  cy: number;
  /** Pixels par unité. */
  scale: number;
  width: number;
  height: number;
}

export interface PlaneColors {
  background: string;
  major: string;
  minor: string;
  visited: string;
  current: string;
  edge: string;
  node: string;
  label: string;
  labelStrong: string;
  trail: string;
  ahead: string;
  accent: string;
}

export interface PlaneDrawing {
  path: readonly PlanePoint[];
  /** Indice du dernier point parcouru (−1 : rien). */
  head: number;
  /** Indices des points dont l'accord a été ramené à une triade voisine. */
  rings: ReadonlySet<number>;
  fontUi: string;
  /** « b » et « # » au lieu de ♭ et ♯ (polices sans ces glyphes, image d'aperçu). */
  ascii?: boolean;
}

const NAMES = ['do', 'ré♭', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
const NAMES_ASCII = ['do', 'réb', 'ré', 'mib', 'mi', 'fa', 'fa#', 'sol', 'lab', 'la', 'sib', 'si'];
const triadLabel = (t: Triad, names: readonly string[]) => (t.mode === 'maj' ? names[t.root]!.toUpperCase() : names[t.root]!);

export function toScreen(view: PlaneView, p: { x: number; y: number }): [number, number] {
  return [view.width / 2 + (p.x - view.cx) * view.scale, view.height / 2 + (p.y - view.cy) * view.scale];
}

export function drawPlane(ctx: CanvasRenderingContext2D, view: PlaneView, d: PlaneDrawing, c: PlaneColors): void {
  ctx.save();
  ctx.fillStyle = c.background;
  ctx.fillRect(0, 0, view.width, view.height);
  const halfW = view.width / 2 / view.scale;
  const halfH = view.height / 2 / view.scale;
  const win = { x0: view.cx - halfW, x1: view.cx + halfW, y0: view.cy - halfH, y1: view.cy + halfH };
  const names = d.ascii ? NAMES_ASCII : NAMES;
  // Instances visitées : clé = nœud de fondamentale et mode (une copie du motif, pas toutes).
  const keyOf = (p: PlanePoint) => {
    const r = rootOfInstance(p.triad, p.a, p.b);
    return `${r.a},${r.b},${p.triad.mode}`;
  };
  const visited = new Map<string, number>();
  d.path.forEach((p, i) => {
    if (i <= d.head) visited.set(keyOf(p), i);
  });
  const headKey = d.head >= 0 && d.path[d.head] ? keyOf(d.path[d.head]!) : '';
  const S = (a: number, b: number) => toScreen(view, nodeXY(a, b));

  // Triangles
  ctx.lineWidth = 1;
  ctx.strokeStyle = c.edge;
  for (const n of nodesInView(win)) {
    for (const mode of ['maj', 'min'] as const) {
      const t = triadAt(n.a, n.b, mode);
      const idx = `${n.a},${n.b},${mode}`;
      const tri = triangleOf(t, n.a, n.b).map(([a, b]) => S(a, b));
      ctx.beginPath();
      ctx.moveTo(tri[0]![0], tri[0]![1]);
      ctx.lineTo(tri[1]![0], tri[1]![1]);
      ctx.lineTo(tri[2]![0], tri[2]![1]);
      ctx.closePath();
      ctx.fillStyle = idx === headKey ? c.current : visited.has(idx) ? c.visited : mode === 'maj' ? c.major : c.minor;
      ctx.fill();
      ctx.stroke();
    }
  }
  // Nœuds et noms de notes
  const fontPx = Math.max(9, Math.min(14, view.scale * 0.17));
  ctx.font = `500 ${fontPx}px ${d.fontUi}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const n of nodesInView(win, 0.6)) {
    const [x, y] = S(n.a, n.b);
    ctx.fillStyle = c.background;
    ctx.beginPath();
    ctx.arc(x, y, fontPx * 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.node;
    ctx.fillText(names[n.pc]!, x, y + 0.5);
  }
  // Étiquettes des accords visités
  ctx.font = `700 ${Math.max(10, Math.min(15, view.scale * 0.2))}px ${d.fontUi}`;
  for (const [idx, i] of visited) {
    const p = d.path[i]!;
    const [x, y] = toScreen(view, p);
    ctx.fillStyle = idx === headKey ? c.accent : c.labelStrong;
    ctx.fillText(triadLabel(p.triad, names), x, y + (p.triad.mode === 'maj' ? view.scale * 0.1 : -view.scale * 0.1));
  }
  // Chemin : à venir en filigrane, parcouru en traîne
  const pts = d.path.map((p) => toScreen(view, p));
  const stroke = (from: number, to: number, color: string, width: number, alpha: number) => {
    if (to <= from) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[from]![0], pts[from]![1]);
    for (let i = from + 1; i <= to; i++) {
      const [x0, y0] = pts[i - 1]!;
      const [x1, y1] = pts[i]!;
      // Un léger arc pour distinguer l'aller du retour entre deux mêmes accords.
      const mx = (x0 + x1) / 2 - (y1 - y0) * 0.12;
      const my = (y0 + y1) / 2 + (x1 - x0) * 0.12;
      ctx.quadraticCurveTo(mx, my, x1, y1);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  stroke(Math.max(0, d.head), pts.length - 1, c.ahead, Math.max(2, view.scale * 0.05), 0.55);
  stroke(0, d.head, c.background, Math.max(5, view.scale * 0.11), 1);
  stroke(0, d.head, c.trail, Math.max(3, view.scale * 0.07), 1);
  // Anneaux des accords approchés
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = c.accent;
  for (const i of d.rings) {
    const p = pts[i];
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p[0], p[1], Math.max(6, view.scale * 0.16), 0, Math.PI * 2);
    ctx.stroke();
  }
  // Départ et tête
  if (pts.length) {
    const [sx, sy] = pts[0]!;
    ctx.fillStyle = c.trail;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(3, view.scale * 0.06), 0, Math.PI * 2);
    ctx.fill();
  }
  if (d.head >= 0 && pts[d.head]) {
    const [hx, hy] = pts[d.head]!;
    ctx.fillStyle = c.background;
    ctx.beginPath();
    ctx.arc(hx, hy, Math.max(8, view.scale * 0.15), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.arc(hx, hy, Math.max(6, view.scale * 0.11), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Fenêtre de départ : une échelle confortable (une case ≈ un pouce), centrée sur les premiers accords du chemin. */
export function fitView(path: readonly PlanePoint[], width: number, height: number): PlaneView {
  const scale = Math.max(44, Math.min(80, width / 8.5));
  if (!path.length) return { cx: 1, cy: -0.5, scale, width, height };
  const head = path.slice(0, 6);
  const cx = head.reduce((a, p) => a + p.x, 0) / head.length;
  const cy = head.reduce((a, p) => a + p.y, 0) / head.length;
  return { cx, cy, scale, width, height };
}
