/** État de la page reflété dans l'URL : la fondamentale et les rangs allumés. */
import { MAX_RANK, normalizeRanks } from './domain/partials';

export type Fundamental = 24 | 36 | 48;

export interface VizState {
  fundamental: Fundamental;
  /** Rangs allumés (1 à 16), triés. */
  ranks: number[];
}

export const FUNDAMENTALS: readonly Fundamental[] = [24, 36, 48];
export const ALL_RANKS = Array.from({ length: MAX_RANK }, (_, i) => i + 1);
export const DEFAULT_STATE: VizState = { fundamental: 36, ranks: ALL_RANKS };

export function readStateFromUrl(search: string): VizState {
  const p = new URLSearchParams(search);
  const f = Number(p.get('fondamentale'));
  const r = p.get('rangs');
  return {
    fundamental: (FUNDAMENTALS as readonly number[]).includes(f) ? (f as Fundamental) : DEFAULT_STATE.fundamental,
    ranks: r === null ? DEFAULT_STATE.ranks : normalizeRanks(r.split(',').map(Number)),
  };
}

export function stateToSearch(state: VizState): string {
  const p = new URLSearchParams();
  if (state.fundamental !== DEFAULT_STATE.fundamental) p.set('fondamentale', String(state.fundamental));
  if (state.ranks.join(',') !== DEFAULT_STATE.ranks.join(',')) p.set('rangs', state.ranks.join(','));
  const s = p.toString();
  return s ? `?${s.replace(/%2C/g, ',')}` : '';
}
