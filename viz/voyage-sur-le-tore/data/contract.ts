/**
 * Contrat des données de « Le voyage sur le tore » (`public/data/voyage-sur-le-tore/`).
 * - `songs.json` : les morceaux nommés (iRb, Billboard) avec leurs grilles ; le chemin se calcule dans le navigateur.
 * - `styles.json` : par style, la répartition des distances PLR entre accords successifs (calculée par le pipeline sur
 *   Chordonomicon, l'iRb et le Billboard).
 */
import type { NamedSongRecord } from '@tools/lib/named-songs';

export const SCHEMA_VERSION = 1;
export type NamedSong = NamedSongRecord;

export interface SongsFile {
  version: number;
  songs: NamedSong[];
}

export interface StyleSteps {
  key: string;
  label: string;
  kind: 'all' | 'genre' | 'decade' | 'corpus';
  songs: number;
  /** Nombre de pas (changements d'accord) comptés. */
  steps: number;
  /** Distance PLR moyenne d'un pas. */
  mean: number;
  /** Répartition des distances : indice = distance, 0 à 5 (5 = cinq et plus). */
  histogram: number[];
}

export interface StylesFile {
  version: number;
  generatedAt: string;
  styles: StyleSteps[];
}
