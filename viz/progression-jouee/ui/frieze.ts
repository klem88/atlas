/**
 * La frise des décennies (élément signature) : une barre par décennie, hauteur = part des morceaux de la décennie
 * qui contiennent la progression. SVG dans la page ; `drawFriezeCanvas` reprend le même dessin pour les images.
 * Décennies trop peu peuplées : hachurées. Le sommet est à l'accent.
 */
import type { Breakdown } from '../domain/lookup';

const NS = 'http://www.w3.org/2000/svg';
const MIN_BASE = 200;

export interface FriezeItem extends Breakdown {
  base: number;
}

export function friezeItems(byDecade: Breakdown[], bases: number[]): FriezeItem[] {
  return byDecade.map((b, i) => ({ ...b, base: bases[i]! }));
}

const pctLabel = (x: number) => (x >= 0.095 ? `${Math.round(x * 100)} %` : `${(x * 100).toFixed(1).replace('.', ',')} %`);
const decadeShort = (label: string, i: number) => (i === 0 ? '≤ 1950' : `${label.slice(2)}`);

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

/** Dessine la frise dans `svg` (largeur adaptée à son conteneur via viewBox). */
export function renderFrieze(svg: SVGSVGElement, items: FriezeItem[] | null, width: number): void {
  const height = 190;
  const m = { top: 28, right: 8, bottom: 26, left: 8 };
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.replaceChildren();
  svg.setAttribute('aria-label', items ? 'Part des morceaux de chaque décennie contenant la progression' : 'Progression non retenue : pas de frise');

  const defs = el('defs', {});
  const pat = el('pattern', { id: 'frieze-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
  pat.append(el('rect', { width: 6, height: 6, class: 'frieze-hatch-bg' }));
  pat.append(el('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'frieze-hatch-line' }));
  defs.append(pat);
  svg.append(defs);

  const n = items?.length ?? 8;
  const iw = width - m.left - m.right;
  const ih = height - m.top - m.bottom;
  const gap = Math.min(12, iw / n / 5);
  const bw = (iw - gap * (n - 1)) / n;
  const baseline = m.top + ih;
  svg.append(el('line', { x1: m.left, x2: width - m.right, y1: baseline, y2: baseline, class: 'frieze-base' }));

  if (!items) {
    const t = el('text', { x: width / 2, y: m.top + ih / 2, 'text-anchor': 'middle', class: 'frieze-empty' });
    t.textContent = 'Pas assez de morceaux pour dessiner la frise.';
    svg.append(t);
    return;
  }
  const max = Math.max(1e-6, ...items.map((it) => it.share ?? 0));
  const best = items.reduce<number>((bi, it, i) => (it.base >= MIN_BASE && (it.share ?? 0) > (items[bi]!.share ?? 0) ? i : bi), 0);

  items.forEach((it, i) => {
    const x = m.left + i * (bw + gap);
    const share = it.share ?? 0;
    const h = Math.max(share > 0 ? 2 : 0, (share / max) * ih);
    const g = el('g', { class: 'frieze-bar' });
    const title = el('title', {});
    title.textContent = `${i === 0 ? 'Jusqu’aux années 1950' : `Années ${it.label}`} : ${pctLabel(share)} des ${it.base.toLocaleString('fr-FR')} morceaux (${it.count.toLocaleString('fr-FR')}).`;
    g.append(title);
    const weak = it.base < MIN_BASE;
    g.append(el('rect', { x, y: baseline - h, width: bw, height: h, rx: 2, class: `frieze-rect${i === best && !weak ? ' is-peak' : ''}${weak ? ' is-weak' : ''}` }));
    if (weak && h > 0) g.append(el('rect', { x, y: baseline - h, width: bw, height: h, rx: 2, fill: 'url(#frieze-hatch)' }));
    const v = el('text', { x: x + bw / 2, y: baseline - h - 6, 'text-anchor': 'middle', class: `frieze-value${i === best && !weak ? ' is-peak' : ''}` });
    v.textContent = it.base === 0 ? '' : pctLabel(share);
    g.append(v);
    const l = el('text', { x: x + bw / 2, y: height - 8, 'text-anchor': 'middle', class: 'frieze-label' });
    l.textContent = decadeShort(it.label, i);
    g.append(l);
    svg.append(g);
  });
}

export interface FriezeColors {
  bar: string;
  peak: string;
  ink: string;
  ink3: string;
  rule: string;
  weak: string;
}

/** Même frise sur un canvas (image de partage, image d'aperçu). */
export function drawFriezeCanvas(
  ctx: CanvasRenderingContext2D,
  items: FriezeItem[],
  box: { x: number; y: number; w: number; h: number },
  colors: FriezeColors,
  fontUi: string,
  scale = 1,
): void {
  const n = items.length;
  const labelH = 34 * scale;
  const valueH = 30 * scale;
  const gap = 14 * scale;
  const bw = (box.w - gap * (n - 1)) / n;
  const baseline = box.y + box.h - labelH;
  const ih = box.h - labelH - valueH;
  const max = Math.max(1e-6, ...items.map((it) => it.share ?? 0));
  const best = items.reduce<number>((bi, it, i) => (it.base >= MIN_BASE && (it.share ?? 0) > (items[bi]!.share ?? 0) ? i : bi), 0);
  ctx.strokeStyle = colors.rule;
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.moveTo(box.x, baseline);
  ctx.lineTo(box.x + box.w, baseline);
  ctx.stroke();
  items.forEach((it, i) => {
    const x = box.x + i * (bw + gap);
    const share = it.share ?? 0;
    const h = Math.max(share > 0 ? 2 : 0, (share / max) * ih);
    const weak = it.base < MIN_BASE;
    ctx.fillStyle = weak ? colors.weak : i === best ? colors.peak : colors.bar;
    ctx.fillRect(x, baseline - h, bw, h);
    if (weak && h > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, baseline - h, bw, h);
      ctx.clip();
      ctx.strokeStyle = colors.ink3;
      ctx.lineWidth = 1 * scale;
      for (let d = -h; d < bw + h; d += 8 * scale) {
        ctx.beginPath();
        ctx.moveTo(x + d, baseline);
        ctx.lineTo(x + d + h, baseline - h);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = i === best && !weak ? colors.ink : colors.ink3;
    ctx.font = `${i === best && !weak ? 700 : 400} ${20 * scale}px ${fontUi}`;
    if (it.base > 0) ctx.fillText(pctLabel(share), x + bw / 2, baseline - h - 10 * scale);
    ctx.fillStyle = colors.ink3;
    ctx.font = `400 ${20 * scale}px ${fontUi}`;
    ctx.fillText(decadeShort(it.label, i), x + bw / 2, box.y + box.h - 6 * scale);
  });
}
