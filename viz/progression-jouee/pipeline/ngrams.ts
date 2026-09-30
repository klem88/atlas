/**
 * Comptage des suites de degrés (n-grammes de 2 à 8 jetons) sur un corpus : un morceau compte une fois
 * par suite qu'il contient, quelle que soit sa fréquence dans le morceau. Les suites sont prises à l'intérieur
 * d'une section (jamais à cheval sur deux), sur la suite des degrés sans répétition immédiate.
 *
 * Pour tenir en mémoire sur 680 000 morceaux, on procède longueur par longueur avec l'élagage a priori :
 * une suite de n jetons ne peut être vue 20 fois que si ses deux sous-suites de n − 1 jetons l'ont été.
 */

/** Sépare deux sections dans la suite compacte d'un morceau. */
export const SECTION_BREAK = 255;

export interface SongTokens {
  /** Jetons (< 72) de toutes les sections à la file, séparées par `SECTION_BREAK`. */
  tokens: Uint8Array;
  genre: number;
  decade: number;
  minor: boolean;
  year: number | null;
}

/** Clé texte d'une suite : un caractère par jeton (codes 0–71), compacte et stable. */
export const keyOf = (tokens: ArrayLike<number>) => String.fromCharCode.apply(null, tokens as number[]);

/** Suite compacte depuis des sections. */
export function packSections(sections: readonly (readonly number[])[]): Uint8Array {
  const out: number[] = [];
  for (const sec of sections) {
    if (out.length) out.push(SECTION_BREAK);
    out.push(...sec);
  }
  return Uint8Array.from(out);
}
export const tokensOfKey = (key: string) => Array.from(key, (c) => c.charCodeAt(0));

/** Les n-grammes distincts d'un morceau, comme clés. */
export function songNgrams(song: SongTokens, n: number, allowed: ReadonlySet<string> | null): Set<string> {
  const out = new Set<string>();
  const t = song.tokens;
  let start = 0;
  for (let end = 0; end <= t.length; end++) {
    if (end < t.length && t[end] !== SECTION_BREAK) continue;
    for (let i = start; i + n <= end; i++) {
      const gram = t.subarray(i, i + n);
      if (allowed) {
        if (!allowed.has(keyOf(gram.subarray(0, n - 1))) || !allowed.has(keyOf(gram.subarray(1)))) continue;
      }
      out.add(keyOf(gram));
    }
    start = end + 1;
  }
  return out;
}

/** Nombre de morceaux datés qu'il faut pour qu'une année compte comme « première fois » (une date isolée est souvent fausse). */
export const FIRST_YEAR_SUPPORT = 3;
/** En deçà, une date est tenue pour un bouche-trou (Chordonomicon a des « 1900 »). */
export const MIN_PLAUSIBLE_YEAR = 1920;

export interface Tally {
  total: number;
  minor: number;
  /** Les plus petites années vues (au plus `FIRST_YEAR_SUPPORT`), triées. */
  earliest: number[];
  byGenre: number[];
  byDecade: number[];
}

export function emptyTally(genres: number, decades: number): Tally {
  return { total: 0, minor: 0, earliest: [], byGenre: new Array<number>(genres).fill(0), byDecade: new Array<number>(decades).fill(0) };
}

/** Première année où au moins `FIRST_YEAR_SUPPORT` morceaux datés contiennent la suite ; `null` si trop peu de dates. */
export function firstYear(t: Tally): number | null {
  return t.earliest.length >= FIRST_YEAR_SUPPORT ? t.earliest[FIRST_YEAR_SUPPORT - 1]! : null;
}

function noteYear(t: Tally, year: number): void {
  if (year < MIN_PLAUSIBLE_YEAR) return;
  const e = t.earliest;
  if (e.length >= FIRST_YEAR_SUPPORT && year >= e[e.length - 1]!) return;
  let i = e.length;
  while (i > 0 && e[i - 1]! > year) i--;
  e.splice(i, 0, year);
  if (e.length > FIRST_YEAR_SUPPORT) e.pop();
}

/**
 * Compte les suites de longueur `n` sur tous les morceaux, en ne gardant que celles vues au moins `minSongs` fois.
 * `allowed` : les suites fréquentes de longueur n − 1 (ou `null` pour n = 2).
 */
export function countNgrams(
  songs: readonly SongTokens[],
  n: number,
  minSongs: number,
  allowed: ReadonlySet<string> | null,
  dims: { genres: number; decades: number },
): Map<string, Tally> {
  // Première passe : les totaux seuls (une entrée par suite distincte, c'est là que la mémoire se joue).
  const totals = new Map<string, number>();
  for (const song of songs) {
    for (const k of songNgrams(song, n, allowed)) totals.set(k, (totals.get(k) ?? 0) + 1);
  }
  const kept = new Map<string, Tally>();
  for (const [k, c] of totals) if (c >= minSongs) kept.set(k, emptyTally(dims.genres, dims.decades));
  totals.clear();
  // Seconde passe : les répartitions, pour les suites retenues seulement.
  for (const song of songs) {
    for (const k of songNgrams(song, n, allowed)) {
      const t = kept.get(k);
      if (!t) continue;
      t.total++;
      if (song.minor) t.minor++;
      if (song.genre >= 0) t.byGenre[song.genre]!++;
      if (song.decade >= 0) t.byDecade[song.decade]!++;
      if (song.year !== null) noteYear(t, song.year);
    }
  }
  return kept;
}

/** Décennies couvertes : 1950 à 2020 ; avant 1950, on range dans 1950 (rares tablatures de standards). */
export const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] as const;
export function decadeIndex(year: number | null | undefined): number {
  if (year === null || year === undefined || year < MIN_PLAUSIBLE_YEAR) return -1;
  const d = Math.floor(year / 10) * 10;
  if (d < 1950) return 0;
  const i = DECADES.indexOf(d as (typeof DECADES)[number]);
  return i < 0 ? DECADES.length - 1 : i;
}
