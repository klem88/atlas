import { describe, expect, it } from 'vitest';
import { exporterCarnet, fusionner, grilleTempos, lireCarnet, meilleurTempo, resume, serie, type Tampon } from './logbook';

const t = (p: string, s: number, k: number, bpm: number, at: string): Tampon => ({ p, s, k, bpm, at });
const carnet = [
  t('ii-v-i', 1, 0, 80, '2026-10-06T18:00:00Z'),
  t('ii-v-i', 1, 0, 96, '2026-10-08T18:00:00Z'),
  t('ii-v-i', 2, 5, 72, '2026-10-07T18:00:00Z'),
  t('backdoor', 1, 0, 120, '2026-10-07T19:00:00Z'),
];

describe('carnet', () => {
  it('donne le meilleur tempo d’une case', () => {
    expect(meilleurTempo(carnet, 'ii-v-i', 1, 0)).toBe(96);
    expect(meilleurTempo(carnet, 'ii-v-i', 1, 5)).toBeNull();
  });

  it('remplit la grille paliers × tonalités', () => {
    const g = grilleTempos(carnet, 'ii-v-i', 6);
    expect(g).toHaveLength(6);
    expect(g[0]![0]).toBe(96);
    expect(g[1]![5]).toBe(72);
    expect(g[1]![0]).toBeNull();
  });

  it('trie la série d’un exercice par date', () => {
    expect(serie(carnet, 'ii-v-i').map((x) => x.bpm)).toEqual([80, 72, 96]);
  });

  it('résume', () => {
    expect(resume(carnet)).toEqual({ tampons: 4, jours: 3, tempoMoyen: 92 });
    expect(resume([])).toEqual({ tampons: 0, jours: 0, tempoMoyen: null });
  });

  it('relit ce qu’il exporte', () => {
    expect(lireCarnet(exporterCarnet(carnet))).toEqual(carnet);
  });

  it('refuse un fichier qui n’est pas un carnet', () => {
    expect(lireCarnet('pas du json')).toBeNull();
    expect(lireCarnet('{"tampons":[{"p":"x"}]}')).toBeNull();
    expect(lireCarnet('[{"p":"x","s":1,"k":12,"bpm":80,"at":"2026-10-06"}]')).toBeNull();
  });

  it('fusionne sans doublons', () => {
    const autre = [carnet[0]!, t('ii-v-i', 3, 0, 60, '2026-10-01T10:00:00Z')];
    const f = fusionner(carnet, autre);
    expect(f).toHaveLength(5);
    expect(f[0]!.at).toBe('2026-10-01T10:00:00Z');
  });
});
