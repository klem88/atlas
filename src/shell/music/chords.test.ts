import { describe, expect, it } from 'vitest';
import { PITCH_CLASS_OF, parseChord, parseHarteDegree, parsePitch, triadClass, type Quality } from './chords';

const q = (s: string): Quality | null => parseChord(s)?.quality ?? null;
const root = (s: string) => parseChord(s)?.root;

describe('lecture de la fondamentale', () => {
  it('lit les lettres, les dièses et les bémols', () => {
    expect(root('C')).toBe(0);
    expect(root('C#')).toBe(1);
    expect(root('Db')).toBe(1);
    expect(root('Bb')).toBe(10);
    expect(root('B')).toBe(11);
    expect(root('Cb')).toBe(11);
    expect(root('E#')).toBe(5);
    expect(root('F##')).toBe(7);
    expect(root('A♭')).toBe(8);
    expect(root('G♯m')).toBe(8);
    expect(parsePitch('Eb')).toBe(3);
  });
  it('rejette ce qui n’est pas un accord', () => {
    expect(parseChord('N')).toBeNull();
    expect(parseChord('X')).toBeNull();
    expect(parseChord('&pause')).toBeNull();
    expect(parseChord('')).toBeNull();
    expect(parseChord('<verse_1>')).toBeNull();
    expect(parseChord('H7')).toBeNull();
  });
  it('expose la table des classes de hauteur et les degrés Harte', () => {
    expect(PITCH_CLASS_OF.A).toBe(9);
    expect(parseHarteDegree('3')).toBe(4);
    expect(parseHarteDegree('b7')).toBe(10);
    expect(parseHarteDegree('#4')).toBe(6);
    expect(parseHarteDegree('9')).toBe(2);
    expect(parseHarteDegree('x')).toBeNull();
  });
});

describe('qualités : écriture libre (Chordonomicon, tablatures)', () => {
  it('triades', () => {
    expect(q('C')).toBe('maj');
    expect(q('Cmaj')).toBe('maj');
    expect(q('CM')).toBe('maj');
    expect(q('Am')).toBe('min');
    expect(q('Amin')).toBe('min');
    expect(q('A-')).toBe('min');
    expect(q('Bdim')).toBe('dim');
    expect(q('B°')).toBe('dim');
    expect(q('Bo')).toBe('dim');
    expect(q('Caug')).toBe('aug');
    expect(q('C+')).toBe('aug');
    expect(q('Csus4')).toBe('sus');
    expect(q('Csus2')).toBe('sus');
    expect(q('Csus')).toBe('sus');
  });
  it('septièmes', () => {
    expect(q('G7')).toBe('dom7');
    expect(q('G9')).toBe('dom7');
    expect(q('G13')).toBe('dom7');
    expect(q('G7b9')).toBe('dom7');
    expect(q('G7#9')).toBe('dom7');
    expect(q('G7alt')).toBe('dom7');
    expect(q('Cmaj7')).toBe('maj7');
    expect(q('CM7')).toBe('maj7');
    expect(q('Cmaj9')).toBe('maj7');
    expect(q('CΔ7')).toBe('maj7');
    expect(q('Dm7')).toBe('min7');
    expect(q('Dmin7')).toBe('min7');
    expect(q('D-7')).toBe('min7');
    expect(q('Dm9')).toBe('min7');
    expect(q('Dm11')).toBe('min7');
    expect(q('Bm7b5')).toBe('hdim');
    expect(q('Bø')).toBe('hdim');
    expect(q('Bø7')).toBe('hdim');
    expect(q('Bdim7')).toBe('dim');
    expect(q('Bo7')).toBe('dim');
  });
  it('ajouts et cas voisins', () => {
    expect(q('Cadd9')).toBe('maj');
    expect(q('C6')).toBe('maj');
    expect(q('C69')).toBe('maj');
    expect(q('C6/9')).toBe('maj');
    expect(q('C5')).toBe('maj');
    expect(q('C2')).toBe('maj');
    expect(q('Am6')).toBe('min');
    expect(q('Amadd9')).toBe('min');
    expect(q('AmMaj7')).toBe('min');
    expect(q('Am(maj7)')).toBe('min');
    expect(q('G7sus4')).toBe('sus');
    expect(q('Caug7')).toBe('aug');
    expect(q('C7#5')).toBe('aug');
  });
  it('basse', () => {
    const c = parseChord('C/E')!;
    expect(c.quality).toBe('maj');
    expect(c.bass).toBe(4);
    expect(parseChord('Am7/G')!.bass).toBe(7);
    expect(parseChord('C')!.bass).toBeUndefined();
    expect(parseChord('C6/9')!.bass).toBeUndefined();
  });
});

