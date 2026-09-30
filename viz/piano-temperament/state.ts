/** État de la page reflété dans l'URL : un lien partagé redonne les mêmes notes et le même accordage. */
import type { TuningId } from '@shell/music/tuning';

export interface VizState {
  /** Notes MIDI jouées, sans doublon, croissantes. */
  notes: number[];
  tuning: TuningId;
  /** Paire de notes mise en avant dans la vague des battements (indice dans les paires de l'accord). */
  pair: number;
}

/** Étendue jouable : do2 à do6 (le clavier affiché est plus étroit, l'URL peut aller au-delà). */
export const MIDI_MIN = 36;
export const MIDI_MAX = 84;
export const MAX_NOTES = 4;

export const DEFAULT_STATE: VizState = { notes: [60, 67], tuning: 'egal', pair: 0 };

const TUNINGS: TuningId[] = ['egal', 'pur', 'pythagore'];

export function normalizeNotes(notes: readonly number[]): number[] {
  return [...new Set(notes.filter((n) => Number.isInteger(n) && n >= MIDI_MIN && n <= MIDI_MAX))].sort((a, b) => a - b).slice(0, MAX_NOTES);
}

export function readStateFromUrl(search: string): VizState {
  const p = new URLSearchParams(search);
  const notesParam = p.get('notes');
  const notes = notesParam === null ? DEFAULT_STATE.notes : normalizeNotes(notesParam.split(',').map(Number));
  const t = p.get('accord');
  const tuning = TUNINGS.includes(t as TuningId) ? (t as TuningId) : DEFAULT_STATE.tuning;
  const pair = Math.max(0, Number(p.get('paire')) || 0);
  return { notes, tuning, pair };
}

export function stateToSearch(state: VizState): string {
  const p = new URLSearchParams();
  if (state.notes.join(',') !== DEFAULT_STATE.notes.join(',')) p.set('notes', state.notes.join(','));
  if (state.tuning !== DEFAULT_STATE.tuning) p.set('accord', state.tuning);
  if (state.pair !== 0) p.set('paire', String(state.pair));
  const s = p.toString();
  return s ? `?${s.replace(/%2C/g, ',')}` : '';
}
