import type { RatesFile } from './data/contract';
import { isEstimate, type PriceStatus, type PriceTable } from './data/prices';
import { affordableArea, purchaseCapacity, type PurchaseCapacity } from './domain/affordability';
import { AREA_CLASSES, classIndex } from './domain/classes';
import type { VizState } from './state';

/**
 * Relie l'état de l'interface aux données et au modèle de calcul.
 * Aucune manipulation du DOM ici : tout est testable et réutilisable.
 */
export class Model {
  constructor(
    readonly prices: PriceTable,
    readonly rates: RatesFile,
  ) {}

  get years(): readonly number[] {
    return this.prices.years;
  }

  rateFor(year: number): number {
    const r = this.rates.annual[String(year)];
    if (r === undefined) throw new Error(`Taux manquant pour ${year}`);
    return r;
  }

  capacity(state: VizState, year = state.year): PurchaseCapacity {
    return purchaseCapacity({
      netMonthlyIncome: state.netMonthlyIncome,
      year,
      annualRatePct: this.rateFor(year),
      assumptions: state.assumptions,
    });
  }

  communeAt(state: VizState, code: string, year = state.year): CommuneResult {
    const status = this.prices.lookup(code, year, state.mode);
    if (status.kind !== 'ok') return { status };
    const area = affordableArea(this.capacity(state, year).maxPrice, status.price.pxm2);
    return { status, area, classIndex: classIndex(area), estimate: isEstimate(status.price.src) };
  }

  /** Surface achetable dans une commune pour chaque année (null si pas de prix). */
  communeSeries(state: VizState, code: string): { x: number; y: number | null }[] {
    return this.years.map((year) => {
      const r = this.communeAt(state, code, year);
      return { x: year, y: r.area ?? null };
    });
  }
}

export interface CommuneResult {
  status: PriceStatus;
  area?: number;
  classIndex?: number;
  estimate?: boolean;
}

export const CLASS_COUNT = AREA_CLASSES.length;
