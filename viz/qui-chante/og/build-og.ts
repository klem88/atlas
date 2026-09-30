/**
 * Image d'aperçu des liens (1200×630) pour « Qui chante autour de chez toi » :
 * titre, puis la partition du chœur de l'aube de Paris, dessinée depuis les vraies données.
 *
 *   npm run og -- qui-chante
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { GRID, type CellBlockFile, type CommunesFile, type SpeciesFile } from '../data/contract';
import { planChorus } from '../domain/chorus';
import { blockOf } from '../domain/grid';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, REPO_ROOT, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';

const DATA = join(REPO_ROOT, 'public', 'data', 'qui-chante');
const COMMUNE = '75056'; // Paris
const readJson = async <T>(path: string) => JSON.parse(await readFile(join(DATA, path), 'utf8')) as T;

/** Couleur « #rrggbb » → [r, g, b]. */
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d');
  const pad = 72;

  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('Nature · Oiseaux · France'.toUpperCase(), pad, 100);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 72px ${OG_FONTS.display}`;
  ctx.fillText('Qui chante autour de chez toi', pad, 185, OG_WIDTH - pad * 2);

  // Partition du chœur de Paris.
  const communes = await readJson<CommunesFile>('communes.json');
  const catalog = await readJson<SpeciesFile>('species.json');
  const cell = communes.cell[communes.codes.indexOf(COMMUNE)]!;
  const entry = (await readJson<CellBlockFile>(`cells/${blockOf(GRID, cell)}.json`)).cells[cell]!;
  const local = entry.species.map((s, k) => ({ species: catalog.species[s]!, count: entry.counts[k]! }));
  const plan = planChorus(local.map((l) => ({ count: l.count, duration: l.species.song?.duration ?? null })));

  const spec = catalog.spectrogram;
  const top = 240;
  const rowH = 46;
  const gap = 6;
  const label = 250;
  const x0 = pad + label;
  const width = OG_WIDTH - pad - x0;
  const [r, g, b] = rgb(t['seq-6']!);

  for (const [k, v] of plan.voices.entries()) {
    const song = local[v.index]!.species.song!;
    const y = top + k * (rowH + gap);
    ctx.fillStyle = t['surface-sunk']!;
    ctx.fillRect(x0, y, width, rowH);
    ctx.fillStyle = t['ink-2']!;
    ctx.font = `400 22px ${OG_FONTS.ui}`;
    ctx.fillText(local[v.index]!.species.french, pad, y + rowH / 2 + 8, label - 16);

    const data = new Uint8Array(await readFile(join(DATA, 'spectrograms', `${song.xcId}.bin`)));
    const img = createCanvas(song.frames, spec.bins);
    const ictx = img.getContext('2d');
    const pixels = ictx.createImageData(song.frames, spec.bins);
    for (let f = 0; f < song.frames; f++) {
      for (let bin = 0; bin < spec.bins; bin++) {
        const o = ((spec.bins - 1 - bin) * song.frames + f) * 4;
        pixels.data.set([r, g, b, Math.round(255 * (data[f * spec.bins + bin]! / 255) ** 0.8)], o);
      }
    }
    ictx.putImageData(pixels, 0, 0);
    const x = x0 + (v.start / plan.duration) * width;
    const w = ((song.frames * spec.frameSeconds) / plan.duration) * width;
    ctx.drawImage(img, x, y, w, rowH);
  }

  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 20px ${OG_FONTS.ui}`;
  ctx.fillText(`Le chœur de l’aube à Paris : ${local.length} espèces observées autour.`, pad, OG_HEIGHT - 40);

  console.log(`écrit ${await writeOgImage('qui-chante', canvas)}`);
}
