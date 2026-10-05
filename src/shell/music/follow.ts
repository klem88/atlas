/**
 * Suivi de la lecture : garder la ligne de partition jouée dans une zone confortable de l'écran,
 * pour que le pianiste n'ait pas à faire défiler la page les mains sur le clavier.
 */

export interface FollowZone {
  /** Haut de la zone confortable, en fraction de la hauteur visible. */
  top: number;
  /** Bas de la zone confortable, en fraction de la hauteur visible. */
  bottom: number;
  /** Où placer le haut de la ligne quand on fait défiler, en fraction de la hauteur visible. */
  anchor: number;
}

export const DEFAULT_ZONE: FollowZone = { top: 0.08, bottom: 0.9, anchor: 0.22 };

/**
 * Position de défilement à atteindre pour que la ligne soit bien placée, ou `null` si elle l'est déjà.
 *
 * @param lineTop    haut de la ligne, en pixels depuis le haut du document
 * @param lineHeight hauteur de la ligne, en pixels
 * @param scrollY    défilement actuel
 * @param viewport   hauteur visible
 * @param inset      hauteur occupée en haut par un bandeau collant (la ligne doit rester dessous)
 */
export function followTarget(
  lineTop: number,
  lineHeight: number,
  scrollY: number,
  viewport: number,
  inset = 0,
  zone: FollowZone = DEFAULT_ZONE,
): number | null {
  const usable = Math.max(1, viewport - inset);
  const relTop = lineTop - scrollY - inset;
  const fits = relTop >= zone.top * usable && relTop + lineHeight <= zone.bottom * usable;
  if (fits) return null;
  return Math.max(0, Math.round(lineTop - inset - zone.anchor * usable));
}

/**
 * Pause du suivi quand l'utilisateur fait défiler lui-même : on ne lui reprend pas la main
 * pendant `pauseMs`. Seuls les gestes (molette, doigt, touches) comptent, pas les défilements du suivi.
 */
export class UserScrollGuard {
  private until = 0;

  constructor(
    private readonly pauseMs = 4000,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /** À appeler sur un geste de défilement de l'utilisateur. */
  touched(): void {
    this.until = this.now() + this.pauseMs;
  }

  get paused(): boolean {
    return this.now() < this.until;
  }

  reset(): void {
    this.until = 0;
  }
}
