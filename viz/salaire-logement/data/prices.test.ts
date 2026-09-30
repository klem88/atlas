import { describe, expect, it } from 'vitest';
import { PriceSource, SCHEMA_VERSION, type PricesFile } from './contract';
import { PriceTable, isEstimate } from './prices';

// Deux communes × deux années. Index = commune * 2 + année.
const file: PricesFile = {
  schemaVersion: SCHEMA_VERSION,
  generatedAt: 't',
  years: [2024, 2025],
  codes: ['44109', '23001'],
  uncoveredDepartements: ['57'],
  series: {
    maison: { pxm2: [4000, 4100, 1000, null], n: [900, 950, 20, 3], src: [1, 1, 3, 0] },
    appartement: { pxm2: [3300, 3400, null, null], n: [3000, 3100, 0, 0], src: [1, 1, 0, 0] },
  },
};
const table = new PriceTable(file);

describe('PriceTable.lookup', () => {
  it('renvoie le type demandé', () => {
    expect(table.lookup('44109', 2025, 'maison')).toEqual({
      kind: 'ok',
      price: { pxm2: 4100, type: 'maison', src: PriceSource.CommuneAnnual, n: 950 },
    });
  });

  it('choisit le moins cher des deux types', () => {
    const r = table.lookup('44109', 2025, 'moins-cher');
    expect(r.kind === 'ok' && r.price.type).toBe('appartement');
  });

  it('retombe sur le seul type disponible', () => {
    const r = table.lookup('23001', 2024, 'moins-cher');
    expect(r.kind === 'ok' && r.price).toEqual({ pxm2: 1000, type: 'maison', src: PriceSource.EpciAnnual, n: 20 });
  });

  it('distingue « pas de marché » et « territoire non couvert »', () => {
    expect(table.lookup('23001', 2025, 'moins-cher')).toEqual({ kind: 'no-market' });
    expect(table.lookup('57463', 2025, 'maison')).toEqual({ kind: 'uncovered' });
    expect(table.lookup('99999', 2025, 'maison')).toEqual({ kind: 'no-market' });
  });
});

describe('isEstimate', () => {
  it('ne qualifie d’estimation que les prix empruntés à l’EPCI', () => {
    expect(isEstimate(PriceSource.CommuneAnnual)).toBe(false);
    expect(isEstimate(PriceSource.CommuneTriennial)).toBe(false);
    expect(isEstimate(PriceSource.EpciAnnual)).toBe(true);
    expect(isEstimate(PriceSource.EpciTriennial)).toBe(true);
  });
});

describe('PriceTable.salesVolume', () => {
  it('additionne les ventes des deux types sur toutes les années', () => {
    expect(table.salesVolume('44109')).toBe(900 + 950 + 3000 + 3100);
    expect(table.salesVolume('23001')).toBe(23);
    expect(table.salesVolume('99999')).toBe(0);
  });
});
