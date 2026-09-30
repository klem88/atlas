/** État de la page reflété dans l'URL : notes, accordage et régime de temps. */
import type { TuningId } from '@shell/music/tuning';
import type { TimeMode } from './scene/scene';

export interface VizState {
  /** Notes MIDI, sans doublon, croissantes, trois au plus. */
  notes: number[];
  tuning: 'pur' | 'egal';
  mode: TimeMode;
}

export const MIDI_MIN = 36;
export const MIDI_MAX = 84;
export const MAX_NOTES = 3;

export const DEFAULT_STATE: VizState = { notes: [60, 64, 67], tuning: 'pur', mode: 'normal' };

export function normalizeNotes(notes: readonly number[]): number[] {
  return [...new Set(notes.filter((n) => Number.isInteger(n) && n >= MIDI_MIN && n <= MIDI_MAX))].sort((a, b) => a - b).slice(0, MAX_NOTES);
}

export function readStateFromUrl(search: string): VizState {
  const p = new URLSearchParams(search);
  const notesParam = p.get('notes');
  const notes = notesParam === null ? DEFAULT_STATE.notes : normalizeNotes(notesParam.split(',').map(Number));
  const t = p.get('accord');
  const tuning: VizState['tuning'] = t === 'egal' || t === 'pur' ? t : DEFAULT_STATE.tuning;
  const m = p.get('temps');
  const mode: TimeMode = m === 'dessin' || m === 'normal' ? m : DEFAULT_STATE.mode;
  return { notes, tuning, mode };
}

export function stateToSearch(state: VizState): string {
  const p = new URLSearchParams();
  if (state.notes.join(',') !== DEFAULT_STATE.notes.join(',')) p.set('notes', state.notes.join(','));
  if (state.tuning !== DEFAULT_STATE.tuning) p.set('accord', state.tuning);
  if (state.mode !== DEFAULT_STATE.mode) p.set('temps', state.mode);
  const s = p.toString();
  return s ? `?${s.replace(/%2C/g, ',')}` : '';
}

export type { TuningId };
