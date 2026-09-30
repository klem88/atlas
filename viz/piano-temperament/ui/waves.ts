/**
 * La vague des battements (élément signature), sur canvas.
 *
 *   En haut : les deux harmoniques qui devraient coïncider, sur quelques cycles, à l'instant t.
 *             Tempérées, elles glissent l'une contre l'autre au fil du temps.
 *   En bas  : leur somme sur une fenêtre de quelques battements, avec son enveloppe.
 *             Tempérée, elle gonfle et se creuse ; pure, elle est plate.
 */
import { beatEnvelope, type PairBeats } from '../domain/beats';

export interface WaveTheme {
  low: string;
  high: string;
  sum: string;
  envelope: string;
  grid: string;
  playhead: string;
  ink3: string;
}

export function readWaveTheme(): WaveTheme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return { low: v('--seq-3'), high: v('--seq-5'), sum: v('--seq-1'), envelope: v('--ink'), grid: v('--rule'), playhead: v('--accent'), ink3: v('--ink-3') };
}

export interface WaveFrame {
  pair: PairBeats | null;
  /** Durée affichée en bas (s). */
  windowS: number;
  /** Instant courant (s) : position de la tête de lecture et glissement des ondes du haut. */
  t: number;
  playing: boolean;
}

const TOP_SHARE = 0.36;
const CYCLES_TOP = 5;

export interface Waves {
  render(frame: WaveFrame): void;
  resize(): void;
}

/** `fixed` : taille imposée (image de partage, hors page) au lieu de celle du canvas dans la page. */
export function createWaves(canvas: HTMLCanvasElement, theme: () => WaveTheme, fixed?: { width: number; height: number }): Waves {
  const ctx = canvas.getContext('2d')!;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let last: WaveFrame = { pair: null, windowS: 1, t: 0, playing: false };

  function resize() {
    const rect = fixed ?? canvas.getBoundingClientRect();
    dpr = fixed ? 1 : Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    render(last);
  }

  function render(frame: WaveFrame) {
    last = frame;
    const th = theme();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const { pair } = frame;
    if (!pair) return;

    const topH = Math.round(height * TOP_SHARE);
    const gap = 14;
    const bottomY = topH + gap;
    const bottomH = height - bottomY;

    // Séparation
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, topH + gap / 2);
    ctx.lineTo(width, topH + gap / 2);
    ctx.stroke();

    drawTop(pair, frame.t, 0, topH, th);
    drawBottom(pair, frame.windowS, frame.t, frame.playing, bottomY, bottomH, th);
  }

  /** Les deux harmoniques sur quelques cycles, à partir de l'instant t. */
  function drawTop(pair: PairBeats, t: number, y0: number, h: number, th: WaveTheme) {
    const mid = y0 + h / 2;
    const amp = h * 0.36;
    const span = CYCLES_TOP / pair.lowHz;
    const n = Math.max(200, width * 2);
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (const [hz, color] of [
      [pair.lowHz, th.low],
      [pair.highHz, th.high],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const tau = t + (i / n) * span;
        const x = (i / n) * width;
        const y = mid - amp * Math.sin(2 * Math.PI * hz * tau);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Axe zéro discret
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(width, mid);
    ctx.stroke();
  }

  /** La somme sur la fenêtre, avec enveloppe et tête de lecture. */
  function drawBottom(pair: PairBeats, windowS: number, t: number, playing: boolean, y0: number, h: number, th: WaveTheme) {
    const labels = 16; // bande réservée aux repères de temps
    const mid = y0 + (h - labels) / 2;
    const amp = (h - labels) * 0.44; // pour une somme d'amplitude 2
    const delta = pair.beatHz;

    // Somme réelle : min/max par colonne, échantillonnée assez finement pour ne rien inventer.
    const cyclesPerCol = (pair.lowHz * windowS) / width;
    const perCol = Math.max(6, Math.ceil(cyclesPerCol * 5));
    ctx.fillStyle = th.sum;
    ctx.beginPath();
    const maxes: number[] = [];
    const mins: number[] = [];
    for (let x = 0; x < width; x++) {
      let lo = Infinity;
      let hi = -Infinity;
      for (let s = 0; s < perCol; s++) {
        const tau = ((x + s / perCol) / width) * windowS;
        const v = Math.sin(2 * Math.PI * pair.lowHz * tau) + Math.sin(2 * Math.PI * pair.highHz * tau);
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      maxes.push(hi);
      mins.push(lo);
    }
    ctx.moveTo(0, mid - (amp / 2) * maxes[0]!);
    for (let x = 1; x < width; x++) ctx.lineTo(x, mid - (amp / 2) * maxes[x]!);
    for (let x = width - 1; x >= 0; x--) ctx.lineTo(x, mid - (amp / 2) * mins[x]!);
    ctx.closePath();
    ctx.fill();

    // Enveloppe analytique : 2·|cos(π·Δf·t)|
    ctx.strokeStyle = th.envelope;
    ctx.lineWidth = 1.5;
    for (const sign of [1, -1]) {
      ctx.beginPath();
      for (let x = 0; x <= width; x++) {
        const tau = (x / width) * windowS;
        const e = beatEnvelope(delta, tau);
        const y = mid - sign * (amp / 2) * e;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Axe du temps
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(width, mid);
    ctx.stroke();
    ctx.fillStyle = th.ink3;
    ctx.font = '12px "Atkinson Hyperlegible Next", system-ui, sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText('0 s', 2, y0 + h - 2);
    ctx.textAlign = 'right';
    ctx.fillText(`${formatSeconds(windowS)}`, width - 2, y0 + h - 2);

    if (playing) {
      const x = ((t % windowS) / windowS) * width;
      ctx.strokeStyle = th.playhead;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y0 + h);
      ctx.stroke();
    }
  }

  return { render, resize };
}

function formatSeconds(s: number): string {
  if (s >= 1) return `${s.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`;
  return `${Math.round(s * 1000)} ms`;
}
