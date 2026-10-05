import { describe, expect, it } from 'vitest';
import { abcNotes, abcWarnings, applyChordLabels } from '@shell/music/score';
import { DEGRES_DO, DEGRES_RE, GRILLE, SCORES, chiffrer } from './partition';

/** Notes de chaque accord (classes de hauteur, do = 0), écrites à la main pour contrôler la partition. */
const NOTES: Record<string, number[]> = {
  Do7M: [0, 4, 7, 11],
  'Sol/Si': [7, 11, 2],
  'La m7': [9, 0, 4, 7],
  'Sol m7': [7, 10, 2, 5],
  Do9: [0, 4, 7, 10, 2],
  Fa7M: [5, 9, 0, 4],
  'Fa m': [5, 8, 0],
  'Do/Sol': [0, 4, 7],
  La7: [9, 1, 4, 7],
  'Ré m7': [2, 5, 9, 0],
  // Accords suspendus : l'arpège de main gauche ajoute la quinte de la basse (ré, mi), qui en fait des 9sus4.
  'Fa/Sol': [5, 9, 0, 7, 2],
  La7sus4: [9, 2, 4, 7],
  Ré7M: [2, 6, 9, 1],
  'La/Do♯': [9, 1, 4],
  'Si m7': [11, 2, 6, 9],
  Ré9: [2, 6, 9, 0, 4],
  Sol7M: [7, 11, 2, 6],
  'Sol m': [7, 10, 2],
  'Ré/La': [2, 6, 9],
  Si7: [11, 3, 6, 9],
  'Mi m7': [4, 7, 11, 2],
  'Sol/La': [7, 11, 2, 9, 4],
};

/** Basse attendue des accords renversés (classe de hauteur). */
const BASSE: Record<string, number> = { 'Sol/Si': 11, 'Do/Sol': 7, 'Fa/Sol': 7, 'La/Do♯': 1, 'Ré/La': 9, 'Sol/La': 9 };

/** Accords dans l'ordre joué : le A deux fois (reprise), le pont, le A′. */
function accordsJoues(): string[] {
  const bars = (i: number) => GRILLE[i]!.bars.flatMap((b) => b.split(' · '));
  return [...bars(0), ...bars(0), ...bars(1), ...bars(2)];
}

/** Accords et leurs instants de début (en rondes), d'après la grille : deux accords par mesure = deux temps chacun. */
function debuts(): { accord: string; start: number; end: number }[] {
  const out: { accord: string; start: number; end: number }[] = [];
  const mesures = [...GRILLE[0]!.bars, ...GRILLE[0]!.bars, ...GRILLE[1]!.bars, ...GRILLE[2]!.bars];
  mesures.forEach((m, i) => {
    const parts = m.split(' · ');
    parts.forEach((accord, j) => out.push({ accord, start: i + j / parts.length, end: i + (j + 1) / parts.length }));
  });
  return out;
}

describe('partitions de « Six ficelles au piano »', () => {
  it.each(Object.entries(SCORES))('%s se lit sans avertissement', (_id, abc) => {
    expect(abcWarnings(abc)).toEqual([]);
  });

  it('la grille compte 26 mesures jouées et 36 accords', () => {
    expect(accordsJoues()).toHaveLength(36);
    for (const a of accordsJoues()) expect(NOTES[a], a).toBeDefined();
  });

  it.each(['etape-1', 'etape-2'])('%s : chaque note jouée appartient à l’accord écrit, avec la bonne basse', (id) => {
    const notes = abcNotes(SCORES[id]!);
    expect(Math.max(...notes.map((n) => n.start + n.duration))).toBe(26);
    for (const { accord, start, end } of debuts()) {
      const dedans = notes.filter((n) => n.start >= start - 1e-9 && n.start < end - 1e-9);
      expect(dedans.length, accord).toBeGreaterThan(0);
      for (const n of dedans) expect(NOTES[accord], `${accord} : ${n.midi}`).toContain(n.midi % 12);
      const basse = Math.min(...dedans.map((n) => n.midi));
      if (accord in BASSE) expect(basse % 12, accord).toBe(BASSE[accord]);
    }
  });

  it('mesures 4 à 7 : la note du haut de la main droite descend si♭, la, la♭, sol', () => {
    const haut = (start: number) =>
      Math.max(...abcNotes(SCORES['etape-1']!).filter((n) => n.track === 0 && n.start === start).map((n) => n.midi));
    expect([haut(3), haut(4), haut(5), haut(6)]).toEqual([70, 69, 68, 67]);
  });

  it('étapes 3 et 4 : la mélodie tombe sur les notes de couleur annoncées', () => {
    // [instant en rondes, accord, note attendue en MIDI] pour quelques notes de couleur marquées.
    const attendus: [string, number, number][] = [
      ['etape-3', 0, 71], // si, 7M de Do
      ['etape-3', 5.5, 68], // la♭ de Fa m
      ['etape-3', 6.5, 73], // do♯ de La7
      ['etape-4', 1, 73], // do♯, 7M de Ré
      ['etape-4', 6.5, 70], // si♭ de Sol m
      ['etape-4', 7.5, 75], // ré♯ de Si7
    ];
    for (const [id, start, midi] of attendus) {
      const melodie = abcNotes(SCORES[id]!).filter((n) => n.track === 0 && n.start === start);
      expect(melodie.map((n) => n.midi), `${id} à ${start}`).toEqual([midi]);
    }
  });

  it('chaque accord porte son degré, en Do puis en Ré après le pont', () => {
    for (const abc of Object.values(SCORES)) {
      const degres = applyChordLabels(abc, 'degrees');
      expect(degres).not.toMatch(/"\^(Do|Ré|Mi|Fa|Sol|La|Si)/);
      expect(applyChordLabels(abc, 'names')).not.toContain('|I');
    }
    expect(chiffrer('"^La7"C8 | "^La7sus4"C8 | "^La7"C8')).toBe('"^La7|V7/ii"C8 | "^La7sus4|V7sus4"C8 | "^La7|V7"C8');
    expect(() => chiffrer('"^Mi7"C8')).toThrow(/Mi7/);
  });

  it('la grille a un degré pour chaque accord', () => {
    const tables = [DEGRES_DO, DEGRES_RE, DEGRES_RE];
    GRILLE.forEach((partie, p) => {
      for (const a of partie.bars.flatMap((b) => b.split(' · '))) expect(tables[p]![a], a).toBeDefined();
    });
  });
});
