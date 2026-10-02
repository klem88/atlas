/**
 * La carte SVG, dessinée d'après une `Scene` : secteurs de fonction (cercle), fenêtre de la tonalité (bande),
 * flèches de fond, disques, et le chemin d'une progression (une traînée par pas, une comète qui la parcourt).
 * Les disques sont identifiés par l'accord réel : d'une scène à l'autre, un accord présent des deux côtés glisse
 * à sa nouvelle place (et son degré se réécrit), les autres s'effacent ou apparaissent.
 */
import { arrowPath, FN_LABELS } from '../domain/layout';
import type { Rect, Scene, SceneNode } from '../domain/scene';

const NS = 'http://www.w3.org/2000/svg';
const W = 1000;

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
}

export interface MapOptions {
  onPick: (node: SceneNode) => void;
  onDoor: (tonic: number) => void;
  reducedMotion: boolean;
}

export class ChordMap {
  private scene: Scene | null = null;
  private sectors: SVGGElement;
  private windows: SVGGElement;
  private arrows: SVGGElement;
  private trail: SVGGElement;
  private nodeLayer: SVGGElement;
  private nodes = new Map<string, SVGGElement>();
  private specs = new Map<string, SceneNode>();
  private moves: [string, string][] = [];
  private animation = 0;
  /** Termine l'animation en cours (trait plein, comète retirée) : un nouveau pas ne laisse jamais un trait à demi tracé. */
  private finish: (() => void) | null = null;

  constructor(
    private svg: SVGSVGElement,
    private opts: MapOptions,
  ) {
    this.sectors = el('g', { class: 'map-sectors' }, svg);
    this.windows = el('g', { class: 'map-windows' }, svg);
    this.arrows = el('g', { class: 'map-arrows' }, svg);
    this.trail = el('g', { class: 'map-trail' }, svg);
    this.nodeLayer = el('g', { class: 'map-nodes' }, svg);
  }

  get current(): Scene | null {
    return this.scene;
  }

  /** Dessine une scène ; avec `animate`, les accords communs glissent depuis leur place précédente. */
  render(scene: Scene, animate: boolean) {
    const glide = animate && !this.opts.reducedMotion;
    const changedFrame = !this.scene || this.scene.view !== scene.view || this.scene.aspect !== scene.aspect;
    this.scene = scene;
    this.svg.setAttribute('viewBox', `0 0 ${W} ${(scene.aspect * W).toFixed(0)}`);
    this.svg.classList.toggle('map--bande', scene.view === 'bande');
    this.drawSectors();
    this.drawWindows();

    const seen = new Set<string>();
    for (const spec of scene.nodes) {
      seen.add(spec.id);
      const previous = this.specs.get(spec.id);
      let g = this.nodes.get(spec.id);
      const entering = !g;
      if (!g) g = this.createNode(spec.id);
      this.specs.set(spec.id, spec);
      g.setAttribute('class', `map-node map-node--${spec.kind}${spec.fn ? ` map-node--${spec.fn}` : ''}`);
      g.classList.toggle('is-gliding', glide && !entering && !changedFrame);
      g.style.transform = `translate(${(spec.x * W).toFixed(1)}px, ${(spec.y * W).toFixed(1)}px)`;
      this.fillNode(g, spec);
      if (glide && previous && previous.sub !== spec.sub) {
        g.classList.add('is-relabel');
        setTimeout(() => g!.classList.remove('is-relabel'), 900);
      }
      if (entering && glide) {
        g.classList.add('is-entering');
        requestAnimationFrame(() => requestAnimationFrame(() => g!.classList.remove('is-entering')));
      }
    }
    for (const [id, g] of this.nodes) {
      if (seen.has(id)) continue;
      this.nodes.delete(id);
      this.specs.delete(id);
      if (glide) {
        g.classList.add('is-leaving');
        g.style.pointerEvents = 'none';
        setTimeout(() => g.remove(), 500);
      } else g.remove();
    }
    this.drawArrows();
    this.redrawTrail();
  }

