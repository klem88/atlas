import { describe, expect, it } from 'vitest';
import { CYCLE_QUARTES, spellDegree, tonicName } from './spelling';

describe('tonalités', () => {
  it('suit le cycle des quartes depuis do', () => {
    expect(CYCLE_QUARTES.map((pc) => tonicName(pc, 'majeur'))).toEqual(['Do', 'Fa', 'Si♭', 'Mi♭', 'La♭', 'Ré♭', 'Sol♭', 'Si', 'Mi', 'La', 'Ré', 'Sol']);
  });

  it('nomme les toniques mineures comme on les écrit', () => {
    expect(tonicName(1, 'mineur')).toBe('Do♯');
    expect(tonicName(8, 'mineur')).toBe('Sol♯');
    expect(tonicName(3, 'mineur')).toBe('Mi♭');
  });
});

describe('orthographe des degrés', () => {
  it('donne la bonne lettre', () => {
    expect(spellDegree('Do', '2')).toBe('Ré');
    expect(spellDegree('Do', 'b2')).toBe('Ré♭');
    expect(spellDegree('Do', '#1')).toBe('Do♯');
    expect(spellDegree('Mi♭', '4')).toBe('La♭');
    expect(spellDegree('Mi♭', 'b7')).toBe('Ré♭');
    expect(spellDegree('Si', '3')).toBe('Ré♯');
    expect(spellDegree('Fa♯', '7')).toBe('Mi♯');
  });

  it('évite les doubles altérations', () => {
    expect(spellDegree('Sol♭', 'b2')).toBe('Sol');
    expect(spellDegree('Ré♭', 'b6')).toBe('La');
  });
});
