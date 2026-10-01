/** État dans l'URL : `?morceau=12&soliste=34&mesure=temps&accord=G7`. */
export interface VizState {
  tune: string | null;
  /** melid d'un solo, ou null pour tous les solistes. */
  solo: number | null;
  onBeat: boolean;
  chord: string | null;
}

export const DEFAULT_STATE: VizState = { tune: null, solo: null, onBeat: false, chord: null };

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const t = q.get('morceau');
  const s = Number(q.get('soliste'));
  const c = q.get('accord');
  return {
    tune: t && /^\d{1,5}$/.test(t) ? t : null,
    solo: Number.isInteger(s) && s > 0 ? s : null,
    onBeat: q.get('mesure') === 'temps',
    chord: c && /^[A-G][#b]?[\w+#/-]{0,12}$/.test(c) ? c : null,
  };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  if (s.tune) q.set('morceau', s.tune);
  if (s.solo !== null) q.set('soliste', String(s.solo));
  if (s.onBeat) q.set('mesure', 'temps');
  if (s.chord) q.set('accord', s.chord);
  const str = q.toString().replace(/%2F/g, '/').replace(/%23/g, '#').replace(/%2B/g, '+');
  return str ? `?${str}` : '';
}
