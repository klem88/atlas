/**
 * Les progressions courantes, en trois familles : dans la gamme, avec des voisins (dominantes secondaires, emprunts),
 * et celles qui changent de tonalité. Les degrés sont lus dans la tonalité du moment ; une modulation la déplace.
 */
import type { Degree } from '@shell/music/degrees';
import { chordAt, mod12, parseRoleLabel, type Chord } from './harmony';

export type Family = 'gamme' | 'voisins' | 'modulation';

export const FAMILY_LABELS: Readonly<Record<Family, string>> = {
  gamme: 'Dans la gamme',
  voisins: 'Avec des voisins',
  modulation: 'Qui changent de tonalité',
};

export interface Progression {
  id: string;
  name: string;
  family: Family;
  /** Étiquettes de degrés (I, ♭VII, V/V…), répétitions comprises (le blues se joue mesure par mesure). */
  labels: readonly string[];
  blurb: string;
  /** Durée d'un accord, en secondes. */
  seconds: number;
  /** Après le pas `i`, la tonalité monte de `n` demi-tons (on lit les degrés suivants dans la nouvelle). */
  modulations?: Readonly<Record<number, number>>;
}

const p = (id: string, family: Family, name: string, chain: string, blurb: string, seconds = 0.9, modulations?: Record<number, number>): Progression => ({
  id,
  family,
  name,
  labels: chain.split('–'),
  blurb,
  seconds,
  ...(modulations ? { modulations } : {}),
});

export const LIBRARY: readonly Progression[] = [
  p('pop', 'gamme', 'L’axe de la pop', 'I–V–vi–IV', 'On part de la maison, on monte en tension, on se pose à côté (vi), on reprend son élan (IV). Let It Be, With or Without You.'),
  p('melancolique', 'gamme', 'La même, côté sombre', 'vi–IV–I–V', 'Les mêmes quatre accords, mais on commence sur le repos mineur : la boucle sonne grave. Zombie (The Cranberries).'),
  p('doowop', 'gamme', 'Les années 50', 'I–vi–IV–V', 'Maison, repos mineur, départ, tension… et on recommence. Stand By Me.'),
  p('rocknroll', 'gamme', 'Les trois accords du rock', 'I–IV–V–I', 'Départ, tension, retour : la phrase complète en trois accords. La Bamba, Twist and Shout.'),
  p('ii-v-i', 'gamme', 'Le pas de deux du jazz', 'ii–V–I', 'Deux quintes descendantes d’affilée : la façon la plus sûre de rentrer à la maison. Autumn Leaves.'),
  p('plagale', 'gamme', 'La cadence « amen »', 'I–IV–I', 'Un aller-retour avec le départ, sans passer par la tension : la fin des cantiques.'),
  p('turnaround', 'gamme', 'Le tour du jazz', 'I–vi–ii–V', 'Trois quintes descendantes en boucle : le V renvoie au I et le tour recommence. I Got Rhythm.'),
  p('cercle', 'gamme', 'Le cercle des quintes', 'iii–vi–ii–V–I', 'Chaque accord tombe d’une quinte sur le suivant jusqu’à la maison. Sur la carte en cercle, on fait le tour.'),
  p('royal', 'gamme', 'La route royale', 'IV–V–iii–vi', 'Départ, tension… mais au lieu de rentrer, on glisse sur iii puis vi. Très aimée de la pop japonaise.'),
  p('pachelbel', 'gamme', 'Le canon de Pachelbel', 'I–V–vi–iii–IV–I–IV–V', 'Une basse qui descend pas à pas, reprise par des milliers de chansons depuis trois siècles.', 0.8),
  p('blues', 'gamme', 'Le blues de 12 mesures', 'I–I–I–I–IV–IV–I–I–V–IV–I–V', 'Quatre mesures à la maison, deux au départ, deux à la maison, puis tension, départ, maison et la relance.', 0.55),

  p('mario', 'voisins', 'La victoire de Mario', 'I–♭VI–♭VII–I', 'Deux accords empruntés au mineur, l’un après l’autre, qui montent vers la maison : la fanfare de fin de niveau.'),
  p('mixolydien', 'voisins', 'Le ♭VII du rock', 'I–♭VII–IV–I', 'Le ♭VII remplace la tension par une couleur : on rentre sans passer par V. Sweet Home Alabama, la fin de Hey Jude.'),
  p('creep', 'voisins', 'Le IV qui s’assombrit', 'I–V/vi–IV–iv', 'Une dominante secondaire (III, qui pointe vers vi mais n’y va pas), puis le IV qui devient mineur. Creep (Radiohead).'),
  p('beatles', 'voisins', 'Le II majeur', 'I–V/V–IV–I', 'Le ii devient majeur : il tire vers V, mais la chanson repart au IV. Eight Days a Week.'),
  p('ragtime', 'voisins', 'La chaîne du ragtime', 'V/vi–V/ii–V/V–V–I', 'Quatre dominantes en chaîne, chacune tombe d’une quinte sur la suivante jusqu’à la maison. Sweet Georgia Brown.'),

  p('pivot', 'modulation', 'Le pivot vers la dominante', 'I–IV–vi–V–I', 'La m est vi de Do et ii de Sol : on s’en sert comme d’une charnière. Après lui, Ré puis Sol : on est en Sol majeur.', 0.9, { 2: 7 }),
  p('porte-vv', 'modulation', 'Par la porte de V/V', 'I–vi–V/V–I–IV–V–I', 'Ré n’est pas dans Do : c’est la dominante de Sol. Si on le suit jusqu’au bout, Sol devient la maison, et Do n’est plus que son IV.', 0.9, { 2: 7 }),
  p('sous-dominante', 'modulation', 'Vers le côté bémol', 'I–V–♭VII–V–I', 'Le ♭VII de Do (Si♭) est le IV de Fa : on le prend comme porte, puis Do devient la tension de Fa.', 0.9, { 2: 5 }),
  p('camion', 'modulation', 'La modulation du camion', 'I–V–vi–IV–I–V–vi–IV', 'Pour le dernier refrain, tout monte d’un ton, sans transition : la même boucle, une marche plus haut.', 0.85, { 3: 2 }),
];

export const DEFAULT_PROGRESSION = 'pop';

export const progressionById = (id: string | null): Progression | undefined => LIBRARY.find((x) => x.id === id);

export interface PlayStep {
  chord: Chord;
  /** La tonalité dans laquelle on lit ce pas. */
  key: number;
  label: string;
}

/** Les pas d'une progression jouée depuis une tonalité : accord réel et tonalité du moment. */
export function stepsOf(prog: Progression, start: number): PlayStep[] {
  let key = mod12(start);
  return prog.labels.map((label, i) => {
    const step = { chord: chordAt(key, parseRoleLabel(label)!), key, label };
    const m = prog.modulations?.[i];
    if (m) key = mod12(key + m);
    return step;
  });
}

/** Les degrés d'une progression qui ne module pas, dans sa tonalité. */
export const degreesOf = (prog: Progression): Degree[] => prog.labels.map((l) => parseRoleLabel(l)!);

/**
 * Suite sans répétitions immédiates, comme dans les comptes des chansons ; `null` si elle module, ou hors des
 * longueurs comptées (2 à 8).
 */
export function countableDegrees(prog: Progression): Degree[] | null {
  if (prog.modulations) return null;
  const out: Degree[] = [];
  for (const d of degreesOf(prog)) {
    const last = out[out.length - 1];
    if (!last || last.step !== d.step || last.cls !== d.cls) out.push(d);
  }
  if (out.length < 2 || out.length > 8 || prog.labels.length !== out.length) return null;
  return out;
}
