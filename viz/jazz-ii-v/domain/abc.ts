/**
 * Les deux mesures d'une cellule en notation ABC, pour abcjs : armure de la tonalité, altérations écrites dès qu'elles
 * diffèrent de l'armure, ou qu'elles reviennent à l'armure après une autre altération dans la mesure, notes liées au passage de la barre,
 * noms d'accords au-dessus de la main droite. Croches écrites droites, avec « Swing » en tête, comme dans les
 * recueils de jazz.
 */
import { pianoTune } from '@shell/music/score';
import { FENETRE, type Cellule, type Evenement } from './cellules';
import { lireNom, spellDegree, tonicName, type Mode } from './spelling';

const LETTRES_ABC = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURELLE = [0, 2, 4, 5, 7, 9, 11];

/** Nom ABC de la tonalité (« Bb », « F#m »). */
export function cleAbc(tonique: number, mode: Mode): string {
  const { lettre, alteration } = lireNom(tonicName(tonique, mode));
  return LETTRES_ABC[lettre]! + (alteration === 1 ? '#' : alteration === -1 ? 'b' : '') + (mode === 'mineur' ? 'm' : '');
}

/** Altération de chaque lettre (do = 0) dans l'armure. */
export function armure(tonique: number, mode: Mode): number[] {
  const majeur = tonicName(mode === 'majeur' ? tonique : (tonique + 3) % 12, 'majeur');
  const alt = new Array<number>(7).fill(0);
  for (let d = 1; d <= 7; d++) {
    const { lettre, alteration } = lireNom(spellDegree(majeur, String(d)));
    alt[lettre] = alteration;
  }
  return alt;
}

/** Un nom en minuscules (« ré♭ ») et sa hauteur MIDI → lettre, altération et octave. */
function lire(nom: string, midi: number): { lettre: number; alteration: number; octave: number } {
  const { lettre, alteration } = lireNom(nom.charAt(0).toUpperCase() + nom.slice(1));
  const naturelle = midi - alteration;
  const octave = Math.floor(naturelle / 12) - 1;
  if (((naturelle % 12) + 12) % 12 !== NATURELLE[lettre]) throw new Error(`${nom} ne correspond pas à la note MIDI ${midi}`);
  return { lettre, alteration, octave };
}

const SIGNES: Record<number, string> = { [-2]: '__', [-1]: '_', 0: '=', 1: '^', 2: '^^' };

/** Note ABC (do4 = « C », do5 = « c », do3 = « C, »), avec l'altération si elle est nécessaire. */
function noteAbc(nom: string, midi: number, mesure: Map<string, number>, arm: readonly number[]): string {
  const { lettre, alteration, octave } = lire(nom, midi);
  const cle = `${lettre}:${octave}`;
  // Toute altération hors armure est écrite, même répétée dans la mesure : abcjs ne retient pas celle d'une note
  // liée par-dessus la barre, et ces rappels aident à lire. Le retour à l'armure n'est écrit qu'après une autre
  // altération de la même note dans la mesure (si♭ après si♮ en si♭ majeur).
  const courante = mesure.get(cle) ?? arm[lettre]!;
  const signe = alteration !== arm[lettre] || courante !== alteration ? SIGNES[alteration]! : '';
  mesure.set(cle, alteration);
  const l = LETTRES_ABC[lettre]!;
  const hauteur = octave >= 5 ? l.toLowerCase() + "'".repeat(octave - 5) : l + ','.repeat(4 - octave);
  return signe + hauteur;
}

/** Une durée en croches, découpée en valeurs écrivables (ronde, blanche pointée, blanche, noire pointée…). */
function morceaux(croches: number): number[] {
  const out: number[] = [];
  let reste = Math.round(croches);
  for (const v of [8, 6, 4, 3, 2, 1])
    while (reste >= v) {
      out.push(v);
      reste -= v;
    }
  return out;
}
const longueur = (n: number) => (n === 1 ? '' : String(n));

/**
 * Une voix : les événements complétés par des silences, coupés aux barres de mesure et aux `coupures`
 * (début des accords, pour y accrocher leur nom), puis écrits.
 */
function voix(evts: readonly Evenement[], arm: readonly number[], coupures: ReadonlyMap<number, string>): string {
  // Événements et silences, bout à bout.
  const pleins: Evenement[] = [];
  let t = 0;
  for (const e of [...evts].sort((a, b) => a.debut - b.debut)) {
    if (e.debut > t) pleins.push({ debut: t, duree: e.debut - t, notes: [], noms: [] });
    pleins.push(e);
    t = e.debut + e.duree;
  }
  if (t < FENETRE) pleins.push({ debut: t, duree: FENETRE - t, notes: [], noms: [] });
  // Coupures : barre de mesure et débuts d'accords.
  const bornes = [...new Set([4, ...coupures.keys()])].sort((a, b) => a - b);
  const bouts: (Evenement & { lie: boolean })[] = [];
  for (const e of pleins) {
    let debut = e.debut;
    const fin = e.debut + e.duree;
    for (const b of bornes)
      if (b > debut && b < fin) {
        bouts.push({ ...e, debut, duree: b - debut, lie: e.notes.length > 0 });
        debut = b;
      }
    bouts.push({ ...e, debut, duree: fin - debut, lie: false });
  }
  let mesure = new Map<string, number>();
  const jetons: string[] = [];
  for (const b of bouts) {
    if (b.debut === 4) {
      jetons.push('|');
      mesure = new Map();
    }
    const nom = coupures.get(b.debut);
    const annotation = nom ? `"^${nom}"` : '';
    const valeurs = morceaux(b.duree * 2);
    valeurs.forEach((v, k) => {
      const lie = b.notes.length > 0 && (k < valeurs.length - 1 || b.lie) ? '-' : '';
      let corps: string;
      if (!b.notes.length) corps = 'z';
      else {
        const notes = b.notes.map((m, i) => noteAbc(b.noms[i]!, m, mesure, arm));
        corps = notes.length > 1 ? `[${notes.join('')}]` : notes[0]!;
      }
      jetons.push((k === 0 ? annotation : '') + corps + longueur(v) + lie);
    });
  }
  jetons.push('|]');
  return jetons.join(' ');
}

/** La partition ABC des deux mesures. */
export function abcCellule(c: Cellule, tonique: number, mode: Mode): string {
  const arm = armure(tonique, mode);
  const noms = new Map<number, string>(c.accords.map((a) => [a.debut, a.nom]));
  noms.set(0, `Swing · ${noms.get(0) ?? ''}`);
  return pianoTune({ rh: voix(c.md, arm, noms), lh: voix(c.mg, arm, new Map()), key: cleAbc(tonique, mode) });
}
