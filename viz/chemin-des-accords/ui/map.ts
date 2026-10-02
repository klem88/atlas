/**
 * La carte SVG : secteurs de fonction, anneau des tonalités, halos (les possibilités), traînée (le chemin), disques.
 * Les disques sont identifiés par l'accord réel : à une modulation, un accord commun glisse à sa nouvelle place
 * (transition CSS sur `transform`), et son degré se réécrit.
 */
import { chordId, diatonicChords, keyName, nameOf, roleOf, type Chord } from '../../suis-les-fleches/domain/harmony';
import { arrowPath, FN_LABELS, layoutOf, type Point } from '../../suis-les-fleches/domain/layout';
import { roleText } from '../../suis-les-fleches/domain/moves';
import { arcPath, CHORD_RING, DISK, diatonicPoint, HOME_ARC, homeArc, KEY_RING, keyAngle, polar, SAT_DISK, satellitePoints, TONIC_DISK } from '../domain/geometry';
import type { Candidate } from '../domain/halos';
import { haloTip, pct, RING_TIP } from '../domain/notes';

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
}

export interface MapOptions {
  onPick: (c: Chord) => void;
  onHover: (c: Chord | null) => void;
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
  private halos: SVGGElement;
  private trail: SVGGElement;
  private previewLayer: SVGGElement;
  private nodeLayer: SVGGElement;
  private pcts: SVGGElement;
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
    for (const t of KEYS) {
      const a = polar(KEY_RING, keyAngle(t));
      const g = el('g', { class: 'ring-key', transform: `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})` }, this.ring);
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
      el('text', { class: 'map-sector-name', x: mid.x, y: mid.y, 'text-anchor': 'middle' }, g).textContent = FN_LABELS[s.fn].name;
    }
  }

  /** Où chaque accord se trouve dans la tonalité du moment. */
  private layout(v: MapView): Map<string, Spot> {
    const out = new Map<string, Spot>();
    for (const { chord, role } of diatonicChords(v.key))
      out.set(chordId(chord), { chord, p: diatonicPoint(role.label), r: role.label === 'I' ? TONIC_DISK : DISK, label: role.label, kind: `diatonique map-node--${role.fn}` });
    const outside = v.candidates.filter((c) => c.satellite).map((c) => ({ chord: c.chord, label: c.label, anchor: c.anchor }));
    if (v.current && !out.has(chordId(v.current)) && !outside.some((o) => chordId(o.chord) === chordId(v.current!))) {
      const r = roleOf(v.current, v.key);
      outside.push({ chord: v.current, label: r.label, anchor: r.anchor });
    }
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
      g.querySelector('text')!.style.transform = `rotate(${-v.rotation}deg)`;
    }
    const arc = homeArc(v.home, v.key);
    this.arc.setAttribute('d', arc ? arcPath(HOME_ARC, arc.from, arc.to) : '');
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
      if (!g) {
        g = el('g', { tabindex: 0, role: 'button' }, this.nodeLayer);
        el('circle', { class: 'map-node-disc' }, g);
        el('text', { class: 'map-node-name', 'text-anchor': 'middle' }, g);
        el('text', { class: 'map-node-sub', 'text-anchor': 'middle' }, g);
        const pick = () => this.opts.onPick(this.spots.get(id)!.chord);
        g.addEventListener('click', pick);
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pick();
          }
        });
        g.addEventListener('pointerenter', (e) => {
          if (e.pointerType === 'mouse') this.opts.onHover(this.spots.get(id)!.chord);
        });
        g.addEventListener('pointerleave', (e) => {
          if (e.pointerType === 'mouse') this.opts.onHover(null);
        });
        g.classList.add('is-entering');
        requestAnimationFrame(() => g!.classList.remove('is-entering'));
        this.nodes.set(id, g);
      }
      g.setAttribute('class', `map-node map-node--${s.kind}${id === current ? ' is-current' : ''}`);
      g.style.transform = `translate(${s.p.x.toFixed(1)}px, ${s.p.y.toFixed(1)}px)`;
      const [disc, name, sub] = [g.children[0]!, g.children[1]!, g.children[2]!];
      disc.setAttribute('r', String(s.r));
      name.setAttribute('y', String(s.kind === 'satellite' ? -2 : -6));
      name.textContent = nameOf(s.chord);
      sub.setAttribute('y', String(s.kind === 'satellite' ? 22 : 26));
      sub.textContent = s.label;
      const cand = v.candidates.find((c) => chordId(c.chord) === id);
      const base = cand && v.current ? haloTip(v.current, cand) : `${nameOf(s.chord)} : ${s.label} en ${keyName(v.key)}.`;
      g.dataset.tip = s.kind === 'satellite' ? `${base} ${nameOf(s.chord)} : ${roleText(s.chord, v.key)}.` : base;
      g.setAttribute('aria-label', `${nameOf(s.chord)}, ${s.label}${cand?.share != null ? `, ${pct(cand.share)} des chansons` : ''}`);
    }
  }

  private drawHalos(v: MapView) {
    this.halos.replaceChildren();
    this.pcts.replaceChildren();
    for (const c of v.candidates) {
      if (c.share === null) continue;
      const s = this.spots.get(chordId(c.chord));
      if (!s) continue;
      const r = s.r + 6 + 54 * Math.sqrt(c.share);
      el('circle', { class: 'map-halo', cx: s.p.x, cy: s.p.y, r, style: `--share:${c.share.toFixed(3)}` }, this.halos);
      el('text', { class: 'map-pct', x: s.p.x, y: s.p.y + r + 26, 'text-anchor': 'middle' }, this.pcts).textContent = pct(c.share);
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
