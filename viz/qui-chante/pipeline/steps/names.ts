/**
 * Noms des espèces : nom scientifique (référentiel GBIF) et nom français.
 */

export interface VernacularName {
  vernacularName: string;
  language?: string;
  source?: string;
  preferred?: boolean;
}

/** Sources de noms français, de la plus sûre à la moins sûre. TAXREF est le référentiel national. */
const SOURCE_PRIORITY = ['TAXREF', 'EUNIS', 'Catalogue of Life'];

/**
 * Choisit le nom français : TAXREF d'abord, puis les autres sources, puis le nom le plus fréquent.
 * Renvoie null s'il n'existe aucun nom français.
 */
export function pickFrenchName(names: readonly VernacularName[]): string | null {
  const fr = names.filter((n) => n.language === 'fra' && n.vernacularName.trim());
  if (fr.length === 0) return null;
  for (const source of SOURCE_PRIORITY) {
    const hit = fr.find((n) => n.source?.startsWith(source));
    if (hit) return capitalize(hit.vernacularName.trim());
  }
  const freq = new Map<string, number>();
  for (const n of fr) {
    const k = capitalize(n.vernacularName.trim());
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  return [...freq].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))[0]![0];
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('fr') + s.slice(1);
