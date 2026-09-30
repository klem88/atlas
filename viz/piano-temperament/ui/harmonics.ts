/**
 * L'échelle des harmoniques : une ligne par note, ses harmoniques posées sur un axe des fréquences
 * (logarithmique, une octave = même largeur). Les deux harmoniques de la paire regardée sont reliées :
 * si elles coïncident, l'intervalle est pur ; si elles se décalent, il bat.
 */
import type { PairBeats } from '../domain/beats';
import { noteName } from '@shell/music/pitch';
import { chordFrequencies, type TuningId } from '@shell/music/tuning';
import { fmtHz, fmtOrdinal } from './strings';

const N_HARMONICS = 8;
const ROW = 30;
const LEFT = 44;
const RIGHT = 12;
const TOP = 8;
const AXIS = 26;
const NS = 'http://www.w3.org/2000/svg';

export function renderHarmonics(svg: SVGSVGElement, notes: readonly number[], tuning: TuningId, pair: PairBeats | null): void {
  svg.innerHTML = '';
  if (notes.length === 0) return;
  const width = Math.max(280, svg.clientWidth || 600);
  const height = TOP + notes.length * ROW + AXIS;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.height = `${height}px`;

  const freqs = chordFrequencies(notes, tuning);
  const fMin = Math.min(...freqs) * 0.92;
  const fMax = Math.min(6000, Math.max(...freqs) * N_HARMONICS * 1.05);
  const x = (hz: number) => LEFT + ((Math.log2(hz) - Math.log2(fMin)) / (Math.log2(fMax) - Math.log2(fMin))) * (width - LEFT - RIGHT);

  const el = (name: string, attrs: Record<string, string | number>, text?: string) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if (text !== undefined) e.textContent = text;
    return e;
  };

  // Axe : repères en Hz
  const axisY = TOP + notes.length * ROW + 4;
  svg.append(el('line', { x1: LEFT, x2: width - RIGHT, y1: axisY, y2: axisY, class: 'h-axis' }));
  for (const hz of [50, 100, 200, 500, 1000, 2000, 4000]) {
    if (hz < fMin || hz > fMax) continue;
    svg.append(el('line', { x1: x(hz), x2: x(hz), y1: axisY, y2: axisY + 4, class: 'h-axis' }));
    svg.append(el('text', { x: x(hz), y: axisY + 16, class: 'h-tick', 'text-anchor': 'middle' }, hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`));
  }

  notes.forEach((midi, i) => {
    const y = TOP + i * ROW + ROW / 2;
    const f = freqs[i]!;
    svg.append(el('text', { x: LEFT - 8, y: y + 4, class: 'h-note', 'text-anchor': 'end' }, noteName(midi)));
    svg.append(el('line', { x1: LEFT, x2: width - RIGHT, y1: y, y2: y, class: 'h-row' }));
    const isLow = pair?.low === midi;
    const isHigh = pair?.high === midi;
    for (let k = 1; k <= N_HARMONICS; k++) {
      const hz = f * k;
      if (hz > fMax) break;
      const hit = (isLow && k === pair!.harmonics[0]) || (isHigh && k === pair!.harmonics[1]);
      const h = hit ? 11 : 4 + 6 / k;
      const tick = el('line', { x1: x(hz), x2: x(hz), y1: y - h, y2: y + h, class: hit ? 'h-tick-hit' : 'h-tick-mark' });
      tick.append(el('title', {}, `${fmtOrdinal(k)} harmonique de ${noteName(midi)} : ${fmtHz(hz)}`));
      svg.append(tick);
    }
  });

  // Lien entre les deux harmoniques regardées
  if (pair && notes.includes(pair.low) && notes.includes(pair.high)) {
    const yLow = TOP + notes.indexOf(pair.low) * ROW + ROW / 2;
    const yHigh = TOP + notes.indexOf(pair.high) * ROW + ROW / 2;
    svg.append(el('line', { x1: x(pair.lowHz), x2: x(pair.highHz), y1: yLow, y2: yHigh, class: 'h-link' }));
  }
}
