import { describe, expect, it } from 'vitest';
import { duration, parseFrames, readFrameHeader } from './mp3';

/** Trame MPEG-1 couche III, 128 kbit/s, 44,1 kHz, sans remplissage : 417 octets. */
function frame(fill = 0): Uint8Array {
  const f = new Uint8Array(417).fill(fill);
  f.set([0xff, 0xfb, 0x90, 0x00]);
  return f;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

const FRAME_S = 1152 / 44100;

describe('readFrameHeader', () => {
  it('lit débit, fréquence et longueur', () => {
    expect(readFrameHeader(frame(), 0)).toEqual({ length: 417, sampleRate: 44100, samples: 1152 });
  });

  it('refuse ce qui n’est pas un en-tête', () => {
    expect(readFrameHeader(new Uint8Array([0xff, 0x00, 0, 0]), 0)).toBeNull();
    expect(readFrameHeader(new Uint8Array([0xff, 0xfb, 0xf0, 0]), 0)).toBeNull(); // débit interdit
  });
});

describe('parseFrames', () => {
  it('saute l’étiquette ID3 et les octets parasites', () => {
    const id3 = new Uint8Array(20);
    id3.set([0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 0, 10]);
    const buf = concat(id3, new Uint8Array([1, 2, 3]), frame(), frame(), frame());
    const frames = parseFrames(buf);
    expect(frames).toHaveLength(3);
    expect(frames[0]!.offset).toBe(23);
    expect(duration(frames)).toBeCloseTo(3 * FRAME_S);
  });

  it('écarte la trame d’information Xing en tête', () => {
    const info = frame();
    info.set(Buffer.from('Xing', 'latin1'), 36);
    expect(parseFrames(concat(info, frame(), frame()))).toHaveLength(2);
  });

  it('garde la dernière trame avant une étiquette ID3v1', () => {
    const tag = new Uint8Array(128);
    tag.set([0x54, 0x41, 0x47]);
    expect(parseFrames(concat(frame(), frame(), tag))).toHaveLength(2);
  });

  it('ne prend pas un faux en-tête au milieu des données', () => {
    const f = frame(0);
    f.set([0xff, 0xfb, 0x90, 0x00], 200); // motif d'en-tête à l'intérieur d'une trame
    expect(parseFrames(concat(f, frame(), frame()))).toHaveLength(3);
  });
});

