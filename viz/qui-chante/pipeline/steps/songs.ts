/**
 * Étape « chants » : pour les espèces les plus observées, choisit un enregistrement Xeno-canto,
 * en publie un extrait MP3 et son spectrogramme.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Mp3Encoder } from '@breezystack/lamejs';
import { MPEGDecoder } from 'mpg123-decoder';
import type { Song, Species, SpectrogramSpec } from '../../data/contract';
import { validateSpectrogram } from '../../data/validate';
import { downloadCached } from '@tools/lib/download';
import { log } from '@tools/lib/log';
import { cachedJson } from '../lib/cached-json';
import { parseFrames } from '../lib/mp3';
import { GBIF } from '../sources';
import { chooseRecording, parseRecording, xenoCantoPage, type GbifOccurrence, type Recording } from './recordings';
import { bestWindow, normalize, toInt16 } from './clip';
import { spectrogram, toMono } from './spectrogram';

/** Durée maximale d'un extrait publié (s). */
export const CLIP_SECONDS = 15;

/** Débit des extraits : mono, 64 kbit/s (≈ 120 Ko pour 15 s), largement assez pour des chants. */
const CLIP_KBPS = 64;

export const SPECTROGRAM: SpectrogramSpec = { bins: 48, fMin: 250, fMax: 11_000, frameSeconds: 0.08 };

interface Paths {
  cache: string;
  out: string;
}

interface SearchPage {
  results: (GbifOccurrence & { specificEpithet?: string; family?: string })[];
}

/** Enregistrements candidats : Europe d'abord, puis le monde, puis par épithète (changements de genre). */
async function candidates(species: Species, family: string, cache: string): Promise<Recording[]> {
  const base = `${GBIF.api}/occurrence/search?datasetKey=${GBIF.xenoCantoDataset}&limit=300`;
  const attempts: [string, string][] = [
    [`${base}&taxonKey=${species.key}&continent=EUROPE`, `${species.key}-europe.json`],
    [`${base}&taxonKey=${species.key}`, `${species.key}-monde.json`],
  ];
  const epithet = species.scientific.split(' ')[1];
  if (epithet) attempts.push([`${base}&q=${encodeURIComponent(epithet)}`, `${species.key}-epithete.json`]);

  for (const [i, [url, file]] of attempts.entries()) {
    const page = await cachedJson<SearchPage>(url, join(cache, 'xc', file));
    // Recherche par épithète : même épithète et même famille, pour ne pas confondre deux espèces.
    const results = i === 2 ? page.results.filter((o) => o.specificEpithet === epithet && o.family === family) : page.results;
    const parsed = results.map(parseRecording).filter((r): r is Recording => r !== null);
    if (chooseRecording(parsed)) return parsed;
  }
  return [];
}

export async function buildSongs(species: Species[], count: number, paths: Paths): Promise<Map<number, Song>> {
  const decoder = new MPEGDecoder();
  await decoder.ready;
  const songs = new Map<number, Song>();
  const missing: string[] = [];

  for (const s of species.slice(0, count)) {
    const info = await cachedJson<{ family?: string }>(`${GBIF.api}/species/${s.key}`, join(paths.cache, 'species', `${s.key}.json`));
    const best = chooseRecording(await candidates(s, info.family ?? '', paths.cache));
    if (!best) {
      missing.push(s.french);
      continue;
    }
    const full = await downloadCached(best.mp3, join(paths.cache, 'mp3', `${best.xcId}.mp3`), { minBytes: 10_000 });
    const mp3 = new Uint8Array(await readFile(full));

    // Trame par trame : le décodeur n'accepte pas de gros blocs d'un seul tenant.
    await decoder.reset();
    const decoded = decoder.decodeFrames(parseFrames(mp3).map((f) => mp3.subarray(f.offset, f.offset + f.length)));
    const rate = decoded.sampleRate;
    const mono = toMono(decoded.channelData);
    const start = bestWindow(mono, rate, CLIP_SECONDS);
    const clip = normalize(mono.subarray(start, start + CLIP_SECONDS * rate), rate);
    const spec = spectrogram(clip, rate, SPECTROGRAM);
    validateSpectrogram(spec.data, SPECTROGRAM, spec.frames, best.xcId);

    await writeFile(join(paths.out, 'songs', `${best.xcId}.mp3`), encode(clip, rate));
    await writeFile(join(paths.out, 'spectrograms', `${best.xcId}.bin`), spec.data);
    songs.set(s.key, {
      xcId: best.xcId,
      author: best.author,
      licence: best.licence,
      url: xenoCantoPage(best.xcId),
      countryCode: best.countryCode,
      year: best.year,
      duration: Math.round((clip.length / rate) * 10) / 10,
      frames: spec.frames,
    });
  }
  decoder.free();
  log.info(`${songs.size} chants${missing.length ? ` ; sans enregistrement utilisable : ${missing.join(', ')}` : ''}`);
  return songs;
}

/** Encode un signal mono en MP3. */
function encode(samples: Float32Array, sampleRate: number): Uint8Array {
  const encoder = new Mp3Encoder(1, sampleRate, CLIP_KBPS);
  const pcm = toInt16(samples);
  const parts: Uint8Array[] = [];
  for (let i = 0; i < pcm.length; i += 1152) parts.push(encoder.encodeBuffer(pcm.subarray(i, i + 1152)));
  parts.push(encoder.flush());
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
