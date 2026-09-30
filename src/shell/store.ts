/** Store minimal : un état immuable, des abonnés notifiés à chaque changement. */
export interface Store<S> {
  get(): S;
  set(patch: Partial<S>): void;
  subscribe(listener: (state: S, previous: S) => void): () => void;
}

export function createStore<S extends object>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<(state: S, previous: S) => void>();
  return {
    get: () => state,
    set(patch) {
      const previous = state;
      const next = { ...state, ...patch };
      if (Object.keys(patch).every((k) => Object.is(previous[k as keyof S], next[k as keyof S]))) return;
      state = next;
      for (const l of listeners) l(state, previous);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
