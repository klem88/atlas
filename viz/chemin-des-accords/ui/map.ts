/**
 * La carte SVG : secteurs de fonction, anneau des tonalités, halos (les possibilités), traînée (le chemin), disques.
 * Les disques sont identifiés par l'accord réel : à une modulation, un accord commun glisse à sa nouvelle place
 * (transition CSS sur `transform`), et son degré se réécrit.
 */
import { chordId, diatonicChords, fifthsOffset, keyName, nameOf, roleOf, type Chord } from '../../suis-les-fleches/domain/harmony';
import { arrowPath, FN_LABELS, layoutOf, type Point } from '../../suis-les-fleches/domain/layout';
import { roleText } from '../../suis-les-fleches/domain/moves';
import { arcPath, CHORD_RING, DISK, diatonicPoint, HOME_ARC, homeArc, KEY_RING, keyAngle, polar, SAT_DISK, satellitePoints, TONIC_DISK } from '../domain/geometry';
import type { Candidate } from '../domain/halos';
import { haloTip, pct, RING_TIP } from '../domain/notes';
import { guideOf, type Route } from '../domain/route';

const NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
}

export interface MapView {
  key: number;
  home: number;
  leaning: number | null;
  /** Rotation de l'anneau (degrés), cumulée par la page pour tourner par le plus court chemin. */
  rotation: number;
  current: Chord | null;
  candidates: Candidate[];
  /** Les derniers accords joués dans la tonalité du moment, du plus ancien au plus récent. */
  trail: Chord[];
  /** La route vers la destination (choisie, ou celle vers laquelle on penche), ou rien. */
  route: Route | null;
}

export interface MapOptions {
  onPick: (c: Chord) => void;
  onHover: (c: Chord | null) => void;
  /** Toucher une tonalité de l’anneau : en faire la destination. */
  onKey: (tonic: number) => void;
  reducedMotion: boolean;
}

interface Spot {
  chord: Chord;
  p: Point;
  r: number;
  label: string;
  kind: string;
}

const KEYS = Array.from({ length: 12 }, (_, i) => (i * 7) % 12);
const SECTOR_SCALE = CHORD_RING / 310;

export class ChordMap {
  private ring: SVGGElement;
  private ringLabels = new Map<number, SVGGElement>();
  private arc: SVGPathElement;
  private routeArc: SVGPathElement;
  private halos: SVGGElement;
  private trail: SVGGElement;
  private previewLayer: SVGGElement;
  private nodeLayer: SVGGElement;
  private pcts: SVGGElement;
  private sectorNames: SVGTextElement[] = [];
  private nodes = new Map<string, SVGGElement>();
  private spots = new Map<string, Spot>();
  private view: MapView | null = null;

