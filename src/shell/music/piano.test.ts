import { describe, expect, it } from 'vitest';
import { decayTime, toScheduledNotes } from './piano';

describe('toScheduledNotes', () => {
  const tracks = [
    [
      { cmd: 'program', start: 0, duration: 0 },
      { cmd: 'note', pitch: 64, start: 0, duration: 0.5, volume: 110 },
      { cmd: 'note', pitch: 67, start: 0.5, duration: 0.5, volume: 55 },
    ],
    [{ cmd: 'note', pitch: 48, start: 0, duration: 1, volume: 90 }],
  ];

  it('convertit les rondes en secondes selon le tempo', () => {
    // à 60 à la noire, une ronde dure 4 s
    const { notes, end } = toScheduledNotes(tracks, 60);
    expect(notes.map((n) => [n.midi, n.start, n.duration])).toEqual([
      [64, 0, 2],
      [67, 2, 2],
      [48, 0, 4],
    ]);
    expect(end).toBe(4);
    expect(notes[0]!.velocity).toBe(1);
    expect(notes[1]!.velocity).toBe(0.5);
  });

  it('coupe une piste sans changer la durée totale', () => {
    const { notes, end } = toScheduledNotes(tracks, 120, new Set([1]));
    expect(notes.map((n) => n.midi)).toEqual([64, 67]);
    expect(end).toBe(2);
  });
});

describe('decayTime', () => {
  it('fait sonner le grave plus longtemps que l’aigu', () => {
    expect(decayTime(40)).toBeGreaterThan(decayTime(60));
    expect(decayTime(60)).toBeGreaterThan(decayTime(80));
  });
});
