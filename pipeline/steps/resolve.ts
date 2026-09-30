import { PriceSource } from '../../src/data/contract';
import { PXM2_MAX, PXM2_MIN } from '../../src/data/validate';

export interface Observation {
  /** Prix médian au m² (€), null si masqué par le secret statistique. */
  pxm2: number | null;
  /** Nombre de ventes. */
  n: number;
}

export interface Candidates {
  communeAnnual?: Observation | undefined;
  communeTriennial?: Observation | undefined;
  epciAnnual?: Observation | undefined;
  epciTriennial?: Observation | undefined;
}

export interface Resolved {
  pxm2: number | null;
  src: PriceSource;
  /** Vrai si une valeur a été écartée car hors bornes de plausibilité. */
  rejectedOutlier: boolean;
}

const CASCADE = [
  ['communeAnnual', PriceSource.CommuneAnnual],
  ['communeTriennial', PriceSource.CommuneTriennial],
  ['epciAnnual', PriceSource.EpciAnnual],
  ['epciTriennial', PriceSource.EpciTriennial],
] as const;

/**
 * Choisit le prix le plus fiable disponible pour une commune et une année :
 * commune annuel → commune triennal → EPCI annuel → EPCI triennal.
 * Les valeurs hors bornes de plausibilité sont ignorées (et signalées).
 */
export function resolvePrice(candidates: Candidates): Resolved {
  let rejectedOutlier = false;
  for (const [key, src] of CASCADE) {
    const px = candidates[key]?.pxm2;
    if (px == null || !Number.isFinite(px)) continue;
    if (px < PXM2_MIN || px > PXM2_MAX) {
      rejectedOutlier = true;
      continue;
    }
    return { pxm2: Math.round(px), src, rejectedOutlier };
  }
  return { pxm2: null, src: PriceSource.None, rejectedOutlier };
}
