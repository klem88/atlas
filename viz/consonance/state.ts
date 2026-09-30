/** État de la page reflété dans l'URL : position du curseur (cents), timbre, note grave. */

export interface VizState {
  /** Intervalle entre les deux notes, en cents (0 à 1200). */
  cents: number;
  /** Nombre d'harmoniques de chaque note. */
  harmonics: 1 | 3 | 6 | 10;
  /** Note grave (MIDI) : do2, do3 ou do4. */
  root: 36 | 48 | 60;
}

export const HARMONIC_CHOICES = [1, 3, 6, 10] as const;
export const ROOT_CHOICES = [36, 48, 60] as const;
export const DEFAULT_STATE: VizState = { cents: 386, harmonics: 6, root: 60 };

export const clampCents = (c: number) => Math.min(1200, Math.max(0, Math.round(c)));

export function readStateFromUrl(search: string): VizState {
  const p = new URLSearchParams(search);
  const c = Number(p.get('cents'));
  const h = Number(p.get('harmoniques'));
  const r = Number(p.get('grave'));
  return {
    cents: p.has('cents') && Number.isFinite(c) ? clampCents(c) : DEFAULT_STATE.cents,
    harmonics: (HARMONIC_CHOICES as readonly number[]).includes(h) ? (h as VizState['harmonics']) : DEFAULT_STATE.harmonics,
    root: (ROOT_CHOICES as readonly number[]).includes(r) ? (r as VizState['root']) : DEFAULT_STATE.root,
  };
}

export function stateToSearch(state: VizState): string {
  const p = new URLSearchParams();
  if (state.cents !== DEFAULT_STATE.cents) p.set('cents', String(state.cents));
  if (state.harmonics !== DEFAULT_STATE.harmonics) p.set('harmoniques', String(state.harmonics));
  if (state.root !== DEFAULT_STATE.root) p.set('grave', String(state.root));
  const s = p.toString();
  return s ? `?${s}` : '';
}
