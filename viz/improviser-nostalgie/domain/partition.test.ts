import { describe, expect, it } from 'vitest';
import { abcNotes, abcWarnings, applyChordLabels, type PlayedNote } from '@shell/music/score';
import { ETAPES, GRILLES, accords, grille, mainDroite, partitions, type Grille } from './partition';

/** Notes de chaque accord (classes de hauteur, do = 0), écrites à la main pour contrôler les partitions. */
const NOTES: Record<string, number[]> = {
  'Ré m7': [2, 5, 9, 0],
  Sol7: [7, 11, 2, 5],
  Do7M: [0, 4, 7, 11],
  Fa7M: [5, 9, 0, 4],
  'Si m7♭5': [11, 2, 5, 9],
  Mi7: [4, 8, 11, 2],
  'La m7': [9, 0, 4, 7],
  'La m': [9, 0, 4],
  'La m/Sol♯': [8, 9, 0, 4],
  'La m/Sol': [7, 9, 0, 4],
  'La m/Fa♯': [6, 9, 0, 4],
  Mi7sus4: [4, 9, 11, 2],
  'Mi m7': [4, 7, 11, 2],
  'Fa m6': [5, 8, 0, 2],
  'Do/Sol': [7, 0, 4],
  Sol7sus4: [7, 0, 2, 5],
  Do: [0, 4, 7],
};

/** Basse attendue de chaque accord. */
const BASSE: Record<string, number> = {
  'Ré m7': 2, Sol7: 7, Do7M: 0, Fa7M: 5, 'Si m7♭5': 11, Mi7: 4, 'La m7': 9, 'La m': 9, 'La m/Sol♯': 8, 'La m/Sol': 7,
  'La m/Fa♯': 6, Mi7sus4: 4, 'Mi m7': 4, 'Fa m6': 5, 'Do/Sol': 7, Sol7sus4: 7, Do: 0,
};

const BLANCHES = [0, 2, 4, 5, 7, 9, 11];
const EPS = 1e-9;

/** Accords avec leur début et leur fin, en rondes. */
function plages(g: Grille): { nom: string; start: number; end: number }[] {
  return g.mesures.flatMap((m, i) => m.map((a, j) => ({ nom: a.nom, start: i + j / m.length, end: i + (j + 1) / m.length })));
}

const notes = (g: Grille, etape: (typeof ETAPES)[number], track: number): PlayedNote[] =>
  abcNotes(partitions(g)[etape]).filter((n) => n.track === track);
const pendant = (ns: PlayedNote[], p: { start: number; end: number }) => ns.filter((n) => n.start >= p.start - EPS && n.start < p.end - EPS);
const debut = (ns: PlayedNote[], t: number) => ns.filter((n) => Math.abs(n.start - t) < EPS).map((n) => n.midi);

