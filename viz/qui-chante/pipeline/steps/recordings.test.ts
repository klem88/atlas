import { describe, expect, it } from 'vitest';
import { chooseRecording, parseRecording, xenoCantoPage, type GbifOccurrence, type Recording } from './recordings';

const occurrence = (over: Partial<GbifOccurrence> = {}, media: Record<string, string> = {}): GbifOccurrence => ({
  catalogNumber: 'XC1074568',
  behavior: 'song',
  recordedBy: 'Laura Martin',
  countryCode: 'FR',
  year: 2026,
  extensions: {
    'http://rs.tdwg.org/ac/terms/Multimedia': [
      { 'http://purl.org/dc/elements/1.1/type': 'StillImage', 'http://purl.org/dc/terms/format': 'image/png' },
      {
        'http://purl.org/dc/elements/1.1/type': 'Sound',
        'http://purl.org/dc/terms/format': 'audio/mp3',
        'http://purl.org/dc/terms/description': '24 s',
        'http://purl.org/dc/terms/rights': 'CC BY-NC-SA 4.0',
        'http://purl.org/dc/terms/identifier': 'https://xeno-canto.org/sounds/uploaded/X/XC1074568.mp3',
        'http://purl.org/dc/elements/1.1/creator': 'Laura Martin',
        'http://ns.adobe.com/xap/1.0/Rating': '5',
        'http://rs.tdwg.org/ac/terms/resourceCreationTechnique': 'automatic recording: no; bitrate: 128000 bps',
        ...media,
      },
    ],
  },
  ...over,
});

describe('parseRecording', () => {
  it('lit le son, la licence, la note et le type', () => {
    expect(parseRecording(occurrence())).toEqual({
      xcId: 'XC1074568',
      mp3: 'https://xeno-canto.org/sounds/uploaded/X/XC1074568.mp3',
      licence: 'CC BY-NC-SA 4.0',
      rating: 5,
      author: 'Laura Martin',
      countryCode: 'FR',
      year: 2026,
      duration: 24,
      song: true,
      background: false,
      bitrate: 128000,
    });
  });

  it('écarte les WAV (on ne sait pas les découper sans réencoder)', () => {
    expect(parseRecording(occurrence({}, { 'http://purl.org/dc/terms/format': 'audio/wav' }))).toBeNull();
  });

  it('écarte les enregistrements automatiques', () => {
    const technique = { 'http://rs.tdwg.org/ac/terms/resourceCreationTechnique': 'automatic recording: yes' };
    expect(parseRecording(occurrence({}, technique))).toBeNull();
  });

  it('repère les autres espèces en fond', () => {
    expect(parseRecording(occurrence({ associatedTaxa: 'has background sounds: Prunella modularis' }))?.background).toBe(true);
  });
});

const rec = (over: Partial<Recording>): Recording => ({
  xcId: 'XC1',
  mp3: 'u',
  licence: 'CC BY-NC-SA 4.0',
  rating: 4,
  author: 'A',
  countryCode: 'ES',
  year: 2020,
  duration: 30,
  song: true,
  background: false,
  bitrate: 128000,
  ...over,
});

describe('chooseRecording', () => {
  it('exclut les licences ND, les trop courts et les mal notés', () => {
    expect(chooseRecording([rec({ licence: 'CC BY-NC-ND 4.0' }), rec({ duration: 3 }), rec({ rating: 2 })])).toBeNull();
  });

  it('préfère un chant à un cri mieux noté', () => {
    expect(chooseRecording([rec({ xcId: 'XC2', song: false, rating: 5 }), rec({ xcId: 'XC3', rating: 4 })])?.xcId).toBe('XC3');
  });

  it('se rabat sur un cri quand il n’y a pas de chant', () => {
    expect(chooseRecording([rec({ xcId: 'XC2', song: false })])?.xcId).toBe('XC2');
  });

  it('à note égale, préfère sans bruit de fond, puis la France', () => {
    const r = chooseRecording([
      rec({ xcId: 'XC2', background: true, countryCode: 'FR' }),
      rec({ xcId: 'XC3' }),
      rec({ xcId: 'XC4', countryCode: 'FR' }),
    ]);
    expect(r?.xcId).toBe('XC4');
  });
});

describe('xenoCantoPage', () => {
  it('construit l’URL publique', () => {
    expect(xenoCantoPage('XC1074568')).toBe('https://xeno-canto.org/1074568');
  });
});
