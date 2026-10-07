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

/**
 * Une annotation est un degré d'accord en chiffres romains (I7M, V⁶, ii7/IV…). Aucun nom d'accord
 * français ne commence par I ou V.
 */
export const isRomanLabel = (text: string): boolean => /^[♭♯]?[IViv]/.test(text.trim());

/** Ce qu'on écrit au-dessus de la portée : le nom des accords, leur degré, ou les deux. */
export type ChordLabelMode = 'names' | 'degrees' | 'both';

/**
 * Les accords s'écrivent `"^Do7M|I7M"` (nom|degré). Selon le mode, on garde le nom, le degré,
 * ou les deux l'un au-dessus de l'autre. Une annotation sans « | » reste telle quelle.
 */
export function applyChordLabels(abc: string, mode: ChordLabelMode): string {
  return mapAnnotations(abc, (text) => {
    const m = /^\^([^|]+)\|(.+)$/.exec(text);
    if (!m) return `"${text}"`;
    const [, name, degree] = m;
    return mode === 'names' ? `"^${name}"` : mode === 'degrees' ? `"^${degree}"` : `"^${name}""^${degree}"`;
  });
}

/**
 * Réécrit chaque texte entre guillemets d'une partition ABC (`fn` reçoit le texte sans guillemets
 * et renvoie le remplacement, guillemets compris). Les guillemets sont appariés dans l'ordre :
 * dans `"_3"^c4`, le `^` qui suit est un dièse, pas le début d'une annotation.
 */
export function mapAnnotations(abc: string, fn: (text: string) => string): string {
  return abc
    .split(/("[^"]*")/)
    .map((part, i) => (i % 2 === 1 ? fn(part.slice(1, -1)) : part))
    .join('');
}

/** Nombre de mesures par ligne selon la largeur disponible. */
export const measuresPerLine = (width: number): number => (width < 520 ? 2 : width < 820 ? 3 : 4);

/** Une partition affichée, re-rendue quand la largeur de son conteneur change. */
export class Score {
  visual!: TuneObject;
  private lastWidth = 0;
  private listeners = new Set<() => void>();

  constructor(
    readonly el: HTMLElement,
    private abc: string,
    /** Une seule ligne, sans retour, pour une courte cellule de deux mesures (une mesure par ligne sur téléphone). */
    private readonly uneLigne = false,
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

  /** Remplace la partition (par exemple pour changer les noms d'accords en degrés). */
  setAbc(abc: string): void {
    if (abc === this.abc) return;
    this.abc = abc;
    this.render();
    for (const l of this.listeners) l();
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
      // Une cellule courte tient sur une ligne, sauf sur un téléphone, où chaque mesure prend la sienne.
      ...(this.uneLigne && width >= 420
        ? {}
        : { wrap: { minSpacing: 1.6, maxSpacing: 2.7, preferredMeasuresPerLine: this.uneLigne ? 1 : measuresPerLine(width) } }),
    })[0]!;
    this.el.querySelectorAll('.abcjs-annotation').forEach((n) => {
      const text = n.textContent ?? '';
      if (isDegreeLabel(text)) n.classList.add('abcjs-degree');
      else if (isRomanLabel(text)) n.classList.add('abcjs-roman');
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
