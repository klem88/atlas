import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, type CellBlockFile, type Species, type SpeciesFile } from './contract';
import { DataValidationError, validateCellBlock, validateSpecies, validateSpectrogram } from './validate';

const SPEC = { bins: 4, fMin: 250, fMax: 11_000, frameSeconds: 0.08 };

const species = (i: number, song: Species['song'] = null): Species => ({
  key: 1000 + i,
  scientific: `Avis ${i}`,
  french: `Oiseau ${i}`,
  national: 10_000 - i,
  song,
});

const speciesFile = (list: Species[]): SpeciesFile => ({
  schemaVersion: SCHEMA_VERSION,
  generatedAt: '2026-09-30',
  years: [2015, 2025],
  spectrogram: SPEC,
  species: list,
});

const many = Array.from({ length: 150 }, (_, i) => species(i));
const song = { xcId: 'XC1', author: 'A. Auteur', licence: 'CC BY-NC-SA 4.0', url: 'https://xeno-canto.org/1', countryCode: 'FR', year: 2020, duration: 15, frames: 188 };

describe('validateSpecies', () => {
  it('accepte une liste valide', () => {
    expect(validateSpecies(speciesFile(many)).species).toHaveLength(150);
  });

  it('refuse un chant sous licence « pas de modification »', () => {
    const list = [species(0, { ...song, licence: 'CC BY-NC-ND 4.0' }), ...many.slice(1)];
    expect(() => validateSpecies(speciesFile(list))).toThrow(DataValidationError);
  });

  it('exige un tri par fréquence nationale décroissante', () => {
    const list = [...many];
    [list[0], list[1]] = [list[1]!, list[0]!];
    expect(() => validateSpecies(speciesFile(list))).toThrow(/ordre/);
  });
});

describe('validateCellBlock', () => {
  const block = (cells: CellBlockFile['cells']): CellBlockFile => ({ schemaVersion: SCHEMA_VERSION, block: '0-0', cells });

  it('accepte un bloc cohérent', () => {
    expect(() => validateCellBlock(block({ 5: { total: 10, species: [2, 0], counts: [6, 4] } }), 3)).not.toThrow();
  });

  it('refuse une espèce inconnue', () => {
    expect(() => validateCellBlock(block({ 5: { total: 10, species: [3], counts: [6] } }), 3)).toThrow(/inconnue/);
  });

  it('refuse plus d’observations d’espèces que le total', () => {
    expect(() => validateCellBlock(block({ 5: { total: 5, species: [0], counts: [6] } }), 3)).toThrow(/total/);
  });
});

describe('validateSpectrogram', () => {
  it('vérifie la taille des données', () => {
    expect(() => validateSpectrogram(new Uint8Array(12), SPEC, 3, 'XC1')).not.toThrow();
    expect(() => validateSpectrogram(new Uint8Array(12), SPEC, 4, 'XC1')).toThrow(/octets/);
  });
});
