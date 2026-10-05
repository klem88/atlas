import { describe, expect, it } from 'vitest';
import { UserScrollGuard, followTarget } from './follow';

describe('followTarget', () => {
  const vh = 1000;

  it('ne bouge pas quand la ligne est déjà dans la zone', () => {
    expect(followTarget(1300, 200, 1000, vh)).toBeNull();
  });

  it('descend quand la ligne sort par le bas', () => {
    // haut de ligne à 850 px dans l'écran, 200 px de haut : dépasse 90 %
    expect(followTarget(1850, 200, 1000, vh)).toBe(1850 - 220);
  });

  it('remonte quand la ligne est passée au-dessus (reprise)', () => {
    expect(followTarget(400, 200, 1000, vh)).toBe(180);
  });

  it('tient compte du bandeau collant', () => {
    // bandeau de 60 px : la ligne à 70 px du haut est cachée en partie
    expect(followTarget(1070, 200, 1000, vh, 60)).toBe(Math.round(1070 - 60 - 0.22 * 940));
  });

  it('ne demande jamais un défilement négatif', () => {
    expect(followTarget(20, 200, 300, vh)).toBe(0);
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
