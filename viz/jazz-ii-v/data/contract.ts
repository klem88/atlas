/**
 * Contrat des données de « Les ii–V du jazz », écrites par pipeline/build.ts dans public/data/jazz-ii-v/.
 *
 * - `frequences.json` (petit, chargé à l'ouverture) : pour chaque progression, le nombre de standards de l'iRb
 *   qui la contiennent, et où.
 * - `standards.json` (chargé à la demande) : la grille aplatie de chaque standard trouvé, en noms français.
 */

export const SCHEMA_VERSION = 1;

export interface Frequences {
  version: number;
  /** Nombre de standards dans l'iRb. */
  total: number;
  progressions: FrequenceProgression[];
}

export interface FrequenceProgression {
  id: string;
  /** Nombre de standards qui contiennent la progression. */
  n: number;
  /** Morceaux (indice dans standards.json) et occurrences [début, longueur] dans leur grille aplatie. */
  morceaux: { s: number; m: [number, number][] }[];
}

export interface Standards {
  version: number;
  morceaux: Standard[];
}

export interface Standard {
  /** Titre. */
  t: string;
  /** Compositeur. */
  c?: string;
  /** Année. */
  a?: number;
  /** Tonalité (« Si♭ majeur »). */
  ton?: string;
  /** Grille aplatie, accords répétés fusionnés, en noms français (« Ré m7 »). */
  accords: string[];
}

export function validerFrequences(x: Frequences): Frequences {
  if (x.version !== SCHEMA_VERSION || !(x.total > 0) || !Array.isArray(x.progressions)) throw new Error('frequences.json : en-tête invalide');
  for (const p of x.progressions) {
    if (typeof p.id !== 'string' || p.n !== p.morceaux.length) throw new Error(`frequences.json : ${p.id} incohérente`);
    for (const m of p.morceaux) if (!Number.isInteger(m.s) || m.m.length === 0) throw new Error(`frequences.json : ${p.id}, morceau ${m.s} sans occurrence`);
  }
  return x;
}

export function validerStandards(x: Standards, frequences: Frequences): Standards {
  if (x.version !== SCHEMA_VERSION) throw new Error('standards.json : version');
  for (const p of frequences.progressions)
    for (const m of p.morceaux) {
      const s = x.morceaux[m.s];
      if (!s) throw new Error(`standards.json : morceau ${m.s} absent`);
      for (const [d, l] of m.m) if (d < 0 || d >= s.accords.length || l < 2) throw new Error(`standards.json : occurrence hors grille dans « ${s.t} »`);
    }
  return x;
}
