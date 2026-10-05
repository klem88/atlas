/**
 * Partition de piano rendue avec abcjs (notation ABC), à la largeur de son conteneur.
 *
 * Conventions d'écriture des partitions du site :
 * - deux voix, `RH` (clé de sol) et `LH` (clé de fa), assemblées par `pianoTune` ;
 * - les noms d'accords sont des annotations au-dessus (`"^Do7M"`), pas des symboles d'accords :
 *   abcjs lirait « Do9 » comme un accord anglais (D°9) ;
 * - les degrés sous la portée (`"_7M"`, `"_♭3"`) sont repérés et colorés à l'accent.
 */
import abcjs, { type TuneObject } from 'abcjs';

export interface PianoTuneOptions {
  /** Main droite, en notation ABC (sans en-tête). */
  rh: string;
  /** Main gauche, en notation ABC (sans en-tête). */
  lh: string;
  /** Tonalité de départ (champ K: d'ABC). */
  key?: string;
  meter?: string;
  /** Unité de durée : avec `1/8`, un « 8 » est une ronde. */
  unit?: string;
}

/** Assemble une partition de piano à deux portées. */
export function pianoTune({ rh, lh, key = 'C', meter = '4/4', unit = '1/8' }: PianoTuneOptions): string {
  return [
    'X:1',
    `M:${meter}`,
    `L:${unit}`,
    '%%staffsep 60',
    '%%sysstaffsep 30',
    '%%staves {RH LH}',
    'V:RH clef=treble',
    'V:LH clef=bass',
    `K:${key}`,
    `[V:RH] ${rh}`,
    // Tonalité redite en tête de la main gauche : sans elle, abcjs y affiche dès le début
    // l'armure d'un changement de tonalité placé plus loin.
    `[V:LH] [K:${key} clef=bass] ${lh}`,
    '',
  ].join('\n');
}

/** Avertissements d'abcjs à la lecture d'une partition (vide si tout est lisible). Marche sans navigateur. */
export function abcWarnings(abc: string): string[] {
  return abcjs.parseOnly(abc).flatMap((tune) => tune.warnings ?? []);
}

/** Note jouée par une partition : piste (0 = main droite), début et durée en rondes, hauteur MIDI. */
export interface PlayedNote {
  track: number;
  start: number;
  duration: number;
  midi: number;
}

/** Notes réellement jouées (reprises déroulées, altérations appliquées). Marche sans navigateur : sert aux tests. */
export function abcNotes(abc: string): PlayedNote[] {
  const tune = abcjs.parseOnly(abc)[0];
  if (!tune) return [];
  const out: PlayedNote[] = [];
  tune.setUpAudio({ chordsOff: true }).tracks.forEach((track, i) => {
    for (const ev of track) {
      if (ev.cmd === 'note' && 'pitch' in ev) out.push({ track: i, start: ev.start, duration: ev.duration, midi: ev.pitch });
    }
  });
  return out;
}

/** Une annotation est un degré (7M, 9, ♭3…) si elle commence par un chiffre, éventuellement altéré. */
export const isDegreeLabel = (text: string): boolean => /^[♭♯]?\d/.test(text.trim());

/** Nombre de mesures par ligne selon la largeur disponible. */
export const measuresPerLine = (width: number): number => (width < 520 ? 2 : width < 820 ? 3 : 4);

/** Une partition affichée, re-rendue quand la largeur de son conteneur change. */
export class Score {
  visual!: TuneObject;
  private lastWidth = 0;
  private listeners = new Set<() => void>();

  constructor(
    readonly el: HTMLElement,
    readonly abc: string,
  ) {
    this.render();
    new ResizeObserver(() => {
      if (Math.abs(this.el.clientWidth - this.lastWidth) < 20) return;
      this.render();
      for (const l of this.listeners) l();
    }).observe(this.el);
  }

  /** Prévient quand la partition est redessinée (la lecture en cours doit s'arrêter). */
  onRerender(listener: () => void): void {
    this.listeners.add(listener);
  }

  private render(): void {
    this.lastWidth = this.el.clientWidth;
    const width = Math.max(280, this.lastWidth - 12);
    this.visual = abcjs.renderAbc(this.el, this.abc, {
      add_classes: true,
      responsive: 'resize',
      staffwidth: width - 10,
      paddingleft: 4,
      paddingright: 4,
      foregroundColor: 'currentColor',
      wrap: { minSpacing: 1.6, maxSpacing: 2.7, preferredMeasuresPerLine: measuresPerLine(width) },
    })[0]!;
    this.el.querySelectorAll('.abcjs-annotation').forEach((n) => {
      if (isDegreeLabel(n.textContent ?? '')) n.classList.add('abcjs-degree');
    });
  }

  /** Position d'une ligne (système) dans le document, d'après les coordonnées internes d'abcjs. */
  lineBox(top: number, height: number): { top: number; height: number } | null {
    const svg = this.el.querySelector('svg');
    const vb = svg?.viewBox.baseVal;
    if (!svg || !vb || !vb.height) return null;
    const rect = svg.getBoundingClientRect();
    const scale = rect.height / vb.height;
    return { top: rect.top + window.scrollY + top * scale, height: height * scale };
  }
}
