import { describe, expect, it } from 'vitest';
import { degreeToken, parseDegreeLabel } from '@shell/music/degrees';
import type { StyleAgg } from '../data/contract';
import { arrivalsFrom, buildFlow, compareSentence, oddsWords, OTHER, topTokens } from './flow';

const T = (s: string) => degreeToken(parseDegreeLabel(s)!);
const agg = (key: string, label: string, rows: [string, string, number][]): StyleAgg => ({
  key,
  label,
  kind: 'genre',
  songs: 100,
  transitions: rows.reduce((a, r) => a + r[2], 0),
  rows: rows.map(([a, b, n]) => [T(a), T(b), n]),
});

const pop = agg('pop', 'la pop', [
  ['V', 'I', 50],
  ['V', 'vi', 30],
  ['V', 'IV', 20],
  ['I', 'V', 40],
  ['I', 'IV', 40],
  ['IV', 'I', 30],
  ['vi', 'IV', 30],
  ['ii', 'V', 5],
  ['iii', 'vi', 5],
]);
const jazz = agg('irb', 'le jazz', [
  ['V', 'I', 34],
  ['V', 'iii', 33],
  ['V', 'vi', 33],
  ['ii', 'V', 60],
]);

describe('fleuve', () => {
  it('classe les départs et regroupe le reste dans « autres »', () => {
    expect(topTokens(pop, 0, 2).map((t) => t)).toEqual([T('V'), T('I')]);
    const f = buildFlow(pop, { maxLeft: 2, maxRight: 2 });
    expect(f.left.map((n) => n.label)).toEqual(['V', 'I', 'autres']);
    expect(f.right.map((n) => n.label)).toEqual(['IV', 'I', 'autres']);
    expect(f.total).toBe(250);
    const other = f.left.find((n) => n.token === OTHER)!;
    expect(other.value).toBe(70);
    const vToI = f.links.find((l) => l.from === T('V') && l.to === T('I'))!;
    expect(vToI.value).toBe(50);
    expect(vToI.share).toBeCloseTo(0.5);
  });
  it('donne les parts par colonne : les courants d’un départ totalisent 100 %', () => {
    const f = buildFlow(pop);
    for (const n of f.left) {
      const sum = f.links.filter((l) => l.from === n.token).reduce((a, l) => a + l.share, 0);
      expect(sum).toBeCloseTo(1);
    }
  });
  it('liste les arrivées depuis un degré', () => {
    const a = arrivalsFrom(pop, T('V'));
    expect(a.map((x) => [x.label, x.share])).toEqual([
      ['I', 0.5],
      ['vi', 0.3],
      ['IV', 0.2],
    ]);
    expect(arrivalsFrom(pop, T('bVII'))).toEqual([]);
  });
});

describe('mots', () => {
  it('traduit une part en fraction parlée', () => {
    expect(oddsWords(0.5)).toBe('une fois sur deux');
    expect(oddsWords(0.34)).toBe('une fois sur trois');
    expect(oddsWords(0.66)).toBe('deux fois sur trois');
    expect(oddsWords(0.97)).toBe('presque toujours');
    expect(oddsWords(0.44)).toBe('44 % du temps');
  });
  it('compare deux styles', () => {
    const s = compareSentence(pop, jazz, T('V'));
    expect(s).toContain('Après un V, la pop va au I une fois sur deux');
    expect(s).toContain('au vi 30 % du temps');
    expect(s).toContain('Le jazz : une fois sur trois');
    expect(compareSentence(jazz, pop, T('ii'))).toContain('Après un ii, le jazz va au V presque toujours');
    expect(compareSentence(jazz, pop, T('ii'))).toContain('La pop : presque toujours');
    expect(compareSentence(pop, null, T('bVII'))).toContain('trop rare');
  });
});