describe.each(GRILLES.map((g) => [g.titre, g] as const))('« %s »', (_titre, g) => {
  it.each(ETAPES)('%s se lit sans avertissement et tient en huit mesures, aux deux mains', (etape) => {
    const abc = partitions(g)[etape];
    expect(abcWarnings(abc)).toEqual([]);
    for (const track of [0, 1]) {
      const ns = abcNotes(abc).filter((n) => n.track === track);
      // La main droite peut finir sur un silence (étape 6).
      if (ns.length) expect(Math.max(...ns.map((n) => n.start + n.duration)), `piste ${track}`).toBeGreaterThan(7.5);
      expect(Math.max(...ns.map((n) => n.start + n.duration), 0), `piste ${track}`).toBeLessThanOrEqual(8 + EPS);
    }
  });

  it('chaque accord est connu, avec ses notes et sa basse', () => {
    for (const a of accords(g)) {
      expect(NOTES[a.nom], a.nom).toBeDefined();
      expect(BASSE[a.nom], a.nom).toBeDefined();
    }
  });

  it('main gauche : chaque note appartient à l’accord, et la plus grave est la basse', () => {
    const lh = notes(g, 'etape-1', 1);
    for (const p of plages(g)) {
      const dedans = pendant(lh, p);
      expect(dedans.length, p.nom).toBe(3);
      for (const n of dedans) expect(NOTES[p.nom], `${p.nom} : ${n.midi}`).toContain(n.midi % 12);
      expect(Math.min(...dedans.map((n) => n.midi)) % 12, p.nom).toBe(BASSE[p.nom]);
    }
  });

  it('main gauche : les deux notes tenues bougent d’une tierce au plus d’un accord au suivant', () => {
    const lh = notes(g, 'etape-1', 1);
    const hauts = plages(g).map((p) => pendant(lh, p).map((n) => n.midi).sort((a, b) => a - b).slice(1));
    for (let i = 1; i < hauts.length; i++) {
      for (const v of [0, 1]) expect(Math.abs(hauts[i]![v]! - hauts[i - 1]![v]!), `accord ${i + 1}, voix ${v}`).toBeLessThanOrEqual(4);
    }
  });

  it('étape 1 : la main droite se tait', () => {
    expect(notes(g, 'etape-1', 0)).toEqual([]);
  });

  it.each(['etape-2', 'etape-4'] as const)('%s : la note posée au début de chaque accord lui appartient', (etape) => {
    const rh = notes(g, etape, 0);
    for (const p of plages(g)) {
      const pose = debut(rh, p.start);
      expect(pose, `${p.nom} à ${p.start}`).toHaveLength(1);
      expect(NOTES[p.nom], `${p.nom} : ${pose[0]}`).toContain(pose[0]! % 12);
    }
  });

  it('étape 3 : touches blanches, sauf la note altérée de l’accord, et jamais à un demi-ton de la basse hors de l’accord', () => {
    const rh = notes(g, 'etape-3', 0);
    for (const p of plages(g)) {
      for (const n of pendant(rh, p)) {
        const pc = n.midi % 12;
        if (!BLANCHES.includes(pc)) expect(NOTES[p.nom], `${p.nom} : ${n.midi}`).toContain(pc);
        if (!NOTES[p.nom]!.includes(pc)) expect([1, 11], `${p.nom} : ${n.midi} frotte la basse`).not.toContain((pc - BASSE[p.nom]! + 12) % 12);
      }
    }
  });

  it('étape 5 : le motif garde son rythme, noire, deux croches, blanche, sur les sept premières mesures', () => {
    const rh = notes(g, 'etape-5', 0);
    for (let m = 0; m < 7; m++) {
      const mesure = rh.filter((n) => n.start >= m - EPS && n.start < m + 1 - EPS);
      expect(mesure.map((n) => n.duration), `mesure ${m + 1}`).toEqual([0.25, 0.125, 0.125, 0.5]);
    }
  });

  it('étape 6 : les questions restent en l’air, les réponses se posent sur la tonique', () => {
    const tonique = g.id === 'douce-amere' ? 0 : 9;
    const rh = notes(g, 'etape-6', 0);
    const fin = (m: number) => rh.filter((n) => n.start >= m - 1 - EPS && n.start < m - EPS).at(-1)!.midi % 12;
    expect(fin(2)).not.toBe(tonique);
    expect(fin(4)).toBe(tonique);
    expect(fin(6)).not.toBe(tonique);
    expect(fin(8)).toBe(tonique);
  });

  it('chaque accord porte son degré', () => {
    for (const abc of Object.values(partitions(g))) {
      expect(applyChordLabels(abc, 'degrees')).not.toMatch(/"\^(Do|Ré|Mi|Fa|Sol|La|Si)/);
      expect(applyChordLabels(abc, 'names')).not.toMatch(/\|[IViv]/);
    }
  });
});

describe('ce que disent les textes', () => {
  it('cycle des quintes : la ligne guide descend do, si, si, la, la, sol♯, la', () => {
    const rh = notes(grille('feuilles'), 'etape-2', 0);
    expect([0, 1, 2, 3, 4, 5, 6].map((t) => debut(rh, t)[0])).toEqual([72, 71, 71, 69, 69, 68, 69]);
  });

  it('cycle des quintes : à chaque accord une seule des deux notes tenues bouge, sauf à l’arrivée sur La m7', () => {
    const lh = notes(grille('feuilles'), 'etape-1', 1);
    const hauts = [0, 1, 2, 3, 4, 5, 6].map((t) => debut(lh, t + 0.25).sort((a, b) => a - b));
    const bougent = hauts.slice(1).map((h, i) => h.filter((x, v) => x !== hauts[i]![v]).length);
    expect(bougent).toEqual([1, 1, 1, 1, 1, 2]);
  });

  it('basse qui descend : la, sol♯, sol, fa♯, fa, sous un do et un mi qui ne bougent pas', () => {
    const lh = notes(grille('chromatique'), 'etape-1', 1);
    expect([0, 1, 2, 3, 4].map((t) => debut(lh, t)[0])).toEqual([45, 44, 43, 42, 41]);
    for (const t of [0, 1, 2, 3, 4]) expect(debut(lh, t + 0.25)).toEqual([48, 52]);
  });

  it('basse qui descend : le motif de l’étape 5 est identique sur les cinq premières mesures', () => {
    const rh = notes(grille('chromatique'), 'etape-5', 0);
    const mesure = (m: number) => rh.filter((n) => n.start >= m - EPS && n.start < m + 1 - EPS).map((n) => n.midi);
    for (const m of [1, 2, 3, 4]) expect(mesure(m)).toEqual(mesure(0));
  });

  it('basse qui descend : la réponse reprend la première mesure de la question', () => {
    const rh = notes(grille('chromatique'), 'etape-6', 0);
    const mesure = (m: number) => rh.filter((n) => n.start >= m - EPS && n.start < m + 1 - EPS).map((n) => n.midi);
    expect(mesure(2)).toEqual(mesure(0));
  });

  it('douce-amère : sur Fa m6, le la devient la♭ aux deux mains', () => {
    const g = grille('douce-amere');
    for (const etape of ['etape-2', 'etape-3', 'etape-4', 'etape-5'] as const) {
      const fam = pendant(notes(g, etape, 0), { start: 3, end: 4 }).map((n) => n.midi % 12);
      expect(fam, etape).not.toContain(9);
    }
    expect(debut(notes(g, 'etape-2', 0), 3)).toEqual([80]);
    expect(debut(notes(g, 'etape-1', 1), 3.25)).toContain(56);
  });

  it('un nombre de segments qui ne correspond pas à la grille est refusé', () => {
    const g = grille('feuilles');
    expect(() => mainDroite({ ...g, rh: { ...g.rh, 'etape-2': ['c8'] } }, 'etape-2')).toThrow(/1 segments pour 8 accords/);
  });

  it('une grille inconnue retombe sur le cycle des quintes', () => {
    expect(grille('inconnue').id).toBe('feuilles');
  });
});
