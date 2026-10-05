import { describe, expect, it } from 'vitest';
import { UserScrollGuard, centeredScroll, easeToward, lineSpans, type LineSpan } from './follow';

describe('lineSpans', () => {
  it('regroupe les événements par passage sur une ligne, reprise comprise', () => {
    const events = [
      { milliseconds: 0, line: 0, top: 10, height: 100 },
      { milliseconds: 500, line: 0, top: 10, height: 100 },
      { milliseconds: 1000, line: 1, top: 150, height: 100 },
      { milliseconds: 1500 }, // événement sans ligne (fin de mesure) : ignoré
      { milliseconds: 2000, line: 0, top: 10, height: 100 },
    ];
    expect(lineSpans(events, 3000)).toEqual([
      { line: 0, start: 0, end: 1000, top: 10, height: 100 },
      { line: 1, start: 1000, end: 2000, top: 150, height: 100 },
      { line: 0, start: 2000, end: 3000, top: 10, height: 100 },
    ]);
  });
});

describe('centeredScroll', () => {
  // Écran de 1000 px, sans bandeau : le centre est à 500 px.
  const spans: LineSpan[] = [
    { line: 0, start: 0, end: 1000, top: 1000, height: 200 },
    { line: 1, start: 1000, end: 2000, top: 1300, height: 200 },
    { line: 0, start: 2000, end: 3000, top: 1000, height: 200 },
  ];

  it('centre la ligne jouée', () => {
    // centre de la ligne 0 à 1100 px : il faut défiler de 600 px
    expect(centeredScroll(spans, 100, 1000)).toBe(600);
  });

  it('ne bouge pas avant la fin de la ligne', () => {
    expect(centeredScroll(spans, 590, 1000)).toBe(600);
  });

  it('glisse vers la ligne suivante pendant les 40 derniers pour cent', () => {
    const mid = centeredScroll(spans, 800, 1000)!;
    expect(mid).toBeGreaterThan(600);
    expect(mid).toBeLessThan(900);
    expect(centeredScroll(spans, 999.9, 1000)).toBe(900);
  });

  it('revient en arrière plus tard pour une reprise', () => {
    expect(centeredScroll(spans, 1800, 1000)).toBe(900);
    expect(centeredScroll(spans, 1950, 1000)).toBeLessThan(900);
  });

  it('tient compte du bandeau collant', () => {
    // bandeau de 100 px : centre de l'espace visible à 100 + 450 = 550 px
    expect(centeredScroll(spans, 100, 1000, 100)).toBe(550);
  });

  it('saute sans glisser en mouvement réduit', () => {
    expect(centeredScroll(spans, 800, 1000, 0, false)).toBe(600);
  });

  it('ne demande jamais un défilement négatif', () => {
    expect(centeredScroll([{ line: 0, start: 0, end: 1, top: 0, height: 100 }], 0, 1000)).toBe(0);
  });
});

describe('easeToward', () => {
  it('se rapproche de la cible sans la dépasser', () => {
    const y = easeToward(0, 100, 220);
    expect(y).toBeGreaterThan(60);
    expect(y).toBeLessThan(100);
    expect(easeToward(0, 100, 0)).toBe(0);
  });
});

describe('UserScrollGuard', () => {
  it('met le suivi en pause après un geste, puis le rend', () => {
    let t = 0;
    const g = new UserScrollGuard(4000, () => t);
    expect(g.paused).toBe(false);
    g.touched();
    t = 3999;
    expect(g.paused).toBe(true);
    t = 4000;
    expect(g.paused).toBe(false);
  });
});
