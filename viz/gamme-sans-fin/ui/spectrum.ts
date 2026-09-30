/**
 * Le spectre du son de Shepard (SVG) : l'axe des fréquences en log, une barre par composante,
 * l'enveloppe fixe en cloche. La figure classique, sous l'hélice.
 */
import { BASE_HZ, OCTAVES, envelope, type Component } from '../domain/shepard';

const NS = 'http://www.w3.org/2000/svg';
const HEIGHT = 150;
const TOP = 12;
const BOTTOM = 34;
const SIDE = 12;

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}, text?: string): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

export interface Spectrum {
  set(components: readonly Component[]): void;
  resize(): void;
}

export function createSpectrum(svg: SVGSVGElement): Spectrum {
  let width = Math.max(300, svg.clientWidth || 600);
  const gStatic = el('g');
  const gBars = el('g');
  svg.append(gStatic, gBars);
  let last: readonly Component[] = [];

  const x = (octaves: number) => SIDE + (octaves / OCTAVES) * (width - 2 * SIDE);
  const y = (amp: number) => TOP + (1 - amp) * (HEIGHT - TOP - BOTTOM);

  function drawStatic() {
    gStatic.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`);
    const base = HEIGHT - BOTTOM;
    let d = '';
    for (let i = 0; i <= 180; i++) {
      const o = (i / 180) * OCTAVES;
      d += `${i ? 'L' : 'M'}${x(o).toFixed(1)},${y(envelope(o)).toFixed(1)}`;
    }
    gStatic.append(el('path', { d, class: 'sp-envelope' }));
    gStatic.append(el('line', { x1: SIDE, x2: width - SIDE, y1: base, y2: base, class: 'sp-base' }));
    for (let k = 0; k <= OCTAVES; k++) {
      const hz = BASE_HZ * 2 ** k;
      gStatic.append(el('line', { x1: x(k), x2: x(k), y1: base, y2: base + 5, class: 'sp-base' }));
      if (k % 2 === 0 || width > 640) gStatic.append(el('text', { x: x(k), y: base + 19, class: 'sp-tick', 'text-anchor': 'middle' }, hz >= 1000 ? `${(hz / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kHz` : `${Math.round(hz)} Hz`));
    }
  }

  function drawBars() {
    gBars.innerHTML = '';
    const base = HEIGHT - BOTTOM;
    let best = 0;
    last.forEach((c, k) => {
      if (c.amp > last[best]!.amp) best = k;
    });
    last.forEach((c, k) => {
      gBars.append(el('line', { x1: x(c.octaves), x2: x(c.octaves), y1: base, y2: y(c.amp), class: k === best ? 'sp-bar sp-bar--best' : 'sp-bar' }));
      gBars.append(el('circle', { cx: x(c.octaves), cy: y(c.amp), r: 3.5, class: k === best ? 'sp-dot sp-dot--best' : 'sp-dot' }));
    });
  }

  drawStatic();
  return {
    set(components) {
      last = components;
      drawBars();
    },
    resize() {
      const w = Math.max(300, svg.clientWidth || 600);
      if (w === width) return;
      width = w;
      drawStatic();
      drawBars();
    },
  };
}
