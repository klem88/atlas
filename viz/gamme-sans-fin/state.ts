/** État de la page reflété dans l'URL : sens, mouvement, vitesse et vue. La position du son n'y est pas. */
import type { SpeedId } from './domain/shepard';
import type { ViewId } from './scene/helix';

export interface VizState {
  sens: 'monte' | 'descend';
  mouvement: 'glissando' | 'marches';
  vitesse: SpeedId;
  vue: ViewId;
}

export const DEFAULT_STATE: VizState = { sens: 'monte', mouvement: 'glissando', vitesse: 'normale', vue: 'cote' };

const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

export function readStateFromUrl(search: string): VizState {
  const p = new URLSearchParams(search);
  return {
    sens: pick(p.get('sens'), ['monte', 'descend'], DEFAULT_STATE.sens),
    mouvement: pick(p.get('mouvement'), ['glissando', 'marches'], DEFAULT_STATE.mouvement),
    vitesse: pick(p.get('vitesse'), ['lente', 'normale', 'rapide'], DEFAULT_STATE.vitesse),
    vue: pick(p.get('vue'), ['cote', 'dessus'], DEFAULT_STATE.vue),
  };
}

export function stateToSearch(state: VizState): string {
  const p = new URLSearchParams();
  for (const key of ['sens', 'mouvement', 'vitesse', 'vue'] as const) if (state[key] !== DEFAULT_STATE[key]) p.set(key, state[key]);
  const s = p.toString();
  return s ? `?${s}` : '';
}
