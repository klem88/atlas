/**
 * Les modes à jouer sur chaque accord, et les notes qui comptent : les notes guides (3ce et 7e),
 * qui disent la couleur de l'accord, et la note à viser sur l'accord suivant (sa 3ce).
 */
import { alterationBrute, spellDegree } from './spelling';

export type ModeId =
  | 'ionien'
  | 'dorien'
  | 'phrygien'
  | 'lydien'
  | 'mixolydien'
  | 'locrien'
  | 'altere'
  | 'phrygienDominant'
  | 'melodique'
  | 'lydienB7'
  | 'tonDemiTon';

export interface ModeInfo {
  nom: string;
  /** Intervalles depuis la fondamentale, en demi-tons. */
  intervalles: readonly number[];
  /** Une phrase : ce qui distingue ce mode, à l'oreille ou sous les doigts. */
  couleur: string;
}

export const MODES: Readonly<Record<ModeId, ModeInfo>> = {
  ionien: { nom: 'ionien (majeur)', intervalles: [0, 2, 4, 5, 7, 9, 11], couleur: 'La gamme majeure. La 4te frotte contre la 3ce : passe dessus sans t’y poser.' },
  dorien: { nom: 'dorien', intervalles: [0, 2, 3, 5, 7, 9, 10], couleur: 'Mineur avec une 6te majeure, la note qui le rend lumineux.' },
  phrygien: { nom: 'phrygien', intervalles: [0, 1, 3, 5, 7, 8, 10], couleur: 'Mineur avec une 2de mineure : la gamme du ton, jouée depuis la 3ce.' },
  lydien: { nom: 'lydien', intervalles: [0, 2, 4, 6, 7, 9, 11], couleur: 'Majeur avec une 4te augmentée : plus ouvert, sans note à éviter.' },
  mixolydien: { nom: 'mixolydien', intervalles: [0, 2, 4, 5, 7, 9, 10], couleur: 'Majeur avec une 7e mineure : la gamme de la dominante.' },
  locrien: { nom: 'locrien', intervalles: [0, 1, 3, 5, 6, 8, 10], couleur: 'La gamme du demi-diminué : 5te diminuée, tout penche vers la suite.' },
  altere: { nom: 'altéré', intervalles: [0, 1, 3, 4, 6, 8, 10], couleur: 'Toutes les tensions altérées (♭9, ♯9, ♭5, ♭13) : la dominante la plus tendue, qui veut tomber sur le mineur.' },
  phrygienDominant: { nom: 'mixolydien ♭9 ♭13', intervalles: [0, 1, 4, 5, 7, 8, 10], couleur: 'Une dominante qui va vers un accord mineur : ♭9 et ♭13, un parfum mineur harmonique.' },
  melodique: { nom: 'mineur mélodique', intervalles: [0, 2, 3, 5, 7, 9, 11], couleur: 'Mineur avec 6te et 7e majeures : le mineur moderne du jazz, sans note à éviter.' },
  lydienB7: { nom: 'lydien ♭7', intervalles: [0, 2, 4, 6, 7, 9, 10], couleur: 'Mixolydien avec une 4te augmentée : la gamme de la substitution tritonique.' },
  tonDemiTon: { nom: 'diminuée ton/demi-ton', intervalles: [0, 2, 3, 5, 6, 8, 9, 11], couleur: 'Huit notes, ton puis demi-ton : symétrique, elle glisse d’elle-même vers l’accord suivant.' },
};

const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** Classes de hauteur du mode, depuis la fondamentale. */
export function notesDuMode(racine: number, mode: ModeId): number[] {
  return MODES[mode].intervalles.map((i) => mod12(racine + i));
}

const MAJEURE = [0, 2, 4, 5, 7, 9, 11];

/**
 * Degrés qui nomment les notes des modes où « une lettre par note » trahit la fonction : l'altéré s'écrit
 * 1, ♭9, ♯9, 3, ♭5, ♭13, ♭7 (sur Sol 7 : si, pas do♭), la gamme diminuée garde la 7e diminuée de l'accord (si♭ sur do♯).
 */
const DEGRES: Partial<Record<ModeId, readonly string[]>> = {
  altere: ['1', 'b2', '#2', '3', 'b5', 'b6', 'b7'],
  tonDemiTon: ['1', '2', 'b3', '4', 'b5', 'b6', 'bb7', '7'],
};

function degresDuMode(mode: ModeId): readonly string[] {
  return (
    DEGRES[mode] ??
    MODES[mode].intervalles.map((i, k) => {
      const ecart = i - MAJEURE[k]!;
      return (ecart < 0 ? 'b'.repeat(-ecart) : '#'.repeat(ecart)) + String(k + 1);
    })
  );
}

/** Nombre de notes du mode qui demanderaient une double altération depuis cette fondamentale (si𝄫 dans sol♭ dorien). */
export function doublesAlterations(note: string, mode: ModeId): number {
  return degresDuMode(mode).filter((d) => Math.abs(alterationBrute(note, d)) > 1).length;
}

/**
 * Noms des notes du mode, depuis la fondamentale (« Ré » → ré, mi, fa…), en minuscules : une lettre par note,
 * sauf pour l'altéré et la gamme diminuée (voir `DEGRES`).
 */
export function nomsDuMode(note: string, racine: number, mode: ModeId): string[] {
  const degres = degresDuMode(mode);
  // spellDegree remplace lui-même une double altération par un nom simple.
  return degres.map((d) => spellDegree(note, d).toLowerCase());
}
