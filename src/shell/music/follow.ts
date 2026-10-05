/**
 * Suivi de la lecture : la ligne de partition jouée reste au centre de l'écran, et la page glisse
 * en continu vers la ligne suivante pendant la fin de la ligne en cours. Les yeux peuvent ainsi
 * toujours lire la suite, et le pianiste n'a jamais à faire défiler les mains sur le clavier.
 */

/** Événement minimal de la chronologie d'abcjs (`TimingCallbacks.noteTimings`). */
export interface TimingEventLike {
  milliseconds: number;
  line?: number;
  top?: number;
  height?: number;
}

/** Passage sur une ligne : de `start` à `end` (ms), position de la ligne dans la partition. */
export interface LineSpan {
  line: number;
  start: number;
  end: number;
  top: number;
  height: number;
}

/**
 * Découpe la chronologie en passages sur chaque ligne (une reprise repasse sur une ligne déjà vue).
 * `total` est la durée de la lecture, qui ferme le dernier passage.
 */
export function lineSpans(events: readonly TimingEventLike[], total: number): LineSpan[] {
  const spans: LineSpan[] = [];
  for (const ev of events) {
    if (ev.line === undefined || ev.top === undefined || ev.height === undefined) continue;
    const prev = spans[spans.length - 1];
    if (prev && prev.line === ev.line) continue;
    if (prev) prev.end = ev.milliseconds;
    spans.push({ line: ev.line, start: ev.milliseconds, end: total, top: ev.top, height: ev.height });
  }
  return spans;
}

/** Part de la fin d'une ligne pendant laquelle la page glisse vers la suivante. */
export const GLIDE_FORWARD = 0.4;
/** Retour en arrière (reprise) : plus court, pour ne pas quitter trop tôt la ligne jouée. */
export const GLIDE_BACK = 0.15;

const smoothstep = (x: number) => x * x * (3 - 2 * x);

/**
 * Défilement idéal à l'instant `ms` : la ligne jouée centrée dans l'espace visible sous le bandeau
 * (`inset`), avec un glissement vers la ligne suivante en fin de ligne. Les positions des passages
 * sont en pixels du document. `glide: false` supprime le glissement (mouvement réduit).
 */
export function centeredScroll(
  spans: readonly LineSpan[],
  ms: number,
  viewport: number,
  inset = 0,
  glide = true,
): number | null {
  if (!spans.length) return null;
  const middle = inset + (viewport - inset) / 2;
  const at = (s: LineSpan) => s.top + s.height / 2 - middle;
  let i = spans.findIndex((s) => ms < s.end);
  if (i < 0) i = spans.length - 1;
  const span = spans[i]!;
  const next = spans[i + 1];
  let target = at(span);
  if (glide && next && span.end > span.start) {
    const window = next.top >= span.top ? GLIDE_FORWARD : GLIDE_BACK;
    const p = (ms - span.start) / (span.end - span.start);
    if (p > 1 - window) target += (at(next) - target) * smoothstep(Math.min(1, (p - (1 - window)) / window));
  }
  return Math.max(0, Math.round(target));
}

/**
 * Rapproche le défilement de sa cible sans à-coup (lissage exponentiel) :
 * `tau` est le temps (ms) pour parcourir environ les deux tiers de l'écart.
 */
export function easeToward(current: number, target: number, dtMs: number, tau = 220): number {
  return current + (target - current) * (1 - Math.exp(-Math.max(0, dtMs) / tau));
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
