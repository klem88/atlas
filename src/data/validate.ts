import {
  PROPERTY_TYPES,
  PriceSource,
  SCHEMA_VERSION,
  type PricesFile,
  type RatesFile,
} from './contract';

/** Bornes de plausibilité d'un prix au m² en France (€). */
export const PXM2_MIN = 100;
export const PXM2_MAX = 50_000;

/** Bornes de plausibilité d'un taux de crédit immobilier (%). */
export const RATE_MIN = 0;
export const RATE_MAX = 15;

export class DataValidationError extends Error {
  override name = 'DataValidationError';
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new DataValidationError(message);
}

const VALID_SOURCES = new Set<number>(Object.values(PriceSource));

/** Vérifie la forme et la cohérence d'un fichier de prix. Lève DataValidationError sinon. */
export function validatePrices(data: unknown): PricesFile {
  const f = data as PricesFile;
  assert(f && typeof f === 'object', 'prices: objet attendu');
  assert(f.schemaVersion === SCHEMA_VERSION, `prices: schemaVersion ${String(f.schemaVersion)} ≠ ${SCHEMA_VERSION}`);
  assert(Array.isArray(f.years) && f.years.length > 0, 'prices: years vide');
  assert(
    f.years.every((y, i) => Number.isInteger(y) && (i === 0 || y === f.years[i - 1]! + 1)),
    'prices: years doit être une suite continue d’entiers',
  );
  assert(Array.isArray(f.codes) && f.codes.length > 0, 'prices: codes vide');
  assert(new Set(f.codes).size === f.codes.length, 'prices: codes en double');

  const expected = f.codes.length * f.years.length;
  for (const type of PROPERTY_TYPES) {
    const s = f.series?.[type];
    assert(s, `prices: série ${type} manquante`);
    for (const key of ['pxm2', 'n', 'src'] as const) {
      assert(s[key].length === expected, `prices.${type}.${key}: longueur ${s[key].length} ≠ ${expected}`);
    }
    for (let i = 0; i < expected; i++) {
      const px = s.pxm2[i] ?? null;
      const src = s.src[i]!;
      assert(VALID_SOURCES.has(src), `prices.${type}.src[${i}] invalide: ${src}`);
      assert((px === null) === (src === PriceSource.None), `prices.${type}[${i}]: prix et source incohérents`);
      if (px !== null) {
        assert(px >= PXM2_MIN && px <= PXM2_MAX, `prices.${type}.pxm2[${i}] hors bornes: ${px}`);
      }
      assert(Number.isInteger(s.n[i]) && s.n[i]! >= 0, `prices.${type}.n[${i}] invalide`);
    }
  }
  return f;
}

/** Vérifie la forme d'un fichier de taux, et qu'il couvre les années demandées. */
export function validateRates(data: unknown, requiredYears: readonly number[] = []): RatesFile {
  const f = data as RatesFile;
  assert(f && typeof f === 'object', 'rates: objet attendu');
  assert(f.schemaVersion === SCHEMA_VERSION, `rates: schemaVersion ${String(f.schemaVersion)} ≠ ${SCHEMA_VERSION}`);
  assert(Array.isArray(f.monthly) && f.monthly.length > 0, 'rates: série mensuelle vide');
  for (const { period, rate } of f.monthly) {
    assert(/^\d{4}-\d{2}$/.test(period), `rates: période invalide ${period}`);
    assert(rate >= RATE_MIN && rate <= RATE_MAX, `rates: taux hors bornes ${period}=${rate}`);
  }
  for (const year of requiredYears) {
    const r = f.annual?.[String(year)];
    assert(typeof r === 'number', `rates: année ${year} manquante`);
  }
  return f;
}
