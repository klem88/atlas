import { SCHEMA_VERSION, type RatesFile } from '../../data/contract';
import { RATES } from '../sources';

/** Parse un CSV RFC 4180 (guillemets, virgules et guillemets échappés dans les champs). */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');

  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f !== ''));
}

/** Transforme l'export CSV de la BCE en série mensuelle + moyennes annuelles. */
export function buildRates(csv: string, generatedAt: string): RatesFile {
  const [header, ...rows] = parseCsv(csv);
  if (!header) throw new Error('rates : CSV vide');
  const iPeriod = header.indexOf('TIME_PERIOD');
  const iValue = header.indexOf('OBS_VALUE');
  if (iPeriod < 0 || iValue < 0) throw new Error('rates : colonnes TIME_PERIOD / OBS_VALUE introuvables');

  const monthly = rows
    .map((r) => ({ period: r[iPeriod] ?? '', rate: Number(r[iValue]) }))
    .filter((o) => /^\d{4}-\d{2}$/.test(o.period) && Number.isFinite(o.rate))
    .sort((a, b) => a.period.localeCompare(b.period));

  const byYear = new Map<string, number[]>();
  for (const { period, rate } of monthly) {
    const y = period.slice(0, 4);
    byYear.set(y, [...(byYear.get(y) ?? []), rate]);
  }
  const annual: Record<string, number> = {};
  for (const [year, values] of byYear) {
    annual[year] = Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100;
  }

  return { schemaVersion: SCHEMA_VERSION, generatedAt, source: RATES.attribution, annual, monthly };
}
