import { PriceSource, priceIndex, type PricesFile, type PropertyType } from './contract';

/** Ce que l'utilisateur choisit de regarder. */
export type PropertyMode = PropertyType | 'moins-cher';

export interface PriceLookup {
  pxm2: number;
  type: PropertyType;
  src: PriceSource;
  /** Ventes de ce type dans la commune cette année-là. */
  n: number;
}

export type PriceStatus =
  | { kind: 'ok'; price: PriceLookup }
  /** Territoire absent de DVF (Alsace-Moselle, Mayotte). */
  | { kind: 'uncovered' }
  /** Aucun marché mesurable, même à l'échelle de l'intercommunalité. */
  | { kind: 'no-market' };

/** Estimation = prix emprunté à l'intercommunalité, pas mesuré dans la commune. */
export function isEstimate(src: PriceSource): boolean {
  return src === PriceSource.EpciAnnual || src === PriceSource.EpciTriennial;
}

/** Accès rapide aux prix par code INSEE, année et type de bien. */
export class PriceTable {
  readonly years: readonly number[];
  private readonly indexByCode: Map<string, number>;
  private readonly uncoveredPrefixes: readonly string[];

  constructor(private readonly file: PricesFile) {
    this.years = file.years;
    this.indexByCode = new Map(file.codes.map((c, i) => [c, i]));
    this.uncoveredPrefixes = file.uncoveredDepartements;
  }

  get firstYear(): number {
    return this.years[0]!;
  }

  get lastYear(): number {
    return this.years.at(-1)!;
  }

  has(code: string): boolean {
    return this.indexByCode.has(code);
  }

  lookup(code: string, year: number, mode: PropertyMode): PriceStatus {
    if (this.uncoveredPrefixes.some((p) => code.startsWith(p))) return { kind: 'uncovered' };
    const ci = this.indexByCode.get(code);
    const yi = this.years.indexOf(year);
    if (ci === undefined || yi === -1) return { kind: 'no-market' };

    const i = priceIndex(this.file, ci, yi);
    const candidates = (mode === 'moins-cher' ? (['maison', 'appartement'] as const) : [mode])
      .map((type): PriceLookup | null => {
        const s = this.file.series[type];
        const pxm2 = s.pxm2[i];
        return pxm2 == null ? null : { pxm2, type, src: s.src[i]!, n: s.n[i]! };
      })
      .filter((c): c is PriceLookup => c !== null);

    if (candidates.length === 0) return { kind: 'no-market' };
    const cheapest = candidates.reduce((a, b) => (b.pxm2 < a.pxm2 ? b : a));
    return { kind: 'ok', price: cheapest };
  }
}
