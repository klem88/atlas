/**
 * La spirale des quintes : do, puis douze quintes empilées. Un tour = une octave.
 * En quintes pures, le treizième point rate le do de 23,46 cents (la virgule pythagoricienne) ;
 * en quintes tempérées, il retombe dessus. Le passage de l'un à l'autre s'anime doucement,
 * sauf si le lecteur préfère moins de mouvement.
 */
import { PYTHAGOREAN_COMMA_CENTS, fifthsSpiral } from '../domain/comma';
import { ratioCents, tuningRatio } from '../domain/tuning';

const NS = 'http://www.w3.org/2000/svg';
const SIZE = 340;
const R0 = 34;
const DR = 14;

const PURE = ratioCents(tuningRatio('pythagore', 7));
const EQUAL = 700;

function el(name: string, attrs: Record<string, string | number>, text?: string) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Position d'un point à `cents` du départ : angle horaire depuis le haut, rayon qui grandit à chaque tour. */
function polar(cents: number): [number, number] {
  const turns = cents / 1200;
  const a = turns * 2 * Math.PI - Math.PI / 2;
  const r = R0 + turns * DR;
  return [SIZE / 2 + r * Math.cos(a), SIZE / 2 + r * Math.sin(a)];
}

function draw(svg: SVGSVGElement, fifth: number) {
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  const names = fifthsSpiral('pythagore').map((p) => p.name);

  // Le cercle des octaves : le rayon du do de départ, et un anneau par tour.
  for (let k = 0; k <= 7; k++) {
    svg.append(el('circle', { cx: SIZE / 2, cy: SIZE / 2, r: R0 + k * DR, class: 'sp-ring' }));
  }
  // Rayon de référence : la ligne du do.
  const [xEnd, yEnd] = polar(7 * 1200);
  svg.append(el('line', { x1: SIZE / 2, y1: SIZE / 2 - R0, x2: xEnd, y2: yEnd, class: 'sp-ref' }));

  // La spirale, tracée finement
  let d = '';
  const total = 12 * fifth;
  for (let c = 0; c <= total; c += 10) {
    const [x, y] = polar(c);
    d += `${c === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  const [xl, yl] = polar(total);
  d += `L${xl.toFixed(1)},${yl.toFixed(1)}`;
  svg.append(el('path', { d, class: 'sp-path' }));

  // Les treize points
  for (let step = 0; step <= 12; step++) {
    const [x, y] = polar(step * fifth);
    const last = step === 12;
    svg.append(el('circle', { cx: x, cy: y, r: last ? 5 : 3.5, class: last ? 'sp-dot sp-dot--last' : 'sp-dot' }));
    const turns = (step * fifth) / 1200;
    const a = turns * 2 * Math.PI - Math.PI / 2;
    const rl = R0 + turns * DR + 12;
    svg.append(
      el(
        'text',
        { x: SIZE / 2 + rl * Math.cos(a), y: SIZE / 2 + rl * Math.sin(a) + 4, class: 'sp-label', 'text-anchor': 'middle' },
        last ? `${names[12]} ?` : names[step]!,
      ),
    );
  }

  // L'écart qui reste : arc entre la douzième quinte et le do sept octaves plus haut.
  const gap = total - 7 * 1200;
  if (gap > 0.5) {
    const [xa, ya] = polar(7 * 1200);
    const r = R0 + 7 * DR;
    svg.append(el('path', { d: `M${xa.toFixed(1)},${ya.toFixed(1)} A${r},${r} 0 0 1 ${xl.toFixed(1)},${yl.toFixed(1)}`, class: 'sp-gap' }));
  }
  const status = document.getElementById('spiral-status');
  if (status) status.textContent = gap > 0.5 ? `La douzième quinte arrive ${gap.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} cents au-dessus du do.` : 'La douzième quinte retombe exactement sur le do.';
}

export function setupSpiral(svg: SVGSVGElement, controls: HTMLElement): void {
  let current = PURE;
  let target = PURE;
  let raf = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const step = () => {
    const diff = target - current;
    if (Math.abs(diff) < 0.005) {
      current = target;
      draw(svg, current);
      return;
    }
    current += diff * 0.08;
    draw(svg, current);
    raf = requestAnimationFrame(step);
  };

  const go = (value: number) => {
    target = value;
    cancelAnimationFrame(raf);
    if (reduced) {
      current = target;
      draw(svg, current);
    } else raf = requestAnimationFrame(step);
  };

  controls.addEventListener('change', (e) => {
    const v = (e.target as HTMLInputElement).value;
    go(v === 'egal' ? EQUAL : PURE);
  });
  draw(svg, current);

  // Le chiffre affiché à côté vient du domaine, pas du dessin.
  const comma = document.getElementById('comma-value');
  if (comma) comma.textContent = PYTHAGOREAN_COMMA_CENTS.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}
