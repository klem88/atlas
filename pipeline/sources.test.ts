import { describe, expect, it } from 'vitest';
import { CEREMA, triennialWindow } from './sources';

describe('triennialWindow', () => {
  it('centre la fenêtre sur l’année', () => {
    expect(triennialWindow(2015, 2010, 2025)).toEqual({ from: 2014, to: 2016 });
  });

  it('décale la fenêtre aux extrémités de la période publiée', () => {
    expect(triennialWindow(2010, 2010, 2025)).toEqual({ from: 2010, to: 2012 });
    expect(triennialWindow(2025, 2010, 2025)).toEqual({ from: 2023, to: 2025 });
  });
});

describe('CEREMA.fileName', () => {
  it('suit la convention de nommage du Cerema', () => {
    expect(CEREMA.fileName('communes', { from: 2025, to: 2025 })).toBe('dv3f_prix_volumes_communes_2025.xlsx');
    expect(CEREMA.fileName('epci', { from: 2023, to: 2025 })).toBe('dv3f_prix_volumes_epci_2023_2025.xlsx');
  });
});
