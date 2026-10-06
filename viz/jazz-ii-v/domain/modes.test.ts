import { describe, expect, it } from 'vitest';
import { nomsDuMode, notesDuMode } from './modes';

describe('modes', () => {
  it('donne les notes du dorien de ré', () => {
    expect(notesDuMode(2, 'dorien')).toEqual([2, 4, 5, 7, 9, 11, 0]);
    expect(nomsDuMode('Ré', 2, 'dorien')).toEqual(['ré', 'mi', 'fa', 'sol', 'la', 'si', 'do']);
  });

  it('écrit une lettre par note', () => {
    expect(nomsDuMode('Si', 11, 'locrien')).toEqual(['si', 'do', 'ré', 'mi', 'fa', 'sol', 'la']);
    expect(nomsDuMode('Ré♭', 1, 'lydienB7')).toEqual(['ré♭', 'mi♭', 'fa', 'sol', 'la♭', 'si♭', 'do♭']);
    expect(nomsDuMode('Mi', 4, 'altere')).toEqual(['mi', 'fa', 'sol', 'la♭', 'si♭', 'do', 'ré']);
  });

  it('nomme simplement la gamme diminuée', () => {
    expect(nomsDuMode('Do♯', 1, 'tonDemiTon')).toEqual(['do♯', 'ré♯', 'mi', 'fa♯', 'sol', 'la', 'la♯', 'do']);
  });
});
