/**
 * Noms des espèces : nom scientifique (référentiel GBIF) et nom français.
 */

export interface VernacularName {
  vernacularName: string;
  language?: string;
  source?: string;
  preferred?: boolean;
}

/**
 * Choisit le nom français : celui de TAXREF (référentiel national) s'il existe, sinon le nom
 * le plus cité par les autres sources (sans tenir compte de la casse), l'ordre alphabétique départageant.
 * Renvoie null s'il n'existe aucun nom français.
 */
export function pickFrenchName(names: readonly VernacularName[]): string | null {
  const fr = names.filter((n) => n.language === 'fra' && n.vernacularName.trim());
  if (fr.length === 0) return null;
  const taxref = fr.find((n) => n.source?.startsWith('TAXREF'));
  if (taxref) return capitalize(taxref.vernacularName.trim());
  // Compté sans la casse, affiché dans sa première graphie (« Verdier d'Europe » garde sa majuscule).
  const freq = new Map<string, { name: string; count: number }>();
  for (const n of fr) {
    const name = capitalize(n.vernacularName.trim());
    const k = name.toLocaleLowerCase('fr');
    freq.set(k, { name: freq.get(k)?.name ?? name, count: (freq.get(k)?.count ?? 0) + 1 });
  }
  return [...freq.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))[0]!.name;
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('fr') + s.slice(1);
