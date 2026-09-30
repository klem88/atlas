/** Formats numériques français partagés (espaces fines insécables comme séparateurs). */

const integer = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const twoDecimals = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtInt = (n: number) => integer.format(n);
export const fmtEuros = (n: number) => `${integer.format(n)} €`;
export const fmtPct = (n: number, digits: 1 | 2 = 2) => `${(digits === 1 ? oneDecimal : twoDecimals).format(n)} %`;

/** Arrondi lisible d'un montant : 187 432 → « 187 000 € ». */
export function fmtEurosRounded(n: number): string {
  const step = n >= 100_000 ? 1000 : n >= 10_000 ? 500 : 100;
  return fmtEuros(Math.round(n / step) * step);
}

/** Lit un nombre saisi à la française (« 2 400 », « 2400,50 »). */
export function parseFrenchNumber(input: string): number | null {
  const cleaned = input.replace(/[\s  €]/g, '').replace(',', '.');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
