/**
 * La carte SVG : secteurs de fonction (cercle), flèches de fond, accords, et le chemin d'une progression
 * (une traînée par pas, une comète qui la parcourt). Les accords glissent d'une disposition à l'autre.
 */
import { arrowPath, BACKGROUND_ARROWS, DIATONIC, FN_LABELS, layoutOf, type Layout, type Point, type View } from '../domain/layout';

const NS = 'http://www.w3.org/2000/svg';
const W = 1000;

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
}

export interface MapOptions {
  nameOf: (label: string) => string;
  onPick: (label: string) => void;
  reducedMotion: boolean;
}

export class ChordMap {
  private layout: Layout;
  private sectors: SVGGElement;
  private arrows: SVGGElement;
  private trail: SVGGElement;
  private nodes = new Map<string, SVGGElement>();
  private moves: [string, string][] = [];
  private animation = 0;
  /** Termine l'animation en cours (trait plein, comète retirée) : un nouveau pas ne laisse jamais un trait à demi tracé. */
  private finish: (() => void) | null = null;

  constructor(
    private svg: SVGSVGElement,
    view: View,
    private opts: MapOptions,
  ) {
    this.layout = layoutOf(view);
    this.sectors = el('g', { class: 'map-sectors' }, svg);
    this.arrows = el('g', { class: 'map-arrows' }, svg);
    this.trail = el('g', { class: 'map-trail' }, svg);
    const nodeLayer = el('g', { class: 'map-nodes' }, svg);
    for (const c of DIATONIC) {
      const g = el('g', { class: `map-node map-node--${c.fn}`, tabindex: 0, role: 'button', 'data-label': c.label }, nodeLayer);
      el('circle', { class: 'map-node-halo' }, g);
      el('circle', { class: 'map-node-disc' }, g);
      el('text', { class: 'map-node-name', 'text-anchor': 'middle' }, g);
      el('text', { class: 'map-node-degree', 'text-anchor': 'middle' }, g).textContent = c.label;
      el('title', {}, g);
      g.addEventListener('click', () => opts.onPick(c.label));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          opts.onPick(c.label);
        }
      });
      this.nodes.set(c.label, g);
    }
    this.place(false);
    this.renameAll();
  }

  private px(p: Point): Point {
    return { x: p.x * W, y: p.y * W };
  }

  private radiusOf(label: string): number {
    const r = this.layout.radius * W;
    return label === 'I' && this.layout.view === 'cercle' ? r * 1.25 : r;
  }

  /** Place les accords (avec glissement si `animate`), puis redessine secteurs, flèches et chemin. */
  private place(animate: boolean) {
    const l = this.layout;
    this.svg.setAttribute('viewBox', `0 0 ${W} ${(l.aspect * W).toFixed(0)}`);
    for (const c of DIATONIC) {
      const g = this.nodes.get(c.label)!;
      const p = this.px(l.positions[c.label]!);
      const r = this.radiusOf(c.label);
      g.classList.toggle('is-gliding', animate && !this.opts.reducedMotion);
      g.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
      g.querySelector('.map-node-disc')!.setAttribute('r', r.toFixed(1));
      g.querySelector('.map-node-halo')!.setAttribute('r', (r + 14).toFixed(1));
      const [name, degree] = g.querySelectorAll('text');
      name!.setAttribute('y', (-r * 0.06).toFixed(1));
      // Les noms longs (« Fa♯ ° », « Si♭ m ») rapetissent pour rester dans le disque.
      name!.style.fontSize = `${(r * (name!.textContent!.length > 4 ? 0.44 : 0.56)).toFixed(1)}px`;
      degree!.setAttribute('y', (r * 0.5).toFixed(1));
      degree!.style.fontSize = `${(r * 0.36).toFixed(1)}px`;
    }
    this.drawSectors();
    this.drawArrows();
    this.redrawTrail();
  }

  setView(view: View) {
    if (view === this.layout.view) return;
    this.layout = layoutOf(view);
    this.place(true);
  }

  /** Les noms changent avec la tonalité. */
  renameAll() {
    for (const c of DIATONIC) {
      const g = this.nodes.get(c.label)!;
      const name = this.opts.nameOf(c.label);
      g.querySelector('.map-node-name')!.textContent = name;
      const r = this.radiusOf(c.label);
      (g.querySelector('.map-node-name') as SVGTextElement).style.fontSize = `${(r * (name.length > 4 ? 0.44 : 0.56)).toFixed(1)}px`;
      g.querySelector('title')!.textContent = `${name} : ${c.label}, ${FN_LABELS[c.fn].name} (${FN_LABELS[c.fn].learned})`;
      g.setAttribute('aria-label', `${name}, degré ${c.label}, ${FN_LABELS[c.fn].name}`);
    }
  }

  private drawSectors() {
    this.sectors.replaceChildren();
    const l = this.layout;
    if (!l.sectors.length) return;
    const c = { x: 0.5 * W, y: 0.5 * W };
    const r0 = 0.15 * W;
    const r1 = 0.445 * W;
    const at = (r: number, deg: number) => ({ x: c.x + r * Math.cos((deg * Math.PI) / 180), y: c.y + r * Math.sin((deg * Math.PI) / 180) });
    for (const s of l.sectors) {
      const from = s.from + 1.5;
      const to = s.to - 1.5;
      const [a, b, d, e] = [at(r1, from), at(r1, to), at(r0, to), at(r0, from)];
      el('path', { class: `map-sector map-sector--${s.fn}`, d: `M${a.x},${a.y} A${r1},${r1} 0 0 1 ${b.x},${b.y} L${d.x},${d.y} A${r0},${r0} 0 0 0 ${e.x},${e.y} Z` }, this.sectors);
      // Étiquette en haut pour la tension, sous le cercle pour les deux autres (les côtés manquent de place).
      const mid = s.fn === 'tension' ? -90 : s.fn === 'repos' ? 64 : 116;
      const p = at(0.478 * W, mid);
      const t = el('text', { class: 'map-sector-label', x: p.x.toFixed(1), y: (p.y + 8).toFixed(1), 'text-anchor': 'middle' }, this.sectors);
      el('tspan', { class: 'map-sector-name' }, t).textContent = FN_LABELS[s.fn].name;
      el('tspan', { class: 'map-sector-learned', dx: 8 }, t).textContent = FN_LABELS[s.fn].learned;
    }
  }

  private arrow(from: string, to: string, cls: string, parent: Element): SVGPathElement {
    const a = this.px(this.layout.positions[from]!);
    const b = this.px(this.layout.positions[to]!);
    const r = Math.max(this.radiusOf(from), this.radiusOf(to));
    const path = arrowPath(a, b, r, this.layout.bend, this.layout.minHop * W);
    const g = el('g', { class: cls }, parent);
    const line = el('path', { class: 'map-arrow-line', d: path.d }, g);
    const head = el('path', { class: 'map-arrow-head', d: 'M0,0 L-18,-8 L-18,8 Z' }, g);
    head.setAttribute('transform', `translate(${path.end.x.toFixed(1)},${path.end.y.toFixed(1)}) rotate(${path.angle.toFixed(1)})`);
    return line;
  }

  private drawArrows() {
    this.arrows.replaceChildren();
    for (const [a, b] of BACKGROUND_ARROWS) this.arrow(a, b, 'map-arrow', this.arrows);
  }

  /** Allume l'accord qui sonne ; `visited` : ceux de la progression. */
  setActive(label: string | null, visited: ReadonlySet<string> = new Set()) {
    for (const [l, g] of this.nodes) {
      g.classList.toggle('is-active', l === label);
      g.classList.toggle('is-visited', visited.has(l) && l !== label);
      g.classList.remove('is-pulse');
      if (l === label && !this.opts.reducedMotion) {
        void (g as unknown as HTMLElement).getBoundingClientRect();
        g.classList.add('is-pulse');
      }
    }
  }

  private settle() {
    cancelAnimationFrame(this.animation);
    this.finish?.();
    this.finish = null;
  }

  clearTrail() {
    this.settle();
    this.moves = [];
    this.trail.replaceChildren();
  }

  private redrawTrail() {
    this.settle();
    this.trail.replaceChildren();
    this.moves.forEach(([a, b], i) => {
      const g = this.arrow(a, b, 'map-step', this.trail).parentElement!;
      g.classList.toggle('is-past', i < this.moves.length - 1);
    });
  }

  /** Dessine un pas du chemin : la traînée se trace pendant `seconds`, une comète la parcourt. */
  drawMove(from: string, to: string, seconds: number, animate = true) {
    if (from === to) return;
    this.settle();
    this.trail.querySelectorAll('.map-step').forEach((g) => g.classList.add('is-past'));
    this.moves.push([from, to]);
    const line = this.arrow(from, to, 'map-step', this.trail);
    if (this.opts.reducedMotion || !animate) return;
    const g = line.parentElement!;
    const head = g.querySelector('.map-arrow-head') as SVGPathElement;
    const length = line.getTotalLength();
    line.style.strokeDasharray = `${length}`;
    line.style.strokeDashoffset = `${length}`;
    head.style.opacity = '0';
    const comet = el('g', { class: 'map-comet' }, this.trail);
    el('circle', { r: 22, class: 'map-comet-glow' }, comet);
    el('circle', { r: 9, class: 'map-comet-core' }, comet);
    const duration = Math.min(700, seconds * 1000 * 0.7);
    const start = performance.now();
    this.finish = () => {
      line.style.strokeDasharray = '';
      line.style.strokeDashoffset = '';
      head.style.opacity = '';
      comet.remove();
    };
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      const p = line.getPointAtLength(e * length);
      comet.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`);
      line.style.strokeDashoffset = `${(1 - e) * length}`;
      if (t < 1) this.animation = requestAnimationFrame(tick);
      else this.settle();
    };
    this.animation = requestAnimationFrame(tick);
  }
}
