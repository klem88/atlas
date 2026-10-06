/**
 * Mini-clavier en SVG, sans interaction : des touches, et des pastilles sur les notes à jouer.
 * Trois sortes de pastilles : les notes du mode (encre légère), les notes guides (accent), les notes jouées
 * par la main gauche (encre).
 */

export type Marque = 'mode' | 'guide' | 'joue';

const BLANCHE = 14;
const NOIRE = 9;
const H_BLANCHE = 48;
const H_NOIRE = 30;
const NOIRES = new Set([1, 3, 6, 8, 10]);

const pc = (n: number) => ((n % 12) + 12) % 12;

/** Clavier de `debut` à `fin` (MIDI, inclus ; `debut` doit être une touche blanche). */
export function miniClavier(debut: number, fin: number, marques: ReadonlyMap<number, Marque>, label: string): string {
  const blanches: { midi: number; x: number }[] = [];
  const noires: { midi: number; x: number }[] = [];
  let x = 0;
  for (let m = debut; m <= fin; m++) {
    if (NOIRES.has(pc(m))) noires.push({ midi: m, x: x - NOIRE / 2 });
    else {
      blanches.push({ midi: m, x });
      x += BLANCHE;
    }
  }
  const largeur = x;
  const pastille = (midi: number, cx: number, cy: number) => {
    const marque = marques.get(midi);
    return marque ? `<circle class="pastille pastille-${marque}" cx="${cx}" cy="${cy}" r="3.6"/>` : '';
  };
  return `<svg class="mini-clavier" viewBox="-1 -1 ${largeur + 2} ${H_BLANCHE + 2}" role="img" aria-label="${label}">
    ${blanches.map((b) => `<rect class="touche-blanche" x="${b.x}" y="0" width="${BLANCHE}" height="${H_BLANCHE}" rx="2"/>`).join('')}
    ${blanches.map((b) => pastille(b.midi, b.x + BLANCHE / 2, H_BLANCHE - 9)).join('')}
    ${noires.map((n) => `<rect class="touche-noire" x="${n.x}" y="0" width="${NOIRE}" height="${H_NOIRE}" rx="1.5"/>`).join('')}
    ${noires.map((n) => pastille(n.midi, n.x + NOIRE / 2, H_NOIRE - 7)).join('')}
  </svg>`;
}

