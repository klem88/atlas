/**
 * Modèle de capacité d'achat immobilier.
 *
 *   mensualité max  = revenu net × taux d'endettement(année)
 *   emprunt max     = mensualité max / (facteur d'annuité + assurance mensuelle)
 *   prix max        = (emprunt + apport) / (1 + frais de notaire)
 *   surface         = prix max / prix médian au m²
 *
 * Volontairement simple et entièrement paramétrable : chaque hypothèse est affichée à l'utilisateur.
 */

export interface Assumptions {
  /** Durée du prêt (années). Le HCSF plafonne à 25 ans. */
  loanYears: number;
  /** Assurance emprunteur, en % du capital initial par an. */
  insuranceRatePct: number;
  /** Frais d'acquisition (« frais de notaire ») dans l'ancien, en fraction du prix. */
  notaryFeesRate: number;
  /** Apport personnel (€). */
  downPayment: number;
}

export const DEFAULT_ASSUMPTIONS: Readonly<Assumptions> = {
  loanYears: 25,
  insuranceRatePct: 0.3,
  notaryFeesRate: 0.075,
  downPayment: 0,
};

/**
 * Taux d'endettement maximal (assurance comprise) retenu pour une année.
 * - jusqu'en 2020 : usage bancaire de 33 %, formalisé par la recommandation HCSF de décembre 2019 ;
 * - à partir de 2021 : relevé à 35 % (recommandation HCSF de janvier 2021, contraignante depuis 2022).
 */
export function debtRatioFor(year: number): number {
  return year <= 2020 ? 0.33 : 0.35;
}

/** Capital empruntable pour une mensualité donnée (assurance comprise). */
export function maxLoan(monthlyPayment: number, annualRatePct: number, years: number, insuranceRatePct: number): number {
  if (monthlyPayment <= 0 || years <= 0) return 0;
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  // Mensualité (hors assurance) par euro emprunté ; cas limite d'un taux nul traité à part.
  const annuityPerEuro = r === 0 ? 1 / n : r / (1 - (1 + r) ** -n);
  const insurancePerEuro = insuranceRatePct / 100 / 12;
  return monthlyPayment / (annuityPerEuro + insurancePerEuro);
}

export interface PurchaseInput {
  netMonthlyIncome: number;
  year: number;
  /** Taux moyen des crédits immobiliers de l'année (%). */
  annualRatePct: number;
  assumptions: Assumptions;
}

export interface PurchaseCapacity {
  debtRatio: number;
  monthlyPayment: number;
  loan: number;
  /** Prix maximal du bien, hors frais d'acquisition. */
  maxPrice: number;
}

export function purchaseCapacity({ netMonthlyIncome, year, annualRatePct, assumptions: a }: PurchaseInput): PurchaseCapacity {
  const debtRatio = debtRatioFor(year);
  const monthlyPayment = Math.max(0, netMonthlyIncome) * debtRatio;
  const loan = maxLoan(monthlyPayment, annualRatePct, a.loanYears, a.insuranceRatePct);
  const maxPrice = (loan + Math.max(0, a.downPayment)) / (1 + a.notaryFeesRate);
  return { debtRatio, monthlyPayment, loan, maxPrice };
}

/** Surface achetable (m²) pour un budget et un prix au m². */
export function affordableArea(maxPrice: number, pricePerM2: number): number {
  return pricePerM2 > 0 ? maxPrice / pricePerM2 : 0;
}
