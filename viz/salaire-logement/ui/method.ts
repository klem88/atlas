import { fmtEuros, fmtEurosRounded, fmtInt, fmtPct } from '@shell/format';
import type { Model } from '../model';
import type { VizState } from '../state';

/** Le calcul détaillé, avec les valeurs de l'utilisateur (section « Le calcul, étape par étape »). */
export function renderFormula(target: HTMLElement, model: Model, state: VizState): void {
  const a = state.assumptions;
  const c = model.capacity(state);
  const rate = model.rateFor(state.year);
  const budget = c.loan + a.downPayment;

  target.innerHTML = [
    `1. Mensualité maximale = ${fmtEuros(state.netMonthlyIncome)} × ${fmtInt(c.debtRatio * 100)} % d’endettement = <strong>${fmtEuros(Math.round(c.monthlyPayment))}</strong>`,
    `2. Emprunt possible sur ${a.loanYears} ans à ${fmtPct(rate)} (taux moyen ${state.year}), assurance ${fmtPct(a.insuranceRatePct)} comprise = <strong>${fmtEurosRounded(c.loan)}</strong>`,
    `3. Budget total = emprunt + apport de ${fmtEuros(a.downPayment)} = <strong>${fmtEurosRounded(budget)}</strong>`,
    `4. Prix maximal du logement = budget ÷ (1 + ${fmtPct(a.notaryFeesRate * 100, 1)} de frais de notaire) = <strong>${fmtEurosRounded(c.maxPrice)}</strong>`,
    `5. Surface = prix maximal ÷ prix médian au m² de la commune`,
  ].join('\n');
}

/** Liste des hypothèses fixes, dans le panneau dépliable. */
export function renderAssumptionList(target: HTMLElement, model: Model, state: VizState): void {
  const c = model.capacity(state);
  const rows: [string, string][] = [
    ['Taux d’endettement', `${fmtInt(c.debtRatio * 100)} % des revenus, assurance comprise (${state.year <= 2020 ? 'usage bancaire avant 2021' : 'règle du HCSF depuis 2021'})`],
    ['Taux d’emprunt', `${fmtPct(model.rateFor(state.year))}, moyenne nationale ${state.year}`],
    ['Assurance emprunteur', `${fmtPct(state.assumptions.insuranceRatePct)} du capital par an`],
    ['Frais de notaire', `${fmtPct(state.assumptions.notaryFeesRate * 100, 1)} du prix (logement ancien)`],
  ];
  target.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
}
