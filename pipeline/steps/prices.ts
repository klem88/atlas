import * as fs from 'node:fs';
import * as XLSX from 'xlsx';
import { PROPERTY_TYPES, type PropertyType } from '../../src/data/contract';
import { CEREMA } from '../sources';
import type { Observation } from './resolve';

XLSX.set_fs(fs);

export type CeremaTable = Map<string, Record<PropertyType, Observation>>;

/**
 * Lit un fichier d'indicateurs DV3F (communes ou EPCI) et en extrait,
 * pour chaque territoire, le prix médian au m² et le nombre de ventes par type de bien.
 * Seules les deux feuilles utiles sont parsées (≈10× plus rapide que le classeur entier).
 */
export function readCeremaFile(path: string): CeremaTable {
  const sheetNames = PROPERTY_TYPES.map((t) => CEREMA.sheets[t].name);
  const wb = XLSX.readFile(path, { sheets: sheetNames, dense: true });
  const table: CeremaTable = new Map();

  for (const type of PROPERTY_TYPES) {
    const spec = CEREMA.sheets[type];
    const sheet = wb.Sheets[spec.name];
    if (!sheet) throw new Error(`${path} : feuille « ${spec.name} » absente`);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    if (rows.length === 0) throw new Error(`${path} : feuille « ${spec.name} » vide`);
    const header = rows[0]!;
    for (const col of ['code', spec.n]) {
      if (!(col in header)) throw new Error(`${path} : colonne « ${col} » absente de « ${spec.name} »`);
    }

    for (const row of rows) {
      const code = String(row.code ?? '').trim();
      if (!code) continue;
      const entry = table.get(code) ?? ({} as Record<PropertyType, Observation>);
      entry[type] = { pxm2: toNumber(row[spec.pxm2]), n: toNumber(row[spec.n]) ?? 0 };
      table.set(code, entry);
    }
  }
  return table;
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
