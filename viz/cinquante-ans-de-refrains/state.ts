/** État dans l'URL : `?mesure=distincts&corpus=chordonomicon&style=pop&annee=1975`. */
import { MEASURES, type Measure } from './data/contract';

export interface VizState {
  measure: Measure;
  corpus: 'chordonomicon' | 'billboard';
  /** Genre des tablatures, ou null pour toutes. */
  style: string | null;
  year: number | null;
}

export const DEFAULT_STATE: VizState = { measure: 'distincts', corpus: 'chordonomicon', style: null, year: null };

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const m = q.get('mesure') as Measure | null;
  const c = q.get('corpus');
  const st = q.get('style');
  const y = Number(q.get('annee'));
  return {
    measure: m && MEASURES.includes(m) ? m : DEFAULT_STATE.measure,
    corpus: c === 'billboard' ? 'billboard' : 'chordonomicon',
    style: st && /^[a-z ]{1,20}$/.test(st) ? st : null,
    year: y >= 1900 && y <= 2100 ? y : null,
  };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  if (s.measure !== DEFAULT_STATE.measure) q.set('mesure', s.measure);
  if (s.corpus !== DEFAULT_STATE.corpus) q.set('corpus', s.corpus);
  if (s.style) q.set('style', s.style);
  if (s.year !== null) q.set('annee', String(s.year));
  const str = q.toString().replace(/\+/g, '%20');
  return str ? `?${str}` : '';
}
