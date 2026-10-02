/**
 * Géométrie de la carte, en unités du cadre (1000 × 1000, centre 500,500) : le cercle de la tonalité (repris de
 * « Suis les flèches », mis à l'échelle), les satellites hors gamme (au-delà de l'accord auquel ils se rattachent),
 * et l'anneau des douze tonalités rangées par quintes (Do en haut ; l'anneau tourne pour garder la tonalité du moment en haut).
 */
import { CIRCLE_RING, layoutOf, type Point } from '../../suis-les-fleches/domain/layout';
import { fifthsIndex, fifthsOffset } from '../../suis-les-fleches/domain/harmony';

export const FRAME = 1000;
export const CENTER = 500;
/** Rayon du cercle des six accords autour de la tonique. */
export const CHORD_RING = 250;
/** Rayons des disques : 68 donne 45 px de diamètre à 375 px de large (cadre de 1040 unités). */
export const DISK = 68;
export const TONIC_DISK = 78;
export const SAT_DISK = 46;
/** Distance d'un satellite au cercle des accords, vers l'extérieur. */
export const SAT_DIST = 130;
/** Écart angulaire entre deux satellites d'une même ancre. */
const SAT_SPREAD = 17;
export const KEY_RING = 468;
export const HOME_ARC = 498;

const SCALE = CHORD_RING / (CIRCLE_RING * FRAME);
const CIRCLE = layoutOf('cercle');

export const polar = (r: number, deg: number): Point => ({ x: CENTER + r * Math.cos((deg * Math.PI) / 180), y: CENTER + r * Math.sin((deg * Math.PI) / 180) });

export function diatonicPoint(label: string): Point {
  const p = CIRCLE.positions[label]!;
  return { x: CENTER + (p.x - 0.5) * FRAME * SCALE, y: CENTER + (p.y - 0.5) * FRAME * SCALE };
}

/** L'angle (degrés, sens horaire depuis 3 h) d'un accord de la gamme vu du centre ; la tonique et l'absence d'ancre : en bas. */
function anchorAngle(anchor: string | null): number {
  if (!anchor || anchor === 'I') return 90;
  const p = diatonicPoint(anchor);
  return (Math.atan2(p.y - CENTER, p.x - CENTER) * 180) / Math.PI;
}

/** Les satellites, groupés par ancre, s'écartent en éventail au-delà de leur ancre.
 * La page en affiche au plus quatre (trois candidats hors gamme + l'accord du moment s'il est hors gamme),
 * ce qui garantit un écart de 23° au moins entre deux groupes voisins — le test le vérifie. */
export function satellitePoints(items: readonly { id: string; anchor: string | null }[]): Map<string, Point> {
  const groups = new Map<number, string[]>();
  for (const it of items) {
    const a = anchorAngle(it.anchor);
    groups.set(a, [...(groups.get(a) ?? []), it.id]);
  }
  const out = new Map<string, Point>();
  for (const [a, ids] of groups) ids.forEach((id, k) => out.set(id, polar(CHORD_RING + SAT_DIST, a + (k - (ids.length - 1) / 2) * SAT_SPREAD)));
  return out;
}

/** Angle d'une tonalité sur l'anneau fixe (Do en haut, Sol un cran à droite…). */
export const keyAngle = (tonic: number): number => -90 + 30 * fifthsIndex(tonic);

/** Nouvelle rotation de l'anneau (en degrés), par le plus court chemin, pour amener `toKey` en haut. */
export const ringRotation = (previous: number, fromKey: number, toKey: number): number => previous - 30 * fifthsOffset(fromKey, toKey);

/** L'arc de la maison à la tonalité du moment, dans le repère fixe de l'anneau. */
export function homeArc(home: number, key: number): { from: number; to: number } | null {
  const off = fifthsOffset(home, key);
  if (off === 0) return null;
  const from = keyAngle(home);
  return { from, to: from + 30 * off };
}

export function arcPath(r: number, from: number, to: number): string {
  const a = polar(r, from);
  const b = polar(r, to);
  const sweep = to > from ? 1 : 0;
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} A${r},${r} 0 ${large} ${sweep} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}
