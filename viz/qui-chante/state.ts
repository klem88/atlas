/** État de la page reflété dans l'URL : un lien partagé redonne la même commune. */

export interface VizState {
  /** Code INSEE de la commune choisie. */
  commune: string | null;
}

export function readStateFromUrl(search: string): VizState {
  const code = new URLSearchParams(search).get('commune');
  return { commune: code && /^[0-9AB]{5}$/i.test(code) ? code.toUpperCase() : null };
}

export function stateToSearch(state: VizState): string {
  return state.commune ? `?commune=${state.commune}` : '';
}
