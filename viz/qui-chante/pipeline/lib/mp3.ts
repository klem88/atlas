/**
 * Lecture des trames d'un MP3 : le décodeur (mpg123-decoder) les reçoit une à une.
 */

export interface Mp3Frame {
  offset: number;
  length: number;
  sampleRate: number;
  samples: number;
}

/** Débits (kbit/s) par indice : MPEG-1 couche III, puis MPEG-2/2.5 couche III. */
const BITRATES_V1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const BITRATES_V2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const SAMPLE_RATES: Record<number, number[]> = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

/** Lit l'en-tête de trame à `o`, ou null si ce n'en est pas un (couche III seulement). */
export function readFrameHeader(buf: Uint8Array, o: number): Omit<Mp3Frame, 'offset'> | null {
  if (o + 4 > buf.length || buf[o] !== 0xff || (buf[o + 1]! & 0xe0) !== 0xe0) return null;
  const version = (buf[o + 1]! >> 3) & 3; // 3 = MPEG-1, 2 = MPEG-2, 0 = MPEG-2.5
  const layer = (buf[o + 1]! >> 1) & 3; // 1 = couche III
  if (version === 1 || layer !== 1) return null;
  const bitrateIndex = buf[o + 2]! >> 4;
  const rateIndex = (buf[o + 2]! >> 2) & 3;
  const padding = (buf[o + 2]! >> 1) & 1;
  if (bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) return null;
  const v1 = version === 3;
  const bitrate = (v1 ? BITRATES_V1 : BITRATES_V2)[bitrateIndex]! * 1000;
  const sampleRate = SAMPLE_RATES[version]![rateIndex]!;
  const samples = v1 ? 1152 : 576;
  const length = Math.floor(((samples / 8) * bitrate) / sampleRate) + padding;
  return { length, sampleRate, samples };
}

/** Taille d'une étiquette ID3v2 en tête de fichier (0 s'il n'y en a pas). */
function id3Size(buf: Uint8Array): number {
  if (buf.length < 10 || buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) return 0;
  return 10 + (((buf[6]! & 0x7f) << 21) | ((buf[7]! & 0x7f) << 14) | ((buf[8]! & 0x7f) << 7) | (buf[9]! & 0x7f));
}

/**
 * Liste les trames audio. Une trame n'est retenue que si la suivante commence bien là où
 * elle finit (ou si c'est la dernière) : évite de prendre des octets de données pour un en-tête.
 * La trame d'information Xing/Info (durée totale) est écartée : elle serait fausse après découpe.
 */
export function parseFrames(buf: Uint8Array): Mp3Frame[] {
  const frames: Mp3Frame[] = [];
  let o = id3Size(buf);
  while (o < buf.length) {
    const h = readFrameHeader(buf, o);
    const end = h ? o + h.length : 0;
    if (h && end > buf.length) break;
    if (h && (end + 4 > buf.length || readFrameHeader(buf, end) || isId3v1(buf, end))) {
      if (!(frames.length === 0 && isInfoFrame(buf, o, h.length))) frames.push({ offset: o, ...h });
      o = end;
    } else {
      o++;
    }
  }
  return frames;
}

/** Étiquette ID3v1 (« TAG », 128 octets) en fin de fichier. */
const isId3v1 = (buf: Uint8Array, o: number) => buf[o] === 0x54 && buf[o + 1] === 0x41 && buf[o + 2] === 0x47;

function isInfoFrame(buf: Uint8Array, o: number, length: number): boolean {
  const text = Buffer.from(buf.subarray(o, o + Math.min(length, 64))).toString('latin1');
  return text.includes('Xing') || text.includes('Info');
}

/** Durée totale (s). */
export function duration(frames: readonly Mp3Frame[]): number {
  return frames.reduce((s, f) => s + f.samples / f.sampleRate, 0);
}
