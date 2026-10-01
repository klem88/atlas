/**
 * Contrat des données de « Où le solo respire » (`public/data/ou-le-solo-respire/solos.json`).
 * Pour chaque standard de la Weimar Jazz Database : sa grille (texte de la base, mise en parties et mesures) et, pour
 * chaque solo, les comptes de degrés relatifs joués sur chaque symbole d'accord de la grille. Aucune note n'est
 * réexportée dans l'ordre : uniquement des comptes par (solo, accord, degré).
 */
import type { Quality } from '@shell/music/chords';
import type { GridSection } from '../domain/solo';

export const SCHEMA_VERSION = 1;

/** Comptes des douze degrés relatifs à l'accord : toutes les notes, et celles qui tombent sur le temps. */
export interface Dist {
  all: number[];
  beat: number[];
}

export interface SoloRecord {
  melid: number;
  performer: string;
  instrument: string;
  style: string;
  year: number | null;
  /** Par symbole d'accord tel qu'écrit dans la base (« Bb6 », « G-7 »). */
  chords: Record<string, Dist>;
  notes: number;
}

export interface Tune {
  id: string;
  title: string;
  composer: string;
  key: string;
  grid: GridSection[];
  solos: SoloRecord[];
}

export interface TypeAgg {
  quality: Quality;
  label: string;
  /** Nombre d'occurrences d'accords de ce type dans les grilles jouées. */
  occurrences: number;
  dist: Dist;
}

export interface SolosFile {
  version: number;
  generatedAt: string;
  totals: { tunes: number; solos: number; notes: number; performers: number };
  tunes: Tune[];
  types: TypeAgg[];
}
