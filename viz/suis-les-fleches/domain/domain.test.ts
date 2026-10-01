import { parseDegreeLabel, type Degree } from '@shell/music/degrees';
import { describe, expect, it } from 'vitest';
import { arrowPath, BACKGROUND_ARROWS, chordOfDegree, DIATONIC, layoutOf, VIEWS } from './layout';
import { countableDegrees, degreesOf, LIBRARY, progressionById } from './library';
import { commonTones, moveKind, moveSentence } from './moves';

const d = (label: string): Degree => parseDegreeLabel(label)!;

describe('dispositions', () => {
  it.each(VIEWS)('%s : sept accords placés, dans le cadre, sans chevauchement', (view) => {
    const l = layoutOf(view);
    const points = DIATONIC.map((c) => l.positions[c.label]!);
    expect(points.every(Boolean)).toBe(true);
    for (const p of points) {
      expect(p.x - l.radius).toBeGreaterThanOrEqual(0);
      expect(p.x + l.radius).toBeLessThanOrEqual(1);
      expect(p.y - l.radius).toBeGreaterThanOrEqual(0);
      expect(p.y + l.radius).toBeLessThanOrEqual(l.aspect);
    }
    for (let i = 0; i < points.length; i++)
      for (let j = i + 1; j < points.length; j++) expect(Math.hypot(points[i]!.x - points[j]!.x, points[i]!.y - points[j]!.y)).toBeGreaterThan(l.radius * 2.2);
  });

  it('cercle : I au centre, chaque accord dans le secteur de sa fonction', () => {
    const l = layoutOf('cercle');
    expect(l.positions.I).toEqual({ x: 0.5, y: 0.5 });
    for (const c of DIATONIC.filter((x) => x.label !== 'I')) {
      const p = l.positions[c.label]!;
      const angle = (Math.atan2(p.y - 0.5, p.x - 0.5) * 180) / Math.PI;
      const s = l.sectors.find((x) => x.fn === c.fn)!;
      const a = angle < s.from ? angle + 360 : angle;
      expect(a).toBeGreaterThan(s.from);
      expect(a).toBeLessThan(s.to);
    }
  });

  it('ligne : chaque pas vers la droite descend d’une quinte', () => {
    const l = layoutOf('ligne');
    const ordered = [...DIATONIC].sort((a, b) => l.positions[a.label]!.x - l.positions[b.label]!.x);
    for (let i = 0; i + 1 < ordered.length; i++) {
      const step = (ordered[i + 1]!.degree.step - ordered[i]!.degree.step + 12) % 12;
      expect(step).toBe(5);
    }
  });

  it('les flèches de fond relient des accords de la carte', () => {
    for (const [a, b] of BACKGROUND_ARROWS) {
      expect(DIATONIC.some((c) => c.label === a)).toBe(true);
      expect(DIATONIC.some((c) => c.label === b)).toBe(true);
    }
  });

  it('une flèche aller et une flèche retour ne se superposent pas', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 1, y: 0 };
    const go = arrowPath(a, b, 0.05);
    const back = arrowPath(b, a, 0.05);
    expect(Math.sign(go.mid.y)).toBe(-Math.sign(back.mid.y));
  });
});

describe('bibliothèque', () => {
  it('toutes les progressions sont lisibles et dans la gamme', () => {
    for (const prog of LIBRARY) {
      const degrees = degreesOf(prog);
      expect(degrees.length).toBeGreaterThanOrEqual(2);
      for (const x of degrees) expect(chordOfDegree(x), `${prog.id} : ${x.step}`).toBeDefined();
    }
    expect(new Set(LIBRARY.map((x) => x.id)).size).toBe(LIBRARY.length);
  });

  it('les suites comptables : sans répétition, deux à huit accords', () => {
    expect(countableDegrees(progressionById('pop')!)?.length).toBe(4);
    expect(countableDegrees(progressionById('pachelbel')!)?.length).toBe(8);
    expect(countableDegrees(progressionById('blues')!)).toBeNull();
  });
});

describe('mouvements', () => {
  it('reconnaît les mouvements de fondamentale', () => {
    expect(moveKind(d('V'), d('I'))).toBe('quinte-desc');
    expect(moveKind(d('ii'), d('V'))).toBe('quinte-desc');
    expect(moveKind(d('I'), d('V'))).toBe('quinte-asc');
    expect(moveKind(d('IV'), d('V'))).toBe('seconde-asc');
    expect(moveKind(d('vi'), d('V'))).toBe('seconde-desc');
    expect(moveKind(d('I'), d('vi'))).toBe('tierce-desc');
    expect(moveKind(d('vi'), d('I'))).toBe('tierce-asc');
    expect(moveKind(d('IV'), d('vii°'))).toBe('triton');
    expect(moveKind(d('I'), d('I'))).toBe('meme');
  });

  it('compte les notes communes', () => {
    expect(commonTones(d('V'), d('I'))).toEqual([7]); // sol
    expect(commonTones(d('I'), d('vi'))).toEqual([0, 4]); // do, mi
    expect(commonTones(d('IV'), d('V'))).toEqual([]);
  });

  it('raconte un pas', () => {
    expect(moveSentence(d('V'), d('I'), 0)).toBe('Sol → Do : quinte descendante, le pas le plus naturel ; la tension se résout : retour à la maison. 1 note en commun : sol.');
    expect(moveSentence(d('IV'), d('V'), 0)).toBe('Fa → Sol : un pas vers le haut, un élan ; du départ à la tension. Aucune note en commun.');
    expect(moveSentence(d('IV'), d('I'), 0)).toBe('Fa → Do : quinte montante, le cycle des quintes à rebours ; retour à la maison en douceur, sans passer par la tension (la cadence « amen »). 1 note en commun : do.');
    expect(moveSentence(d('I'), d('vi'), 7)).toContain('2 notes en commun : sol, si.');
  });
});
