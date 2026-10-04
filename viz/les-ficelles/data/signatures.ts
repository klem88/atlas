/**
 * Les titres où l'on entend chaque ficelle. Chaque entrée vient d'une source publiée (analyse, partition éditée) et
 * reste « à vérifier » tant que l'auteur ne l'a pas validée à l'oreille au piano ; seules les entrées validées
 * s'affichent. On ne reproduit pas les grilles : on nomme le geste et on renvoie vers une recherche d'écoute.
 */
import type { FicelleId } from '../domain/ficelles';

export type Auteur = 'Michel Berger' | 'Julien Clerc' | 'Michel Polnareff';

export interface Signature {
  ficelle: FicelleId;
  auteur: Auteur;
  titre: string;
  /** Où l'entendre : « l’introduction », « le pont », « l’entrée du refrain ». */
  passage: string;
  /** La source publiée consultée. */
  source: string;
  etat: 'a-verifier' | 'valide';
}

export const SIGNATURES: readonly Signature[] = [];

export const signaturesDe = (id: FicelleId): Signature[] => SIGNATURES.filter((s) => s.ficelle === id && s.etat === 'valide');

export const ecouteUrl = (s: Signature): string => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.auteur} ${s.titre}`)}`;
