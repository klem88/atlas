/**
 * Rendu de la « partition » : le chœur de l'aube (voix décalées sur un temps commun)
 * et la liste de toutes les espèces, chacune avec son spectrogramme et son bouton d'écoute.
 */
import { fmtInt } from '@shell/format';
import { escapeHtml } from '@shell/html';
import type { Species, SpectrogramSpec } from '../data/contract';
import type { ChorusPlan } from '../domain/chorus';
import { PRESENCE_CLASSES } from '../domain/presence';
import { drawSpectrogram, loadSpectrogram } from './spectrogram';

export interface LocalSpecies {
  species: Species;
  count: number;
  presence: number;
}

export interface Urls {
  song(xcId: string): string;
  spectrogram(xcId: string): string;
}

const countryNames = new Intl.DisplayNames(['fr'], { type: 'region' });
const country = (code: string) => {
  try {
    return code ? countryNames.of(code) ?? code : '';
  } catch {
    return code;
  }
};

const PLAY_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true"><path class="i-play" d="M5 3.5v9l7.5-4.5z"/><path class="i-stop" d="M4.5 4.5h7v7h-7z"/></svg>`;

export function presenceHtml(presence: number): string {
  const label = PRESENCE_CLASSES[presence]!.label;
  const dots = [0, 1, 2, 3].map((i) => `<i${i >= presence ? ' data-on' : ''}></i>`).reverse().join('');
  return `<span class="presence" title="${label}"><span class="presence-dots" aria-hidden="true">${dots}</span>${label}</span>`;
}

function creditHtml(s: Species): string {
  const song = s.song!;
  const where = [country(song.countryCode), song.year].filter(Boolean).join(', ');
  return `Enregistré par ${escapeHtml(song.author)}${where ? ` (${escapeHtml(where)})` : ''} · ${escapeHtml(song.licence)} · <a href="${song.url}" target="_blank" rel="noopener">xeno-canto</a>`;
}

export function listHtml(local: readonly LocalSpecies[]): string {
  return local
    .map(({ species: s, count, presence }, i) => {
      const name = escapeHtml(s.french);
      const play = s.song
        ? `<button class="play" type="button" data-play="${i}" aria-label="Écouter : ${name}" aria-pressed="false">${PLAY_ICON}</button>`
        : `<span class="play play--none" title="Pas d’enregistrement publié pour cette espèce"></span>`;
      const spectro = s.song
        ? `<div class="spectro"><canvas data-spectro="${i}" aria-hidden="true"></canvas><span class="playhead" hidden></span></div>`
        : `<p class="spectro spectro--none">Pas d’enregistrement publié</p>`;
      return `<li class="bird" data-index="${i}">
        ${play}
        <div class="bird-head">
          <span class="bird-name">${name}</span>
          <i class="bird-sci">${escapeHtml(s.scientific)}</i>
        </div>
        <div class="bird-meta">${presenceHtml(presence)}<span class="detail"> · ${fmtInt(count)} obs.</span></div>
        ${spectro}
        ${s.song ? `<p class="bird-credit detail">${creditHtml(s)}</p>` : ''}
      </li>`;
    })
    .join('');
}

export function chorusHtml(local: readonly LocalSpecies[], plan: ChorusPlan): string {
  const rows = plan.voices
    .map((v, k) => {
      const s = local[v.index]!.species;
      return `<li class="voice" data-voice="${k}">
        <span class="voice-name">${escapeHtml(s.french)}</span>
        <canvas data-voice-spectro="${k}" aria-hidden="true"></canvas>
      </li>`;
    })
    .join('');
  const ticks = Array.from({ length: Math.floor(plan.duration / 5) + 1 }, (_, i) => i * 5)
    .map((t) => `<span style="left:${(100 * t) / plan.duration}%">${t} s</span>`)
    .join('');
  return `<ol class="voices">${rows}</ol>
    <div class="voices-axis" aria-hidden="true">${ticks}</div>
    <div class="voices-track" aria-hidden="true"><span class="playhead playhead--chorus" hidden></span></div>`;
}

/** Dessine un spectrogramme de la liste dès qu'il approche de l'écran. */
export function lazySpectrograms(
  root: HTMLElement,
  local: readonly LocalSpecies[],
  spec: SpectrogramSpec,
  urls: Urls,
  color: () => string,
): { redraw(): void; disconnect(): void } {
  const drawn = new Map<HTMLCanvasElement, Uint8Array>();
  const draw = (canvas: HTMLCanvasElement, data: Uint8Array, s: Species) =>
    drawSpectrogram(canvas, data, spec, s.song!.frames, color());

  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const canvas = e.target as HTMLCanvasElement;
        observer.unobserve(canvas);
        const s = local[Number(canvas.dataset.spectro)]!.species;
        loadSpectrogram(urls.spectrogram(s.song!.xcId))
          .then((data) => {
            drawn.set(canvas, data);
            draw(canvas, data, s);
          })
          .catch(() => canvas.closest('.spectro')?.classList.add('spectro--error'));
      }
    },
    { rootMargin: '400px 0px' },
  );
  root.querySelectorAll<HTMLCanvasElement>('canvas[data-spectro]').forEach((c) => observer.observe(c));

  return {
    redraw() {
      for (const [canvas, data] of drawn) draw(canvas, data, local[Number(canvas.dataset.spectro)]!.species);
    },
    disconnect: () => observer.disconnect(),
  };
}
