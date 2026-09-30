import { describe, expect, it } from 'vitest';
import { equalFrequency, intervalName, noteName, pitchClass, semitones } from './pitch';

describe('fréquence tempérée', () => {
  it('donne 440 Hz pour le la 4 (midi 69)', () => {
    expect(equalFrequency(69)).toBeCloseTo(440, 6);
  });
  it('double à l’octave et multiplie par 2^(1/12) par demi-ton', () => {
    expect(equalFrequency(81)).toBeCloseTo(880, 6);
    expect(equalFrequency(60)).toBeCloseTo(261.6256, 3);
    expect(equalFrequency(70) / equalFrequency(69)).toBeCloseTo(2 ** (1 / 12), 9);
  });
  it('accepte un autre diapason', () => {
    expect(equalFrequency(69, 442)).toBe(442);
  });
});

describe('noms', () => {
  it('nomme les notes à la française avec leur octave', () => {
    expect(noteName(60)).toBe('do4');
    expect(noteName(69)).toBe('la4');
    expect(noteName(61)).toBe('do♯4');
    expect(noteName(63)).toBe('mi♭4');
    expect(noteName(59)).toBe('si3');
    expect(noteName(48)).toBe('do3');
  });
  it('donne la classe de hauteur et l’intervalle en demi-tons', () => {
    expect(pitchClass(60)).toBe(0);
    expect(pitchClass(71)).toBe(11);
    expect(semitones(60, 67)).toBe(7);
    expect(semitones(67, 60)).toBe(7);
  });
  it('nomme les intervalles, octave comprise', () => {
    expect(intervalName(7)).toBe('quinte');
    expect(intervalName(4)).toBe('tierce majeure');
    expect(intervalName(3)).toBe('tierce mineure');
    expect(intervalName(12)).toBe('octave');
    expect(intervalName(0)).toBe('unisson');
    expect(intervalName(19)).toBe('quinte + octave');
    expect(intervalName(24)).toBe('deux octaves');
  });
});
