import { describe, expect, it } from 'vitest';
import { arrowPath, DIATONIC, layoutOf } from './layout';
import { chordId, doorsOf, fifthsOffset, keysContaining, modulation, modulationSentence, neighborsOf, parseRoleLabel, roleOf, type Chord } from './harmony';
import { countableDegrees, LIBRARY, progressionById, stepsOf } from './library';
import { commonTones, moveKind, moveSentence } from './moves';
import { bandColumn, doorId, sceneOf, type Scene } from './scene';

const C = 0;
const G = 7;
const ch = (root: number, cls: Chord['cls'] = 'maj'): Chord => ({ root, cls });
const [Cmaj, Dmin, Emin, Fmaj, Gmaj, Amin] = [ch(0), ch(2, 'min'), ch(4, 'min'), ch(5), ch(7), ch(9, 'min')];

describe('dispositions locales', () => {
  it.each(['cercle', 'grille'] as const)('%s : sept accords placés, dans le cadre, sans chevauchement', (view) => {
    const l = layoutOf(view);
    const points = DIATONIC.map((c) => l.positions[c.label]!);
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

  it('une flèche aller et une flèche retour ne se superposent pas', () => {
    const go = arrowPath({ x: 0, y: 0 }, { x: 1, y: 0 }, 0.05);
    const back = arrowPath({ x: 1, y: 0 }, { x: 0, y: 0 }, 0.05);
    expect(Math.sign(go.mid.y)).toBe(-Math.sign(back.mid.y));
  });
});

describe('rôles dans une tonalité', () => {
  it('dans la gamme', () => {
    expect(roleOf(Amin, C)).toMatchObject({ label: 'vi', kind: 'diatonique', fn: 'repos' });
    expect(roleOf(Amin, G)).toMatchObject({ label: 'ii', kind: 'diatonique', fn: 'depart' });
  });

  it('dominantes secondaires', () => {
    expect(roleOf(ch(2), C)).toMatchObject({ label: 'V/V', kind: 'dominante', anchor: 'V' });
    expect(roleOf(ch(4), C)).toMatchObject({ label: 'V/vi', kind: 'dominante', anchor: 'vi' });
    expect(roleOf(ch(9), C)).toMatchObject({ label: 'V/ii', anchor: 'ii' });
    expect(roleOf(ch(11), C)).toMatchObject({ label: 'V/iii', anchor: 'iii' });
  });

  it('emprunts au mineur', () => {
    expect(roleOf(ch(10), C)).toMatchObject({ label: '♭VII', kind: 'emprunt', anchor: 'vii°' });
    expect(roleOf(ch(8), C)).toMatchObject({ label: '♭VI', kind: 'emprunt' });
    expect(roleOf(ch(5, 'min'), C)).toMatchObject({ label: 'iv', kind: 'emprunt', anchor: 'IV' });
    expect(roleOf(ch(3), C)).toMatchObject({ label: '♭III', kind: 'emprunt' });
  });

  it('ailleurs', () => {
    expect(roleOf(ch(1), C)).toMatchObject({ label: '♭II', kind: 'ailleurs', anchor: null });
  });

  it('lit les étiquettes de rôle', () => {
    expect(parseRoleLabel('V/V')).toEqual({ step: 2, cls: 'maj' });
    expect(parseRoleLabel('V/vi')).toEqual({ step: 4, cls: 'maj' });
    expect(parseRoleLabel('♭VII')).toEqual({ step: 10, cls: 'maj' });
    expect(parseRoleLabel('ii°')).toEqual({ step: 2, cls: 'dim' });
  });

  it('voisins : dominante secondaire et ombre mineure', () => {
    expect(neighborsOf('V', C).map(chordId)).toEqual([chordId(ch(2)), chordId(ch(7, 'min'))]);
    expect(neighborsOf('I', C).map(chordId)).toEqual([chordId(ch(0, 'min'))]);
    expect(neighborsOf('IV', C).map(chordId)).toEqual([chordId(ch(5, 'min'))]); // V/IV = I, déjà dans la gamme
  });
});

describe('portes et modulations', () => {
  it('cycle des quintes', () => {
    expect(fifthsOffset(C, G)).toBe(1);
    expect(fifthsOffset(C, 5)).toBe(-1);
    expect(fifthsOffset(C, 6)).toBe(6);
  });

  it('les tonalités qui contiennent La m, les plus proches d’abord', () => {
    expect(keysContaining(Amin, C).map((k) => [k.tonic, k.role.label])).toEqual([
      [0, 'vi'],
      [5, 'iii'],
      [7, 'ii'],
    ]);
    expect(doorsOf(Amin, C).map((d) => d.tonic)).toEqual([5, 7]);
    expect(doorsOf(ch(2), C)[0]).toMatchObject({ tonic: G, role: { label: 'V' } });
  });

  it('passer de Do à Sol : quatre accords restent (la gamme garde six notes, mais pas six accords)', () => {
    const m = modulation(C, G);
    expect(m.stay.map((s) => s.chord)).toEqual([Cmaj, Emin, Gmaj, Amin]);
    expect(m.leave).toEqual([Dmin, Fmaj, ch(11, 'dim')]);
    expect(m.arrive).toEqual([ch(11, 'min'), ch(2), ch(6, 'dim')]);
    expect(m.stay.find((s) => s.chord.root === 9)).toMatchObject({ before: 'vi', after: 'ii' });
    expect(modulationSentence(C, G, Amin)).toBe('On passe en Sol majeur. La m, qui était vi, devient ii. 4 accords sur 7 restent ; Ré m, Fa, Si ° s’en vont, Si m, Ré, Fa♯ ° arrivent.');
    expect(modulationSentence(C, G, ch(2))).toContain('Ré, qui était V/V, devient V.');
  });
});

describe('scènes', () => {
  const ids = (s: Scene) => s.nodes.map((n) => n.id);
  const inFrame = (s: Scene) => s.nodes.every((n) => n.x - n.r >= -1e-9 && n.x + n.r <= 1 + 1e-9 && n.y - n.r >= -1e-9 && n.y + n.r <= s.aspect + 1e-9);

  it.each(['cercle', 'grille', 'bande'] as const)('%s : identifiants uniques, tout dans le cadre', (view) => {
    for (const focus of [null, Cmaj, Amin, ch(2), ch(10)]) {
      const s = sceneOf({ view, tonic: C, extras: [ch(8), ch(4)], focus });
      expect(new Set(ids(s)).size).toBe(s.nodes.length);
      expect(inFrame(s)).toBe(true);
      expect(s.nodes.filter((n) => n.kind === 'diatonique')).toHaveLength(7);
    }
  });

  it('un accord de la gamme touché fait éclore ses voisins ; un voisin touché, sa porte', () => {
    const s = sceneOf({ view: 'cercle', tonic: C, extras: [], focus: Gmaj });
    expect(ids(s)).toContain(chordId(ch(2)));
    expect(ids(s)).toContain(chordId(ch(7, 'min')));
    expect(s.nodes.filter((n) => n.kind === 'porte')).toHaveLength(0);
    const d = sceneOf({ view: 'cercle', tonic: C, extras: [], focus: ch(2) });
    expect(d.nodes.filter((n) => n.kind === 'porte').map((n) => n.door)).toEqual([G]);
    expect(ids(d)).toContain(doorId(G));
  });

  it('les accords communs gardent leur identifiant d’une tonalité à l’autre (ils glissent)', () => {
    for (const view of ['cercle', 'grille', 'bande'] as const) {
      const a = new Set(ids(sceneOf({ view, tonic: C, extras: [], focus: null })));
      const b = ids(sceneOf({ view, tonic: G, extras: [], focus: null }));
      for (const c of [Cmaj, Emin, Gmaj, Amin]) {
        expect(a.has(chordId(c))).toBe(true);
        expect(b).toContain(chordId(c));
      }
    }
  });

  it('bande : les voisins sont à côté de la fenêtre, dominantes côté dièses, emprunts côté bémols', () => {
    expect(bandColumn(0).map(chordId)).toEqual([chordId(Cmaj), chordId(Amin), chordId(ch(11, 'dim'))]);
    const s = sceneOf({ view: 'bande', tonic: C, extras: [], focus: null });
    const x = (c: Chord) => s.nodes.find((n) => n.id === chordId(c))!.x;
    const w = s.window!;
    for (const c of [Cmaj, Fmaj, Gmaj, Dmin, Amin, Emin]) expect(x(c) > w.x && x(c) < w.x + w.w).toBe(true);
    expect(x(ch(2))).toBeGreaterThan(w.x + w.w); // V/V, à droite
    expect(x(ch(10))).toBeLessThan(w.x); // ♭VII, à gauche
  });

  it('bande : les portes d’un accord touché sont des fenêtres voisines', () => {
    const s = sceneOf({ view: 'bande', tonic: C, extras: [], focus: Amin });
    expect(s.ghostWindows.map((g) => g.tonic).sort((a, b) => a - b)).toEqual([5, 7]);
  });
});

describe('bibliothèque', () => {
  it('toutes les progressions sont lisibles ; celles « dans la gamme » le sont vraiment', () => {
    for (const prog of LIBRARY) {
      const steps = stepsOf(prog, C);
      expect(steps.length).toBeGreaterThanOrEqual(2);
      for (const s of steps) {
        const kind = roleOf(s.chord, s.key).kind;
        if (prog.family === 'gamme') expect(kind, `${prog.id} ${s.label}`).toBe('diatonique');
        else expect(kind, `${prog.id} ${s.label}`).not.toBe('ailleurs');
      }
    }
    expect(new Set(LIBRARY.map((x) => x.id)).size).toBe(LIBRARY.length);
  });

  it('les familles « voisins » sortent de la gamme, les « modulation » changent de tonalité', () => {
    for (const prog of LIBRARY.filter((x) => x.family === 'voisins')) expect(stepsOf(prog, C).some((s) => roleOf(s.chord, s.key).kind !== 'diatonique')).toBe(true);
    for (const prog of LIBRARY.filter((x) => x.family === 'modulation')) expect(new Set(stepsOf(prog, C).map((s) => s.key)).size).toBeGreaterThan(1);
  });

  it('le pivot vers la dominante : Do Fa La m | Ré Sol, en Sol', () => {
    const steps = stepsOf(progressionById('pivot')!, C);
    expect(steps.map((s) => [s.chord.root, s.key])).toEqual([
      [0, 0],
      [5, 0],
      [9, 0],
      [2, 7],
      [7, 7],
    ]);
  });

  it('les suites comptables : sans répétition, sans modulation, deux à huit accords', () => {
    expect(countableDegrees(progressionById('pop')!)?.length).toBe(4);
    expect(countableDegrees(progressionById('mario')!)?.map((d) => d.step)).toEqual([0, 8, 10, 0]);
    expect(countableDegrees(progressionById('blues')!)).toBeNull();
    expect(countableDegrees(progressionById('camion')!)).toBeNull();
  });
});

describe('mouvements', () => {
  it('reconnaît les mouvements de fondamentale', () => {
    expect(moveKind(Gmaj, Cmaj)).toBe('quinte-desc');
    expect(moveKind(Cmaj, Gmaj)).toBe('quinte-asc');
    expect(moveKind(Fmaj, Gmaj)).toBe('seconde-asc');
    expect(moveKind(Cmaj, Amin)).toBe('tierce-desc');
    expect(moveKind(Fmaj, ch(11, 'dim'))).toBe('triton');
  });

  it('compte les notes communes', () => {
    expect(commonTones(Gmaj, Cmaj)).toEqual([7]);
    expect(commonTones(Cmaj, Amin)).toEqual([0, 4]);
    expect(commonTones(Fmaj, Gmaj)).toEqual([]);
  });

  it('raconte un pas', () => {
    expect(moveSentence(Gmaj, Cmaj, C)).toBe('Sol → Do : quinte descendante, le pas le plus naturel ; la tension se résout : retour à la maison. 1 note en commun : sol.');
    expect(moveSentence(Fmaj, Gmaj, C)).toBe('Fa → Sol : un pas vers le haut, un élan ; du départ à la tension. Aucune note en commun.');
    expect(moveSentence(Fmaj, Cmaj, C)).toContain('la cadence « amen »');
    expect(moveSentence(ch(2), Gmaj, C)).toContain('la dominante secondaire se résout sur V');
    expect(moveSentence(Cmaj, ch(10), C)).toContain('on emprunte ♭VII au mineur');
    expect(moveSentence(ch(4), Fmaj, C)).toContain('une surprise');
    expect(moveSentence(Fmaj, ch(5, 'min'), C)).toBe('Fa → Fa m : même basse, seule la tierce bouge (majeur → mineur) ; on emprunte iv au mineur, une ombre sur IV. 2 notes en commun : fa, do.');
  });
});
