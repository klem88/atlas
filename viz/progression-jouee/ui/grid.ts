/**
 * La grille d'un morceau nommé : ses parties, ses accords en cases (largeur selon la durée), la progression
 * surlignée, et un curseur pendant l'écoute.
 */
import { parseChord } from '@shell/music/chords';
import { degreeLabel, degreeOf, degreeToken, type Degree } from '@shell/music/degrees';
import { escapeHtml } from '@shell/html';
import type { NamedSong } from '../data/contract';
import { highlightRange } from '../domain/examples';

export interface GridCell {
  section: number;
  index: number;
  symbol: string;
  beats: number;
  degree: string;
  highlighted: boolean;
  /** Notes jouables (classes de hauteur + basse), `null` pour un silence. */
  chord: ReturnType<typeof parseChord>;
}

/** Symbole lisible : « C:maj/3 » → « C/3 », « A:min7 » → « Am7 », « B:hdim7 » → « Bø7 », « Dmin7 » → « Dm7 ». */
export function prettySymbol(symbol: string): string {
  return symbol
    .replace(':', '')
    .replace(/^([A-G][#b]?)maj(?=$|\/|\()/, '$1')
    .replace(/^([A-G][#b]?)min/, '$1m')
    .replace('hdim7', 'ø7')
    .replace('hdim', 'ø')
    .replace(/^([A-G][#b]?)dim/, '$1°')
    .replace(/\(([^)]*)\)/, '$1');
}

export function gridCells(song: NamedSong, p: readonly Degree[]): GridCell[][] {
  const needle = p.map(degreeToken);
  return song.sections.map((sec, si) => {
    const chords = sec.chords.map(([symbol]) => parseChord(symbol));
    const tokenOfChord = chords.map((c) => (c ? degreeToken(degreeOf(c, song.tonic)) : -1));
    const range = highlightRange(tokenOfChord, needle);
    return sec.chords.map(([symbol, beats], i) => {
      const c = chords[i]!;
      return {
        section: si,
        index: i,
        symbol: prettySymbol(symbol),
        beats,
        degree: c ? degreeLabel(degreeOf(c, song.tonic)) : '—',
        highlighted: range !== null && i >= range[0] && i <= range[1],
        chord: c,
      };
    });
  });
}

export function renderGrid(root: HTMLElement, song: NamedSong, cells: GridCell[][], onClose: () => void, onPlay: () => void): void {
  const sections = song.sections
    .map(
      (sec, si) => `
      <div class="grid-section">
        <p class="grid-section-name">${escapeHtml(sec.name)}</p>
        <div class="grid-row">${cells[si]!
          .map(
            (c) =>
              `<span class="grid-cell${c.highlighted ? ' is-hit' : ''}" style="--beats:${Math.max(1, Math.min(8, c.beats))}" data-section="${si}" data-index="${c.index}"><span class="grid-symbol">${escapeHtml(c.symbol)}</span><span class="grid-degree">${escapeHtml(c.degree)}</span></span>`,
          )
          .join('')}</div>
      </div>`,
    )
    .join('');
  root.innerHTML = `
    <header class="grid-head">
      <div>
        <p class="grid-title">${escapeHtml(song.title)}</p>
        <p class="grid-meta">${escapeHtml(song.artist)}${song.year ? ` · ${song.year}` : ''} · ${song.corpus === 'irb' ? 'standard de jazz (iRb)' : 'Billboard (McGill)'} · en ${escapeHtml(keyName(song))}</p>
      </div>
      <div class="grid-actions">
        <button class="button" type="button" data-grid-play>Écouter la grille</button>
        <button class="button button--icon" type="button" data-grid-close aria-label="Fermer la grille">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" /></svg>
        </button>
      </div>
    </header>
    <div class="grid-body">${sections}</div>
    <p class="grid-hint detail">Une case par accord, large selon sa durée ; en dessous, son degré dans la tonalité du morceau. Les cases à l’accent portent ta progression.</p>`;
  root.hidden = false;
  root.querySelector('[data-grid-close]')!.addEventListener('click', onClose);
  root.querySelector('[data-grid-play]')!.addEventListener('click', onPlay);
}

const NAMES = ['do', 'ré♭', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
export function keyName(song: NamedSong): string {
  const tonic = song.mode === 'major' ? song.tonic : (song.tonic + 9) % 12;
  return `${NAMES[tonic]} ${song.mode === 'major' ? 'majeur' : 'mineur'}`;
}

/** Met le curseur d'écoute sur une case (ou l'enlève). */
export function setCursor(root: HTMLElement, section: number | null, index: number | null): void {
  root.querySelectorAll('.grid-cell.is-playing').forEach((e) => e.classList.remove('is-playing'));
  if (section === null || index === null) return;
  const cell = root.querySelector<HTMLElement>(`.grid-cell[data-section="${section}"][data-index="${index}"]`);
  cell?.classList.add('is-playing');
  cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
