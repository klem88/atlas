import { DEFAULT_ASSUMPTIONS, type Assumptions } from './domain/affordability';
import type { PropertyMode } from './data/prices';

export interface VizState {
  netMonthlyIncome: number;
  year: number;
  mode: PropertyMode;
  selectedCode: string | null;
  assumptions: Assumptions;
}

export const DEFAULT_INCOME = 2500;
const MODES: readonly PropertyMode[] = ['moins-cher', 'maison', 'appartement'];

/**
 * L'état est reflété dans l'URL pour qu'un lien partagé redonne exactement la même vue :
 * ?revenu=2500&annee=2025&bien=moins-cher&commune=44109&apport=0&duree=25
 */
const PARAMS = {
  income: 'revenu',
  year: 'annee',
  mode: 'bien',
  commune: 'commune',
  downPayment: 'apport',
  loanYears: 'duree',
} as const;

export function readStateFromUrl(search: string, years: { first: number; last: number }): VizState {
  const p = new URLSearchParams(search);
  const num = (key: string, min: number, max: number, fallback: number) => {
    const v = Number(p.get(key));
    return p.has(key) && Number.isFinite(v) && v >= min && v <= max ? v : fallback;
  };
  const mode = p.get(PARAMS.mode) as PropertyMode | null;
  const commune = p.get(PARAMS.commune);

  return {
    netMonthlyIncome: num(PARAMS.income, 0, 100_000, DEFAULT_INCOME),
    year: Math.round(num(PARAMS.year, years.first, years.last, years.last)),
    mode: mode && MODES.includes(mode) ? mode : 'moins-cher',
    selectedCode: commune && /^[0-9AB]{5}$/.test(commune) ? commune : null,
    assumptions: {
      ...DEFAULT_ASSUMPTIONS,
      downPayment: num(PARAMS.downPayment, 0, 10_000_000, DEFAULT_ASSUMPTIONS.downPayment),
      loanYears: Math.round(num(PARAMS.loanYears, 5, 30, DEFAULT_ASSUMPTIONS.loanYears)),
    },
  };
}

export function stateToSearch(s: VizState): string {
  const p = new URLSearchParams();
  p.set(PARAMS.income, String(Math.round(s.netMonthlyIncome)));
  p.set(PARAMS.year, String(s.year));
  p.set(PARAMS.mode, s.mode);
  if (s.selectedCode) p.set(PARAMS.commune, s.selectedCode);
  if (s.assumptions.downPayment !== DEFAULT_ASSUMPTIONS.downPayment) p.set(PARAMS.downPayment, String(Math.round(s.assumptions.downPayment)));
  if (s.assumptions.loanYears !== DEFAULT_ASSUMPTIONS.loanYears) p.set(PARAMS.loanYears, String(s.assumptions.loanYears));
  return `?${p.toString()}`;
}
