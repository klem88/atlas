import { describe, expect, it } from 'vitest';
import { degreeToken, parseDegreeLabel } from '@shell/music/degrees';
import { addSong, finishYear, isSeventh, measureSong, newYearAcc } from './measures';

const T = (s: string) => degreeToken(parseDegreeLabel(s)!);

describe('mesures d’un morceau', () => {
  it('compte les accords distincts, les mineurs, les emprunts et les degrés', () => {
    const m = measureSong([T('I'), T('V'), T('vi'), T('IV'), 255, T('I'), T('bVII'), T('IV'), T('vii°')])!;
    expect(m.chords).toBe(8);
    expect(m.distincts).toBe(6);
    expect(m.minor).toBe(2); // vi et vii°
    expect(m.borrowed).toBe(1); // bVII
    expect(m.degrees).toEqual([2, 0, 0, 2, 1, 1, 2]);
    expect(measureSong([255])).toBeNull();
  });
});

describe('année', () => {
  it('agrège et calcule les parts, avec les repères', () => {
    const acc = newYearAcc(1975);
    addSong(acc, measureSong([T('I'), T('IV'), T('V'), T('I')])!, { title: 'A', artist: 'x' });
    addSong(acc, measureSong([T('I'), T('ii'), T('iii'), T('IV'), T('V'), T('vi')])!, { title: 'B', artist: 'y' });
    acc.seventhChords = 3;
    acc.seventhTotal = 10;
    const p = finishYear(acc);
    expect(p).toMatchObject({ year: 1975, songs: 2, distincts: 4.5, quatre: 0.5, septiemes: 0.3, emprunts: 0 });
    expect(p.mineurs).toBeCloseTo(3 / 10);
    expect(p.degrees.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 3);
    expect(p.most).toEqual({ title: 'B', artist: 'y', distincts: 6 });
    expect(p.least).toEqual({ title: 'A', artist: 'x', distincts: 3 });
    expect(finishYear(newYearAcc(1900)).septiemes).toBeNull();
  });
  it('reconnaît les septièmes', () => {
    expect(isSeventh('dom7')).toBe(true);
    expect(isSeventh('hdim')).toBe(true);
    expect(isSeventh('maj')).toBe(false);
  });
});
