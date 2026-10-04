import { describe, expect, it } from 'vitest';
import { IDS } from '../domain/ficelles';
import { ecouteUrl, SIGNATURES, signaturesDe, type Signature } from './signatures';

describe('les titres signés', () => {
  it('ont chacun une source publiée et un passage', () => {
    for (const s of SIGNATURES) {
      expect(IDS).toContain(s.ficelle);
      expect(s.source).toMatch(/^https:\/\//);
      expect(s.titre.trim()).not.toBe('');
      expect(s.passage.trim()).not.toBe('');
    }
  });

  it('n’affichent que les titres validés à l’oreille', () => {
    for (const id of IDS) expect(signaturesDe(id).every((s) => s.etat === 'valide' && s.ficelle === id)).toBe(true);
  });

  it('écoutent par une recherche, sans lien vers un enregistrement précis', () => {
    const s: Signature = { ficelle: 'descend', auteur: 'Michel Berger', titre: 'Un titre', passage: 'le refrain', source: 'https://exemple.org', etat: 'valide' };
    expect(ecouteUrl(s)).toBe('https://www.youtube.com/results?search_query=Michel%20Berger%20Un%20titre');
  });
});
