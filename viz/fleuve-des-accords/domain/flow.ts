/**
 * Du tableau des transitions au fleuve : les degrés de départ à gauche (dix au plus, le reste dans « autres »),
 * les arrivées à droite, et les courants entre les deux. Parts, phrases de comparaison. Fonctions pures.
 */
import { degreeLabel, tokenToDegree } from '@shell/music/degrees';
import type { StyleAgg } from '../data/contract';

export const OTHER = -1;
export const MAX_DEPARTURES = 10;
export const MAX_ARRIVALS = 10;

export interface FlowNode {
  /** Jeton, ou `OTHER`. */
  token: number;
  label: string;
  value: number;
}

export interface FlowLink {
  from: number;
  to: number;
  value: number;
  /** Part parmi les transitions qui partent du même degré (0–1). */
  share: number;
}

export interface Flow {
  left: FlowNode[];
  right: FlowNode[];
  links: FlowLink[];
  total: number;
}

export const labelOf = (t: number) => (t === OTHER ? 'autres' : degreeLabel(tokenToDegree(t)));

/** Les jetons de départ les plus fréquents, par volume sortant décroissant. */
export function topTokens(agg: StyleAgg, side: 0 | 1, max: number): number[] {
  const totals = new Map<number, number>();
  for (const r of agg.rows) totals.set(r[side], (totals.get(r[side]) ?? 0) + r[2]);
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([t]) => t);
}

/**
 * Construit le fleuve d'un agrégat. `from` restreint aux transitions qui partent d'un degré (les autres départs
 * restent dessinés en filigrane par l'interface, mais les parts sont celles de ce départ).
 */
export function buildFlow(agg: StyleAgg, opts: { from?: number | null; maxLeft?: number; maxRight?: number } = {}): Flow {
  const left = topTokens(agg, 0, opts.maxLeft ?? MAX_DEPARTURES);
  const right = topTokens(agg, 1, opts.maxRight ?? MAX_ARRIVALS);
  const L = new Set(left);
  const R = new Set(right);
  const linkMap = new Map<string, FlowLink>();
  const outTotal = new Map<number, number>();
  let total = 0;
  for (const [a, b, n] of agg.rows) {
    const fa = L.has(a) ? a : OTHER;
    const fb = R.has(b) ? b : OTHER;
    const k = `${fa}:${fb}`;
    const link = linkMap.get(k) ?? { from: fa, to: fb, value: 0, share: 0 };
    link.value += n;
    linkMap.set(k, link);
    outTotal.set(fa, (outTotal.get(fa) ?? 0) + n);
    total += n;
  }
  for (const l of linkMap.values()) l.share = l.value / (outTotal.get(l.from) ?? 1);
  const links = [...linkMap.values()].sort((x, y) => y.value - x.value);
  const inTotal = new Map<number, number>();
  for (const l of links) inTotal.set(l.to, (inTotal.get(l.to) ?? 0) + l.value);
  const node = (t: number, v: number): FlowNode => ({ token: t, label: labelOf(t), value: v });
  const leftNodes = [...left, OTHER].map((t) => node(t, outTotal.get(t) ?? 0)).filter((n) => n.value > 0);
  const rightNodes = [...right, OTHER].map((t) => node(t, inTotal.get(t) ?? 0)).filter((n) => n.value > 0);
  return { left: leftNodes, right: rightNodes, links, total };
}

/** Les arrivées depuis un degré, en parts décroissantes (toutes, pas seulement les dix). */
export function arrivalsFrom(agg: StyleAgg, from: number): { token: number; label: string; count: number; share: number }[] {
  const rows = agg.rows.filter((r) => r[0] === from);
  const total = rows.reduce((a, r) => a + r[2], 0);
  return rows.map((r) => ({ token: r[1], label: labelOf(r[1]), count: r[2], share: total ? r[2] / total : 0 })).sort((a, b) => b.count - a.count);
}

/** « une fois sur deux », « une fois sur trois », « deux fois sur trois », sinon un pourcentage. */
export function oddsWords(share: number): string {
  if (share >= 0.95) return 'presque toujours';
  const fractions: [number, string][] = [
    [0.9, 'neuf fois sur dix'],
    [0.8, 'quatre fois sur cinq'],
    [0.75, 'trois fois sur quatre'],
    [2 / 3, 'deux fois sur trois'],
    [0.6, 'trois fois sur cinq'],
    [0.5, 'une fois sur deux'],
    [0.4, 'deux fois sur cinq'],
    [1 / 3, 'une fois sur trois'],
    [0.25, 'une fois sur quatre'],
    [0.2, 'une fois sur cinq'],
    [1 / 6, 'une fois sur six'],
    [1 / 8, 'une fois sur huit'],
    [0.1, 'une fois sur dix'],
  ];
  let best: [number, string] | null = null;
  for (const f of fractions) if (!best || Math.abs(f[0] - share) < Math.abs(best[0] - share)) best = f;
  if (best && Math.abs(best[0] - share) <= 0.035) return best[1];
  return `${Math.round(share * 100)} % du temps`;
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

/** La phrase de comparaison : « Après un V, la pop retourne au I une fois sur deux. Le jazz, une fois sur trois. » */
export function compareSentence(a: StyleAgg, b: StyleAgg | null, from: number): string {
  const fromLabel = labelOf(from);
  const arrA = arrivalsFrom(a, from);
  if (arrA.length === 0) return `Dans ${a.label}, le ${fromLabel} est trop rare pour dire où il va.`;
  const top = arrA[0]!;
  let s = `Après un ${fromLabel}, ${a.label} va au ${top.label} ${oddsWords(top.share)}`;
  if (arrA[1]) s += `, au ${arrA[1].label} ${pct(arrA[1].share)} du temps`;
  s += '.';
  if (b) {
    const arrB = arrivalsFrom(b, from);
    const same = arrB.find((x) => x.token === top.token);
    const topB = arrB[0];
    if (!topB) s += ` ${cap(b.label)} : trop peu de ${fromLabel} pour comparer.`;
    else if (same && topB.token === top.token) s += ` ${cap(b.label)} : ${oddsWords(same.share)}.`;
    else if (same) s += ` ${cap(b.label)} préfère le ${topB.label} (${pct(topB.share)}) ; le ${top.label}, ${oddsWords(same.share)}.`;
    else s += ` ${cap(b.label)} préfère le ${topB.label} (${pct(topB.share)}).`;
  }
  return s;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
