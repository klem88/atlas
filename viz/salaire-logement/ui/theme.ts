import type { MapTheme } from '../map/renderer';

export interface VizTheme {
  map: MapTheme;
  ramp: string[];
  noData: string;
  noMarket: string;
}

/** Lit les jetons CSS courants (clair ou sombre) pour le rendu canvas. */
export function readTheme(): VizTheme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    ramp: Array.from({ length: 7 }, (_, i) => v(`--ramp-${i}`)),
    noData: v('--no-data'),
    noMarket: v('--no-market'),
    map: {
      surface: v('--surface'),
      border: v('--ink-3'),
      ink: v('--ink'),
      ink3: v('--ink-3'),
      accent: v('--accent'),
      hatch: v('--hatch'),
      hatchInk: v('--hatch-ink'),
    },
  };
}

/** Appelle `onChange` quand le thème clair/sombre du système change. */
export function watchTheme(onChange: () => void): void {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onChange);
}
