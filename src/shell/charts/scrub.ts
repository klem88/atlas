import type { ChartScales } from './line-chart';

/**
 * Valeur x (entière, bornée) visée par un pointeur au-dessus d'un graphique en ligne.
 * @param offset   position du pointeur depuis le bord gauche du SVG, en px d'écran
 * @param shown    largeur affichée du SVG, en px d'écran
 * @param viewBox  largeur du viewBox du SVG (unités des échelles)
 */
export function scrubValue(offset: number, shown: number, viewBox: number, scales: ChartScales, min: number, max: number): number {
  const x = scales.xInvert((offset / shown) * viewBox);
  return Math.min(max, Math.max(min, Math.round(x)));
}

interface ScrubOptions {
  /** Sélecteur du SVG, cherché dans l'hôte à chaque geste : le graphique peut être redessiné pendant le glissé. */
  selector: string;
  /** Échelles du dernier dessin (null tant que rien n'est dessiné). */
  scales: () => ChartScales | null;
  min: number;
  max: number;
  onPick: (x: number) => void;
}

/**
 * Rend « glissable » un graphique en ligne : cliquer ou glisser dessus choisit une valeur x.
 * Le geste est capté par l'hôte, qui reste en place quand le SVG est remplacé à chaque rendu.
 * Donner au SVG la classe `lc-scrub` (curseur, défilement vertical laissé à la page).
 */
export function attachScrub(host: HTMLElement, o: ScrubOptions): void {
  let last: number | null = null;

  const pick = (e: PointerEvent) => {
    const svg = host.querySelector<SVGSVGElement>(o.selector);
    const scales = o.scales();
    if (!svg || !scales) return;
    const rect = svg.getBoundingClientRect();
    const x = scrubValue(e.clientX - rect.left, rect.width, svg.viewBox.baseVal.width, scales, o.min, o.max);
    if (x === last) return;
    last = x;
    o.onPick(x);
  };

  host.addEventListener('pointerdown', (e) => {
    if (!(e.target as Element).closest(o.selector)) return;
    last = null;
    host.setPointerCapture(e.pointerId);
    pick(e);
  });
  host.addEventListener('pointermove', (e) => {
    if (host.hasPointerCapture(e.pointerId)) pick(e);
  });
}
