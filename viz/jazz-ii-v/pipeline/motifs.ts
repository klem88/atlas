/**
 * Recherche des progressions dans une grille de standard, quelle que soit sa tonalité : on compare les intervalles
 * entre fondamentales et les qualités d'accords, jamais les noms. La grille est aplatie (sections dans l'ordre),
 * les accords répétés fusionnés, et la fin rejoint le début (le turnaround final ramène au premier accord).
 */
import type { Chord } from '@shell/music/chords';
import type { Motif } from '../domain/progressions';

const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** Fusionne les accords identiques qui se suivent (même fondamentale, même qualité ; la basse est ignorée). */
export function fusionnerRepetitions(suite: readonly (Chord | null)[]): Chord[] {
  const out: Chord[] = [];
  for (const c of suite) {
    if (!c) continue;
    const prec = out[out.length - 1];
    if (prec && prec.root === c.root && prec.quality === c.quality) continue;
    out.push({ root: c.root, quality: c.quality });
  }
  // La fin rejoint le début : un dernier accord identique au premier ne compte qu'une fois.
  if (out.length > 1 && out[0]!.root === out[out.length - 1]!.root && out[0]!.quality === out[out.length - 1]!.quality) out.pop();
  return out;
}

/** Indices de départ du motif dans la suite (en boucle). */
export function trouverMotif(suite: readonly Chord[], motif: readonly Motif[]): number[] {
  const n = suite.length;
  if (n < motif.length) return [];
  const debuts: number[] = [];
  for (let i = 0; i < n; i++) {
    const r0 = suite[i]!.root;
    const ok = motif.every((m, j) => {
      const c = suite[(i + j) % n]!;
      return m.qualites.includes(c.quality) && mod12(c.root - r0) === m.intervalle;
    });
    if (ok) debuts.push(i);
  }
  return debuts;
}

/** Toutes les occurrences des variantes d'une progression : [début, longueur], triées. */
export function occurrences(suite: readonly Chord[], variantes: readonly (readonly Motif[])[]): [number, number][] {
  const out: [number, number][] = [];
  for (const v of variantes) for (const d of trouverMotif(suite, v)) out.push([d, v.length]);
  return out.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
}