  private createNode(id: string): SVGGElement {
    const g = el('g', { tabindex: 0, role: 'button', 'data-id': id }, this.nodeLayer);
    el('circle', { class: 'map-node-halo' }, g);
    el('circle', { class: 'map-node-disc' }, g);
    el('text', { class: 'map-node-name', 'text-anchor': 'middle' }, g);
    el('text', { class: 'map-node-sub', 'text-anchor': 'middle' }, g);
    el('title', {}, g);
    const pick = () => {
      const spec = this.specs.get(id);
      if (!spec) return;
      if (spec.door !== null) this.opts.onDoor(spec.door);
      else this.opts.onPick(spec);
    };
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick();
      }
    });
    this.nodes.set(id, g);
    return g;
  }

  private fillNode(g: SVGGElement, spec: SceneNode) {
    const r = spec.r * W;
    g.querySelector('.map-node-disc')!.setAttribute('r', r.toFixed(1));
    g.querySelector('.map-node-halo')!.setAttribute('r', (r + 12).toFixed(1));
    const [name, sub] = g.querySelectorAll('text');
    name!.textContent = spec.name;
    name!.setAttribute('y', (spec.sub ? -r * 0.06 : r * 0.2).toFixed(1));
    name!.style.fontSize = `${(r * (spec.name.length > 4 ? 0.44 : 0.56)).toFixed(1)}px`;
    sub!.textContent = spec.sub;
    sub!.setAttribute('y', (r * 0.5).toFixed(1));
    sub!.style.fontSize = `${(r * 0.36).toFixed(1)}px`;
    const what =
      spec.kind === 'porte'
        ? `Passer en ${spec.name} majeur`
        : spec.kind === 'diatonique' && spec.fn
          ? `${spec.name} : ${spec.sub}, ${FN_LABELS[spec.fn].name} (${FN_LABELS[spec.fn].learned})`
          : spec.kind === 'voisin'
            ? `${spec.name} : ${spec.sub}, voisin de la tonalité`
            : `${spec.name} : hors de la tonalité`;
    g.querySelector('title')!.textContent = what;
    g.setAttribute('aria-label', what);
  }

  private drawSectors() {
    this.sectors.replaceChildren();
    const s = this.scene!;
    if (!s.sectors.length) return;
    const c = { x: 0.5 * W, y: 0.5 * W };
    const [r0, r1] = [s.sectorRadii[0] * W, s.sectorRadii[1] * W];
    const at = (r: number, deg: number) => ({ x: c.x + r * Math.cos((deg * Math.PI) / 180), y: c.y + r * Math.sin((deg * Math.PI) / 180) });
    for (const sec of s.sectors) {
      const from = sec.from + 1.5;
      const to = sec.to - 1.5;
      const [a, b, d, e] = [at(r1, from), at(r1, to), at(r0, to), at(r0, from)];
      el('path', { class: `map-sector map-sector--${sec.fn}`, d: `M${a.x},${a.y} A${r1},${r1} 0 0 1 ${b.x},${b.y} L${d.x},${d.y} A${r0},${r0} 0 0 0 ${e.x},${e.y} Z` }, this.sectors);
      // Étiquette en haut pour la tension, sous le cercle pour les deux autres (les côtés manquent de place).
      const mid = sec.fn === 'tension' ? -90 : sec.fn === 'repos' ? 64 : 116;
      const p = at(0.478 * W, mid);
      // Un voisin posé dessus : l'étiquette s'efface (le secteur reste lisible à sa couleur).
      if (s.nodes.some((n) => n.kind !== 'diatonique' && Math.hypot(n.x * W - p.x, n.y * W - p.y) < 150)) continue;
      const t = el('text', { class: 'map-sector-label', x: p.x.toFixed(1), y: (p.y + 8).toFixed(1), 'text-anchor': 'middle' }, this.sectors);
      el('tspan', { class: 'map-sector-name' }, t).textContent = FN_LABELS[sec.fn].name;
      el('tspan', { class: 'map-sector-learned', dx: 8 }, t).textContent = FN_LABELS[sec.fn].learned;
    }
  }

  private rect(r: Rect, cls: string, parent: Element): SVGRectElement {
    return el('rect', { class: cls, x: (r.x * W).toFixed(1), y: (r.y * W).toFixed(1), width: (r.w * W).toFixed(1), height: (r.h * W).toFixed(1), rx: 18 }, parent);
  }

  private drawWindows() {
    this.windows.replaceChildren();
    const s = this.scene!;
    if (!s.window) return;
    this.rect(s.window, 'map-window', this.windows);
    if (s.windowName) el('text', { class: 'map-window-label', x: ((s.window.x + s.window.w / 2) * W).toFixed(1), y: ((s.window.y + s.window.h) * W + 34).toFixed(1), 'text-anchor': 'middle' }, this.windows).textContent = s.windowName;
    for (const gw of s.ghostWindows) {
      const g = el('g', { class: 'map-ghost', tabindex: 0, role: 'button', 'aria-label': `Passer en ${gw.name}` }, this.windows);
      this.rect(gw, 'map-ghost-rect', g);
      // Au-dessus de la bande, chacune de son côté : côté bémols à gauche, côté dièses à droite.
      const left = gw.side < 0;
      el('text', { class: 'map-ghost-label', x: ((left ? gw.x : gw.x + gw.w) * W).toFixed(1), y: (gw.y * W - 14).toFixed(1), 'text-anchor': left ? 'start' : 'end' }, g).textContent = left ? `← ${gw.name}` : `${gw.name} →`;
      g.addEventListener('click', () => this.opts.onDoor(gw.tonic));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.opts.onDoor(gw.tonic);
        }
      });
    }
  }

  private arrow(from: string, to: string, cls: string, parent: Element): SVGPathElement | null {
    const a = this.specs.get(from);
    const b = this.specs.get(to);
    if (!a || !b) return null;
    const s = this.scene!;
    const path = arrowPath({ x: a.x * W, y: a.y * W }, { x: b.x * W, y: b.y * W }, a.r * W, s.bend, s.minHop * W, b.r * W);
    const g = el('g', { class: cls }, parent);
    const line = el('path', { class: 'map-arrow-line', d: path.d }, g);
    const head = el('path', { class: 'map-arrow-head', d: 'M0,0 L-18,-8 L-18,8 Z' }, g);
    head.setAttribute('transform', `translate(${path.end.x.toFixed(1)},${path.end.y.toFixed(1)}) rotate(${path.angle.toFixed(1)})`);
    return line;
  }

  private drawArrows() {
    this.arrows.replaceChildren();
    for (const [a, b] of this.scene!.arrows) this.arrow(a, b, 'map-arrow', this.arrows);
  }

  /** Allume l'accord qui sonne ; `visited` : ceux de la progression. */
  setActive(id: string | null, visited: ReadonlySet<string> = new Set()) {
    for (const [nid, g] of this.nodes) {
      g.classList.toggle('is-active', nid === id);
      g.classList.toggle('is-visited', visited.has(nid) && nid !== id);
      g.classList.remove('is-pulse');
      if (nid === id && !this.opts.reducedMotion) {
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
    this.moves = this.moves.filter(([a, b]) => this.specs.has(a) && this.specs.has(b));
    this.moves.forEach(([a, b], i) => {
      const line = this.arrow(a, b, 'map-step', this.trail);
      line?.parentElement!.classList.toggle('is-past', i < this.moves.length - 1);
    });
  }

  /** Dessine un pas du chemin : la traînée se trace pendant `seconds`, une comète la parcourt. */
  drawMove(from: string, to: string, seconds: number, animate = true) {
    if (from === to) return;
    this.settle();
    this.trail.querySelectorAll('.map-step').forEach((g) => g.classList.add('is-past'));
    const line = this.arrow(from, to, 'map-step', this.trail);
    if (!line) return;
    this.moves.push([from, to]);
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