describe('qualités : notation Harte (McGill Billboard)', () => {
  it('lit les qualités nommées', () => {
    expect(q('C:maj')).toBe('maj');
    expect(q('A:min')).toBe('min');
    expect(q('G:7')).toBe('dom7');
    expect(q('C:maj7')).toBe('maj7');
    expect(q('D:min7')).toBe('min7');
    expect(q('B:hdim7')).toBe('hdim');
    expect(q('B:dim')).toBe('dim');
    expect(q('B:dim7')).toBe('dim');
    expect(q('C:aug')).toBe('aug');
    expect(q('C:sus4')).toBe('sus');
    expect(q('C:sus2')).toBe('sus');
    expect(q('C:maj6')).toBe('maj');
    expect(q('A:min6')).toBe('min');
    expect(q('G:9')).toBe('dom7');
    expect(q('C:maj9')).toBe('maj7');
    expect(q('D:min9')).toBe('min7');
    expect(q('A:minmaj7')).toBe('min');
    expect(q('C:1')).toBe('maj');
    expect(q('C:5')).toBe('maj');
    expect(q('C:(1,5)')).toBe('maj');
    expect(q('C:maj(9)')).toBe('maj');
    expect(q('C:7(#9)')).toBe('dom7');
  });
  it('lit la basse en degré', () => {
    expect(parseChord('C:maj/3')!.bass).toBe(4);
    expect(parseChord('C:maj/5')!.bass).toBe(7);
    expect(parseChord('A:min/b3')!.bass).toBe(0);
    expect(parseChord('G:7/b7')!.bass).toBe(5);
  });
});

describe('qualités : notation iRealPro (iRb)', () => {
  it('lit les abréviations du jazz', () => {
    expect(q('C^7')).toBe('maj7');
    expect(q('C^')).toBe('maj7');
    expect(q('C^9')).toBe('maj7');
    expect(q('C-7')).toBe('min7');
    expect(q('C-')).toBe('min');
    expect(q('C-6')).toBe('min');
    expect(q('C-^7')).toBe('min');
    expect(q('Ch7')).toBe('hdim');
    expect(q('Ch')).toBe('hdim');
    expect(q('Co7')).toBe('dim');
    expect(q('Co')).toBe('dim');
    expect(q('C7b9')).toBe('dom7');
    expect(q('C7#11')).toBe('dom7');
    expect(q('C7sus')).toBe('sus');
    expect(q('Csus')).toBe('sus');
    expect(q('C+')).toBe('aug');
    expect(q('C7+')).toBe('aug');
    expect(q('C6')).toBe('maj');
    expect(q('C69')).toBe('maj');
  });
  it('lit l’écriture de la Weimar Jazz Database', () => {
    expect(q('Ebj7')).toBe('maj7');
    expect(q('G-7')).toBe('min7');
    expect(q('Am7b5')).toBe('hdim');
    expect(q('F-')).toBe('min');
    expect(q('C79b')).toBe('dom7');
    expect(parseChord('NC')).toBeNull();
  });
});

describe('classe de triade', () => {
  it('replie les septièmes sur leur triade', () => {
    expect(triadClass('maj')).toBe('maj');
    expect(triadClass('maj7')).toBe('maj');
    expect(triadClass('dom7')).toBe('maj');
    expect(triadClass('min')).toBe('min');
    expect(triadClass('min7')).toBe('min');
    expect(triadClass('dim')).toBe('dim');
    expect(triadClass('hdim')).toBe('dim');
    expect(triadClass('aug')).toBe('aug');
    expect(triadClass('sus')).toBe('sus');
    expect(triadClass('other')).toBe('other');
  });
});

describe('écriture propre à Chordonomicon', () => {
  it('lit « s » comme dièse et les qualités du corpus', () => {
    expect(parseChord('Csmin')).toEqual({ root: 1, quality: 'min' });
    expect(parseChord('Fs7')).toEqual({ root: 6, quality: 'dom7' });
    expect(parseChord('A/Cs')).toEqual({ root: 9, quality: 'maj', bass: 1 });
    expect(parseChord('Csus4')).toEqual({ root: 0, quality: 'sus' });
    expect(parseChord('Eno3d')).toEqual({ root: 4, quality: 'maj' });
    expect(parseChord('Gminadd13')).toEqual({ root: 7, quality: 'min' });
    expect(parseChord('Gmaj7sus2')).toEqual({ root: 7, quality: 'sus' });
    expect(parseChord('Gaugmaj7')).toEqual({ root: 7, quality: 'aug' });
    expect(parseChord('Gmajs9')).toEqual({ root: 7, quality: 'maj' });
    expect(parseChord('/')).toBeNull();
  });
});
