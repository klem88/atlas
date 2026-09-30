/**
 * Contrat des données de « La boussole des styles » (`public/data/carte-des-styles/`).
 * - `styles.json` : les axes communs (les transitions les plus fréquentes du corpus), et par style ses parts,
 *   ses transitions signatures et son centre (pour dire à quel style ressemble un morceau).
 * - `songs.json` : les morceaux nommés (iRb, Billboard), pour le jeu « à quel style ressemble mon morceau ».
 */
import type { NamedSongRecord } from '@tools/lib/named-songs';

export const SCHEMA_VERSION = 1;
/** Nombre d'axes de la rose. */
export const AXES = 12;
/** Nombre de transitions signatures affichées par style. */
export const SIGNATURES = 5;
/** Part minimale (dans le style) pour qu'une transition puisse être signature. */
export const MIN_SHARE = 0.005;

export type NamedSong = NamedSongRecord;

/** Une transition entre classes (0–23 : degré × majeur/mineur). */
export type Transition = [number, number];

export interface Signature {
  from: number;
  to: number;
  /** Part de la transition dans le style (0–1). */
  share: number;
  /** Part dans l'ensemble des tablatures. */
  base: number;
  /** share / base. */
  lift: number;
}

export interface StyleRose {
  key: string;
  label: string;
  kind: 'genre' | 'corpus';
  songs: number;
  transitions: number;
  /** Rapport style / ensemble sur chacun des axes (AXES valeurs). */
  axes: number[];
  signatures: Signature[];
  /** Centre du style : moyenne des vecteurs (576 valeurs, racine des fréquences), arrondi. */
  centroid: number[];
}

export interface StylesFile {
  version: number;
  generatedAt: string;
  /** Les axes communs : transitions les plus fréquentes de l'ensemble, avec leur part. */
  axes: { transition: Transition; base: number }[];
  /** Parts de toutes les transitions dans l'ensemble (576 valeurs), base des rapports. */
  baseShares: number[];
  styles: StyleRose[];
}

export interface SongsFile {
  version: number;
  songs: NamedSong[];
}
