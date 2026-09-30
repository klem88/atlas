import { describe, expect, it } from 'vitest';
import { pickFrenchName } from './names';

describe('pickFrenchName', () => {
  it('préfère TAXREF', () => {
    expect(
      pickFrenchName([
        { vernacularName: 'Rouge-gorge familier', language: 'fra', source: 'Catalogue of Life' },
        { vernacularName: 'Rougegorge familier', language: 'fra', source: 'TAXREF' },
        { vernacularName: 'European Robin', language: 'eng', source: 'TAXREF' },
      ]),
    ).toBe('Rougegorge familier');
  });

  it('prend sinon le nom le plus fréquent, avec une majuscule', () => {
    expect(
      pickFrenchName([
        { vernacularName: 'merle noir', language: 'fra', source: 'A' },
        { vernacularName: 'merle noir', language: 'fra', source: 'B' },
        { vernacularName: 'Merle', language: 'fra', source: 'C' },
      ]),
    ).toBe('Merle noir');
  });

  it('sans TAXREF, préfère le nom le plus cité à celui d’une source isolée', () => {
    expect(
      pickFrenchName([
        { vernacularName: 'Corbeau pigeon', language: 'fra', source: 'Catalogue of Life' },
        { vernacularName: 'Corneille mantelée', language: 'fra', source: 'ITIS' },
        { vernacularName: 'corneille mantelée', language: 'fra', source: 'Belgian Species List' },
      ]),
    ).toBe('Corneille mantelée');
  });

  it('garde les majuscules des noms propres', () => {
    expect(
      pickFrenchName([
        { vernacularName: "Verdier d'Europe", language: 'fra', source: 'A' },
        { vernacularName: "verdier d'Europe", language: 'fra', source: 'B' },
      ]),
    ).toBe("Verdier d'Europe");
  });

  it('renvoie null sans nom français', () => {
    expect(pickFrenchName([{ vernacularName: 'Robin', language: 'eng' }])).toBeNull();
  });
});
