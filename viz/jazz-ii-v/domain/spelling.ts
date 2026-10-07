/**
 * Noms des notes à la française, orthographiés par degré : le ♭II de do s'écrit ré♭, le ♯I s'écrit do♯.
 * Une double altération (le ♭II de sol♭) est remplacée par son enharmonique simple.
 */

export type Mode = 'majeur' | 'mineur';

const LETTRES = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'] as const;
const NATURELLE = [0, 2, 4, 5, 7, 9, 11] as const;
/** Intervalles de la gamme majeure : les degrés sont comptés depuis elle (« b3 » = tierce mineure). */
const MAJEURE = [0, 2, 4, 5, 7, 9, 11] as const;

/** Les douze toniques dans l'ordre où on les travaille : le cycle des quartes, depuis do. */
export const CYCLE_QUARTES: readonly number[] = [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7];

const TONIQUES_MAJEURES = ['Do', 'Ré♭', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Sol♭', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const TONIQUES_MINEURES = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'Si♭', 'Si'];
/** Repli pour les doubles altérations. */
const SIMPLES = TONIQUES_MAJEURES;

const mod12 = (n: number) => ((n % 12) + 12) % 12;

export function tonicName(pc: number, mode: Mode): string {
  return (mode === 'majeur' ? TONIQUES_MAJEURES : TONIQUES_MINEURES)[mod12(pc)]!;
}

/** Classe de hauteur d'un nom français (« Si♭ » → 10). */
export function pitchOfName(nom: string): number {
  const { lettre, alteration } = lireNom(nom);
  return mod12(NATURELLE[lettre]! + alteration);
}

export function lireNom(nom: string): { lettre: number; alteration: number } {
  const lettre = LETTRES.findIndex((l) => nom.startsWith(l));
  if (lettre < 0) throw new Error(`Note inconnue : ${nom}`);
  const reste = nom.slice(LETTRES[lettre]!.length);
  let alteration = 0;
  for (const c of reste) alteration += c === '♯' ? 1 : c === '♭' ? -1 : 0;
  return { lettre, alteration };
}

/** Altération que demanderait le degré, avant tout repli (2 = double dièse, -2 = double bémol). */
export function alterationBrute(tonique: string, degre: string): number {
  const m = /^([b#]*)([1-7])$/.exec(degre);
  if (!m) throw new Error(`Degré illisible : ${degre}`);
  const d = Number(m[2]) - 1;
  const decalage = [...m[1]!].reduce((s, c) => s + (c === '#' ? 1 : -1), 0);
  const t = lireNom(tonique);
  const pc = mod12(NATURELLE[t.lettre]! + t.alteration + MAJEURE[d]! + decalage);
  let alteration = pc - NATURELLE[(t.lettre + d) % 7]!;
  if (alteration > 6) alteration -= 12;
  if (alteration < -6) alteration += 12;
  return alteration;
}

/** L'autre nom d'une note altérée (sol♭ ↔ fa♯) ; une note naturelle garde le sien. */
export function enharmonique(nom: string): string {
  const pc = pitchOfName(nom);
  if (nom.includes('♭')) return DIESES_SIMPLES[pc]!;
  if (nom.includes('♯')) return SIMPLES[pc]!;
  return nom;
}
const DIESES_SIMPLES = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];

/** Nom de la note au degré donné (« 2 », « b2 », « #1 », « b7 »…) au-dessus de la tonique. */
export function spellDegree(tonique: string, degre: string): string {
  const m = /^([b#]*)([1-7])$/.exec(degre);
  if (!m) throw new Error(`Degré illisible : ${degre}`);
  const d = Number(m[2]) - 1;
  const decalage = [...m[1]!].reduce((s, c) => s + (c === '#' ? 1 : -1), 0);
  const t = lireNom(tonique);
  const pc = mod12(NATURELLE[t.lettre]! + t.alteration + MAJEURE[d]! + decalage);
  const lettre = (t.lettre + d) % 7;
  let alteration = pc - NATURELLE[lettre]!;
  if (alteration > 6) alteration -= 12;
  if (alteration < -6) alteration += 12;
  if (Math.abs(alteration) > 1) return SIMPLES[pc]!;
  return LETTRES[lettre]! + (alteration === 1 ? '♯' : alteration === -1 ? '♭' : '');
}
