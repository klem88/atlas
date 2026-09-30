/**
 * Clavier jouable : des boutons (accessibles au clavier et au lecteur d'écran), touches blanches
 * en flex, touches noires posées par-dessus en pourcentage de la largeur.
 */
import { noteName, pitchClass, pitchName } from './pitch';

export interface KeyRange {
  low: number;
  high: number;
}

/** Une octave (do4–do5) sur téléphone, deux (do3–do5) dès qu'il y a la place. */
export function chooseRange(widthPx: number): KeyRange {
  return widthPx < 560 ? { low: 60, high: 72 } : { low: 48, high: 72 };
}

const BLACK = new Set([1, 3, 6, 8, 10]);
export const isBlack = (midi: number) => BLACK.has(pitchClass(midi));

export interface Keyboard {
  update(selected: readonly number[]): void;
  range: KeyRange;
}

export function renderKeyboard(root: HTMLElement, range: KeyRange, onToggle: (midi: number) => void): Keyboard {
  const midis = Array.from({ length: range.high - range.low + 1 }, (_, i) => range.low + i);
  const whites = midis.filter((m) => !isBlack(m));
  const whiteW = 100 / whites.length;
  const blackW = whiteW * 0.62;

  root.innerHTML = '';
  root.className = 'keyboard';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', `Clavier de ${noteName(range.low)} à ${noteName(range.high)}`);

  const keys = new Map<number, HTMLButtonElement>();
  let whiteIndex = 0;
  for (const m of midis) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.midi = String(m);
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', noteName(m));
    if (isBlack(m)) {
      b.className = 'key key--black';
      b.style.left = `calc(${whiteIndex * whiteW}% - ${blackW / 2}%)`;
      b.style.width = `${blackW}%`;
    } else {
      b.className = 'key key--white';
      const label = document.createElement('span');
      label.className = 'key-label';
      label.textContent = pitchClass(m) === 0 ? noteName(m) : pitchName(m);
      b.append(label);
      whiteIndex++;
    }
    b.addEventListener('click', () => onToggle(m));
    keys.set(m, b);
    root.append(b);
  }

  // Flèches gauche/droite : d'une touche à l'autre sans passer par toute la page.
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const current = Number((e.target as HTMLElement).dataset.midi);
    if (!Number.isFinite(current)) return;
    const next = current + (e.key === 'ArrowRight' ? 1 : -1);
    keys.get(next)?.focus();
    e.preventDefault();
  });

  return {
    range,
    update(selected) {
      const set = new Set(selected);
      for (const [m, b] of keys) {
        const on = set.has(m);
        b.setAttribute('aria-pressed', String(on));
        b.classList.toggle('is-on', on);
      }
    },
  };
}