  constructor(
    private svg: SVGSVGElement,
    private opts: MapOptions,
  ) {
    // Deux têtes de flèche : ardoise pour le chemin ancien, accent pour le dernier pas, l'aperçu et l'arc de la maison.
    const defs = el('defs', {}, svg);
    for (const [id, cls] of [
      ['map-head', 'map-head'],
      ['map-head-accent', 'map-head map-head--accent'],
    ] as const) {
      const m = el('marker', { id, viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto', markerUnits: 'strokeWidth' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', class: cls }, m);
    }
    this.drawSectors(el('g', { class: 'map-sectors' }, svg));
    this.ring = el('g', { class: 'map-ring', 'data-tip': RING_TIP }, svg);
    this.arc = el('path', { class: 'map-home-arc' }, this.ring);
    this.routeArc = el('path', { class: 'map-route-arc' }, this.ring);
    for (const t of KEYS) {
      const a = polar(KEY_RING, keyAngle(t));
      const g = el('g', { class: 'ring-key', transform: `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`, tabindex: 0, role: 'button', 'aria-label': `Aller vers ${keyName(t)}` }, this.ring);
      g.addEventListener('click', () => this.opts.onKey(t));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.opts.onKey(t);
        }
      });
      el('circle', { class: 'ring-key-mark', r: 30 }, g);
      el('text', { class: 'ring-key-name', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g).textContent = nameOf({ root: t, cls: 'maj' });
      this.ringLabels.set(t, g);
    }
    this.halos = el('g', { class: 'map-halos' }, svg);
    this.trail = el('g', { class: 'map-trail' }, svg);
    this.previewLayer = el('g', { class: 'map-preview' }, svg);
    this.nodeLayer = el('g', { class: 'map-nodes' }, svg);
    this.pcts = el('g', { class: 'map-pcts' }, svg);
  }

  private drawSectors(g: SVGGElement) {
    const l = layoutOf('cercle');
    const [r0, r1] = l.sectorRadii.map((r) => r * 1000 * SECTOR_SCALE) as [number, number];
    for (const s of l.sectors) {
      const a = polar(r1, s.from + 2);
      const b = polar(r1, s.to - 2);
      const c = polar(r0, s.to - 2);
      const d = polar(r0, s.from + 2);
      el('path', { class: `map-sector map-sector--${s.fn}`, d: `M${a.x},${a.y} A${r1},${r1} 0 0 1 ${b.x},${b.y} L${c.x},${c.y} A${r0},${r0} 0 0 0 ${d.x},${d.y} Z` }, g);
      const mid = polar(r1 + 18, (s.from + s.to) / 2);
      const name = el('text', { class: 'map-sector-name', x: mid.x, y: mid.y, 'text-anchor': 'middle' }, g);
      name.textContent = FN_LABELS[s.fn].name;
      this.sectorNames.push(name);
    }
  }

  /** Où chaque accord se trouve dans la tonalité du moment. */
  private layout(v: MapView): Map<string, Spot> {
    const out = new Map<string, Spot>();
    for (const { chord, role } of diatonicChords(v.key))
      out.set(chordId(chord), { chord, p: diatonicPoint(role.label), r: role.label === 'I' ? TONIC_DISK : DISK, label: role.label, kind: `diatonique map-node--${role.fn}` });
    // Au plus quatre satellites, par priorité : l'accord du moment, l'accord précédent (pour que la flèche du dernier pas reste
    // dessinée), puis les candidats de plus forte part.
    const outside: { chord: Chord; label: string; anchor: string | null }[] = [];
    const add = (chord: Chord, label: string, anchor: string | null) => {
      if (outside.length < 4 && !out.has(chordId(chord)) && !outside.some((o) => chordId(o.chord) === chordId(chord))) outside.push({ chord, label, anchor });
    };
    const extra = (c: Chord) => {
      const r = roleOf(c, v.key);
      const cand = v.candidates.find((x) => chordId(x.chord) === chordId(c));
      add(c, cand?.label ?? r.label, cand ? cand.anchor : r.anchor);
    };
    if (v.current) extra(v.current);
    const previous = v.trail[v.trail.length - 2];
    if (previous) extra(previous);
    // Les accords de la route (ceux qui mènent à l’étape) passent avant les candidats ; ils se posent près de leur place future.
    if (v.route) {
      const hopName = nameOf({ root: v.route.hop, cls: 'maj' });
      for (const c of v.route.pass) add(c, `→ ${hopName}`, roleOf(c, v.route.hop).label);
    }
    for (const c of v.candidates.filter((x) => x.satellite).sort((x, y) => (y.share ?? 0) - (x.share ?? 0))) add(c.chord, c.label, c.anchor);
    const pts = satellitePoints(outside.map((o) => ({ id: chordId(o.chord), anchor: o.anchor })));
    for (const o of outside) out.set(chordId(o.chord), { chord: o.chord, p: pts.get(chordId(o.chord))!, r: SAT_DISK, label: o.label, kind: 'satellite' });
    return out;
  }

  render(v: MapView) {
    this.view = v;
    this.spots = this.layout(v);
    this.drawRing(v);
    this.drawNodes(v);
    this.drawHalos(v);
    this.drawTrail(v);
    this.preview(null);
  }

  private drawRing(v: MapView) {
    this.ring.style.transform = `rotate(${v.rotation}deg)`;
    for (const [t, g] of this.ringLabels) {
      g.classList.toggle('is-current', t === v.key);
      g.classList.toggle('is-home', t === v.home);
      g.classList.toggle('is-leaning', t === v.leaning);
      g.classList.toggle('is-destination', t === v.route?.target);
      g.setAttribute('aria-label', t === v.key ? `${keyName(t)}, tu y es` : `Aller vers ${keyName(t)}`);
      g.querySelector('text')!.style.transform = `rotate(${-v.rotation}deg)`;
    }
    const arc = homeArc(v.home, v.key);
    this.arc.setAttribute('d', arc ? arcPath(HOME_ARC, arc.from, arc.to) : '');
    const from = keyAngle(v.key);
    this.routeArc.setAttribute('d', v.route ? arcPath(HOME_ARC, from, from + 30 * fifthsOffset(v.key, v.route.target)) : '');
    this.ring.setAttribute('aria-label', `Tonalité du moment : ${keyName(v.key)}`);
  }

  private drawNodes(v: MapView) {
    const current = v.current ? chordId(v.current) : null;
    for (const [id, g] of this.nodes) {
      if (this.spots.has(id)) continue;
      this.nodes.delete(id);
      g.classList.add('is-leaving');
      setTimeout(() => g.remove(), this.opts.reducedMotion ? 0 : 350);
    }
    for (const [id, s] of this.spots) {
      let g = this.nodes.get(id);
      let fresh = false;
      if (!g) {
        g = el('g', { tabindex: 0, role: 'button' }, this.nodeLayer);
        el('circle', { class: 'map-node-ring' }, g);
        el('circle', { class: 'map-node-disc' }, g);
        el('text', { class: 'map-node-name', 'text-anchor': 'middle' }, g);
        el('text', { class: 'map-node-sub', 'text-anchor': 'middle' }, g);
        const pick = () => {
          const sp = this.spots.get(id);
          if (sp) this.opts.onPick(sp.chord);
        };
        const hover = (c: Chord | null) => {
          if (!c || this.spots.has(id)) this.opts.onHover(c);
        };
        g.addEventListener('click', pick);
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pick();
          }
        });
        g.addEventListener('pointerenter', (e) => {
          if (e.pointerType === 'mouse') hover(this.spots.get(id)?.chord ?? null);
        });
        g.addEventListener('pointerleave', (e) => {
          if (e.pointerType === 'mouse') hover(null);
        });
        // Le clavier a le même aperçu que la souris.
        g.addEventListener('focus', () => hover(this.spots.get(id)?.chord ?? null));
        g.addEventListener('blur', () => hover(null));
        fresh = true;
        this.nodes.set(id, g);
      }
      const guide = v.route ? ` map-node--guide-${guideOf(s.chord, v.route, v.key)}` : '';
      const next = v.route?.recipe[0] && chordId(v.route.recipe[0].chord) === id ? ' is-next' : '';
      g.setAttribute('class', `map-node map-node--${s.kind}${guide}${next}${id === current ? ' is-current' : ''}${fresh ? ' is-entering' : ''}`);
      if (fresh) {
        const node = g;
        requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove('is-entering')));
      }
      g.style.transform = `translate(${s.p.x.toFixed(1)}px, ${s.p.y.toFixed(1)}px)`;
      const [ring, disc, name, sub] = [g.children[0]!, g.children[1]!, g.children[2]!, g.children[3]!];
      ring.setAttribute('r', String(s.r + 10));
      disc.setAttribute('r', String(s.r));
      name.setAttribute('y', String(s.kind === 'satellite' ? -2 : -6));
      name.textContent = nameOf(s.chord);
      sub.setAttribute('y', String(s.kind === 'satellite' ? 22 : 26));
      sub.textContent = s.label;
      const cand = v.candidates.find((c) => chordId(c.chord) === id);
      const base = cand && v.current ? haloTip(v.current, cand) : `${nameOf(s.chord)} : ${s.label} en ${keyName(v.key)}.`;
      const door = v.route?.pass.some((c) => chordId(c) === id);
      g.dataset.tip = door
        ? `${nameOf(s.chord)} : ${roleOf(s.chord, v.route!.hop).label} en ${nameOf({ root: v.route!.hop, cls: 'maj' })} ; il n’existe pas en ${nameOf({ root: v.key, cls: 'maj' })}.`
        : s.kind === 'satellite'
          ? `${base} ${nameOf(s.chord)} : ${roleText(s.chord, v.key)}.`
          : base;
      g.setAttribute('aria-label', `${nameOf(s.chord)}, ${s.label}${cand?.share != null ? `, ${pct(cand.share)} des chansons` : ''}`);
    }
  }

  private drawHalos(v: MapView) {
    this.halos.replaceChildren();
    this.pcts.replaceChildren();
    const placed: DOMRect[] = [];
    // Les noms de l'anneau (à leur place finale, anneau tourné) comptent aussi comme obstacles.
    const ringKeys = KEYS.map((t) => polar(KEY_RING, keyAngle(t) + v.rotation));
    for (const c of v.candidates) {
      if (c.share === null) continue;
      const s = this.spots.get(chordId(c.chord));
      if (!s) continue;
      const r = s.r + 6 + 54 * Math.sqrt(c.share);
      const muted = v.route && guideOf(c.chord, v.route, v.key) !== 'mene' && chordId(c.chord) !== chordId(v.route.recipe[0]?.chord ?? c.chord) ? ' map-halo--muted' : '';
      el('circle', { class: `map-halo${muted}`, cx: s.p.x, cy: s.p.y, r, style: `--share:${c.share.toFixed(3)}` }, this.halos);
      const t = el('text', { class: 'map-pct', 'text-anchor': 'middle' }, this.pcts);
      t.textContent = pct(c.share);
      placed.push(this.placePct(t, s, r, placed, ringKeys));
    }
    this.hideCollidingSectorNames(placed);
  }

  /** Cherche pour un pourcentage la place (sous, au-dessus, à droite, à gauche du halo) qui ne touche ni autre disque ni autre pourcentage. */
  private placePct(t: SVGTextElement, s: Spot, r: number, placed: DOMRect[], ringKeys: Point[]): DOMRect {
    const gap = 8;
    const h = t.getBBox().height || 28;
    const w = t.getBBox().width || 60;
    const spots: [number, number, 'middle' | 'start' | 'end'][] = [
      [s.p.x, s.p.y + r + h * 0.85, 'middle'],
      [s.p.x, s.p.y - r - h * 0.25, 'middle'],
      [s.p.x + r + gap, s.p.y + h * 0.3, 'start'],
      [s.p.x - r - gap, s.p.y + h * 0.3, 'end'],
    ];
    let best = spots[0]!;
    let bestHits = Infinity;
    for (const cand of spots) {
      const [x, y, anchor] = cand;
      const left = anchor === 'middle' ? x - w / 2 : anchor === 'start' ? x : x - w;
      const box = new DOMRect(left, y - h * 0.8, w, h);
      let hits = 0;
      for (const o of this.spots.values()) {
        if (o === s) continue;
        const nx = Math.max(box.left, Math.min(o.p.x, box.right));
        const ny = Math.max(box.top, Math.min(o.p.y, box.bottom));
        if (Math.hypot(o.p.x - nx, o.p.y - ny) < o.r + 4) hits++;
      }
      for (const k of ringKeys) {
        const nx = Math.max(box.left, Math.min(k.x, box.right));
        const ny = Math.max(box.top, Math.min(k.y, box.bottom));
        if (Math.hypot(k.x - nx, k.y - ny) < 30) hits++;
      }
      for (const q of placed) if (box.left < q.right && q.left < box.right && box.top < q.bottom && q.top < box.bottom) hits++;
      if (hits < bestHits) {
        bestHits = hits;
        best = cand;
        if (hits === 0) break;
      }
    }
    t.setAttribute('x', String(best[0]));
    t.setAttribute('y', String(best[1]));
    t.setAttribute('text-anchor', best[2]);
    const left = best[2] === 'middle' ? best[0] - w / 2 : best[2] === 'start' ? best[0] : best[0] - w;
    return new DOMRect(left, best[1] - h * 0.8, w, h);
  }

  /** Les noms de secteur s'effacent quand un pourcentage ou un disque passe dessus : la couleur du secteur suffit alors. */
  private hideCollidingSectorNames(pcts: DOMRect[]) {
    for (const n of this.sectorNames) {
      const b = n.getBBox();
      const hit =
        pcts.some((q) => b.x < q.right && q.left < b.x + b.width && b.y < q.bottom && q.top < b.y + b.height) ||
        [...this.spots.values()].some((o) => {
          const nx = Math.max(b.x, Math.min(o.p.x, b.x + b.width));
          const ny = Math.max(b.y, Math.min(o.p.y, b.y + b.height));
          return Math.hypot(o.p.x - nx, o.p.y - ny) < o.r + 6;
        });
      n.classList.toggle('is-hidden', hit);
    }
  }

  private arrow(a: Chord, b: Chord, cls: string, parent: SVGGElement, accent: boolean) {
    const sa = this.spots.get(chordId(a));
    const sb = this.spots.get(chordId(b));
    if (!sa || !sb || chordId(a) === chordId(b)) return;
    const { d } = arrowPath(sa.p, sb.p, sa.r, 0.18, 0, sb.r);
    el('path', { class: cls, d, 'marker-end': `url(#${accent ? 'map-head-accent' : 'map-head'})` }, parent);
  }

  private drawTrail(v: MapView) {
    this.trail.replaceChildren();
    const t = v.trail;
    for (let i = 1; i < t.length; i++) {
      const age = t.length - 1 - i;
      this.arrow(t[i - 1]!, t[i]!, `map-step map-step--age${Math.min(age, 3)}`, this.trail, age === 0);
    }
  }

  /** La flèche du pas à venir (survol d'un candidat), ou rien. */
  preview(c: Chord | null) {
    this.previewLayer.replaceChildren();
    if (c && this.view?.current) this.arrow(this.view.current, c, 'map-step map-step--preview', this.previewLayer, true);
  }
}
