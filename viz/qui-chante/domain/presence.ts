/**
 * Présence d'une espèce autour de soi : part des observations d'oiseaux du voisinage
 * qui la concernent, rangée en classes à seuils fixes (une classe garde le même sens
 * d'une commune à l'autre).
 */

export const PRESENCE_CLASSES = [
  { min: 0.02, label: 'très présent' },
  { min: 0.005, label: 'présent' },
  { min: 0.001, label: 'peu présent' },
  { min: 0, label: 'rare' },
] as const;

/** Indice de classe : 0 = très présent … 3 = rare. */
export function presenceClass(count: number, total: number): number {
  const share = total > 0 ? count / total : 0;
  return PRESENCE_CLASSES.findIndex((c) => share >= c.min);
}

/** En dessous de ce nombre d'observations dans le voisinage, la liste est sans doute incomplète. */
export const LOW_EFFORT = 5000;

/** Énumération à la française : « A, B et C ». */
export function frenchList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`;
}

/** Nom d'espèce au milieu d'une phrase : « Merle noir » → « merle noir ». */
export const inSentence = (name: string) => name.charAt(0).toLocaleLowerCase('fr') + name.slice(1);
