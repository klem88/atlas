/**
 * Le rail des harmoniques (élément signature) : un jeton par rang, posé au-dessus de la touche la plus proche
 * et décalé de son écart en cents. Plein quand le rang est allumé ; à l'accent quand il tombe entre les touches.
 * Les positions sont lues sur les touches du clavier (même conteneur défilant).
 */
import { noteName } from '@shell/music/pitch';
import type { Partial } from '../domain/partials';

const TOKEN = 30;
const ROW = 34;

export interface Rail {
  update(partials: readonly Partial[], on: ReadonlySet<number>): void;
}

export function createRail(root: HTMLElement, keyboardRoot: HTMLElement, onToggle: (k: number) => void): Rail {
  root.className = 'rail';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Harmoniques, une par rang : allume ou éteins chacune');
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-rank]');
    if (b) onToggle(Number(b.dataset.rank));
  });

  return {
    update(partials, on) {
      root.innerHTML = '';
      const keys = new Map<number, HTMLElement>();
      for (const k of keyboardRoot.querySelectorAll<HTMLElement>('[data-midi]')) keys.set(Number(k.dataset.midi), k);
      const white = keyboardRoot.querySelector<HTMLElement>('.key--white');
      const semitone = white ? (white.offsetWidth * 7) / 12 : 20;

      const placed: { x: number; row: number }[] = [];
      const rows: number[] = [];
      const items = partials.map((p) => {
        const key = keys.get(p.midi);
        const x = key ? key.offsetLeft + key.offsetWidth / 2 + (p.cents / 100) * semitone : 0;
        return { p, x };
      });
      // Rangées : un jeton passe au-dessus si un autre est à moins d'un jeton de large.
      for (const it of items.sort((a, b) => a.x - b.x)) {
        let row = 0;
        while (placed.some((q) => q.row === row && Math.abs(q.x - it.x) < TOKEN + 4)) row++;
        placed.push({ x: it.x, row });
        rows.push(row);
      }
      const maxRow = Math.max(0, ...rows);
      root.style.height = `${(maxRow + 1) * ROW + 6}px`;

      items.forEach((it, i) => {
        const { p } = it;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `rail-token${on.has(p.k) ? ' is-on' : ''}${p.onKey ? '' : ' is-off-key'}`;
        b.dataset.rank = String(p.k);
        b.textContent = String(p.k);
        b.style.left = `${it.x - TOKEN / 2}px`;
        b.style.bottom = `${rows[i]! * ROW + 4}px`;
        b.setAttribute('aria-pressed', String(on.has(p.k)));
        const off = p.cents === 0 ? 'juste' : `${p.cents > 0 ? '+' : '−'}${Math.abs(p.cents).toLocaleString('fr-FR')} cents`;
        b.setAttribute('aria-label', `Rang ${p.k} : ${p.hz.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Hz, ${noteName(p.midi)} ${off}`);
        b.title = `Rang ${p.k} · ${p.hz.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Hz · ${noteName(p.midi)} ${off}`;
        root.append(b);
        // Un fil jusqu'à la touche, pour lire le décalage
        const line = document.createElement('span');
        line.className = `rail-line${p.onKey ? '' : ' is-off-key'}`;
        line.style.left = `${it.x}px`;
        line.style.height = `${rows[i]! * ROW + 4}px`;
        root.append(line);
      });
    },
  };
}
