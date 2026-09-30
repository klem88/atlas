/**
 * Géométrie du fleuve : deux colonnes de nœuds empilés, des rubans entre elles. Pure : sert au SVG de la page
 * et au canvas de l'image de partage.
 */
import type { Flow, FlowLink, FlowNode } from '../domain/flow';

export interface NodeBox extends FlowNode {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Ribbon extends FlowLink {
  /** Bords gauche et droit : haut et bas du ruban à chaque extrémité. */
  x0: number;
  y0a: number;
  y0b: number;
  x1: number;
  y1a: number;
  y1b: number;
}

export interface RiverLayout {
  width: number;
  height: number;
  left: NodeBox[];
  right: NodeBox[];
  ribbons: Ribbon[];
}

export interface RiverOptions {
  width: number;
  height: number;
  nodeWidth?: number;
  gap?: number;
  /** Marge horizontale de chaque côté pour les étiquettes. */
  labelSpace?: number;
  padTop?: number;
  padBottom?: number;
}

export function layoutRiver(flow: Flow, o: RiverOptions): RiverLayout {
  const nodeWidth = o.nodeWidth ?? 10;
  const gap = o.gap ?? 6;
  const labelSpace = o.labelSpace ?? 56;
  const padTop = o.padTop ?? 6;
  const padBottom = o.padBottom ?? 6;
  const inner = o.height - padTop - padBottom;
  const stack = (nodes: FlowNode[], x: number): NodeBox[] => {
    const total = nodes.reduce((a, n) => a + n.value, 0) || 1;
    const usable = inner - gap * Math.max(0, nodes.length - 1);
    let y = padTop;
    return nodes.map((n) => {
      const h = Math.max(1.5, (n.value / total) * usable);
      const box = { ...n, x, y, w: nodeWidth, h };
      y += h + gap;
      return box;
    });
  };
  const left = stack(flow.left, labelSpace);
  const right = stack(flow.right, o.width - labelSpace - nodeWidth);
  const scaleOf = (boxes: NodeBox[]) => {
    const total = boxes.reduce((a, b) => a + b.value, 0) || 1;
    const usable = inner - gap * Math.max(0, boxes.length - 1);
    return usable / total;
  };
  const sl = scaleOf(left);
  const sr = scaleOf(right);
  const offL = new Map(left.map((b) => [b.token, b.y]));
  const offR = new Map(right.map((b) => [b.token, b.y]));
  // Ordre des rubans : par nœud de gauche puis par position du nœud d'arrivée, pour limiter les croisements.
  const rightIndex = new Map(right.map((b, i) => [b.token, i]));
  const leftIndex = new Map(left.map((b, i) => [b.token, i]));
  const ordered = [...flow.links].sort((p, q) => (leftIndex.get(p.from) ?? 0) - (leftIndex.get(q.from) ?? 0) || (rightIndex.get(p.to) ?? 0) - (rightIndex.get(q.to) ?? 0));
  const ribbons: Ribbon[] = [];
  for (const l of ordered) {
    const y0 = offL.get(l.from);
    const y1 = offR.get(l.to);
    if (y0 === undefined || y1 === undefined) continue;
    const h0 = l.value * sl;
    const h1 = l.value * sr;
    ribbons.push({ ...l, x0: left[0]!.x + nodeWidth, y0a: y0, y0b: y0 + h0, x1: right[0]!.x, y1a: y1, y1b: y1 + h1 });
    offL.set(l.from, y0 + h0);
  }
  // Côté droit, les rubans se rangent par ordre du nœud de gauche.
  const byRight = [...ribbons].sort((p, q) => (rightIndex.get(p.to) ?? 0) - (rightIndex.get(q.to) ?? 0) || (leftIndex.get(p.from) ?? 0) - (leftIndex.get(q.from) ?? 0));
  for (const r of byRight) {
    const y1 = offR.get(r.to)!;
    const h1 = r.y1b - r.y1a;
    r.y1a = y1;
    r.y1b = y1 + h1;
    offR.set(r.to, y1 + h1);
  }
  return { width: o.width, height: o.height, left, right, ribbons };
}

/** Chemin SVG d'un ruban (deux courbes cubiques). */
export function ribbonPath(r: Ribbon): string {
  const cx = (r.x0 + r.x1) / 2;
  return `M${r.x0},${r.y0a}C${cx},${r.y0a} ${cx},${r.y1a} ${r.x1},${r.y1a}L${r.x1},${r.y1b}C${cx},${r.y1b} ${cx},${r.y0b} ${r.x0},${r.y0b}Z`;
}
