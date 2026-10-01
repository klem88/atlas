/** Les progressions courantes, toutes dans la gamme majeure, avec un nom et une phrase. */
import { parseDegreeLabel, type Degree } from '@shell/music/degrees';

export interface Progression {
  id: string;
  name: string;
  /** Étiquettes de degrés, répétitions comprises (le blues se joue mesure par mesure). */
  labels: readonly string[];
  blurb: string;
  /** Durée d'un accord, en secondes. */
  seconds: number;
}

const p = (id: string, name: string, chain: string, blurb: string, seconds = 0.9): Progression => ({ id, name, labels: chain.split('–'), blurb, seconds });

export const LIBRARY: readonly Progression[] = [
  p('pop', 'L’axe de la pop', 'I–V–vi–IV', 'On part de la maison, on monte en tension, on se pose à côté (vi), on reprend son élan (IV). Let It Be, With or Without You.'),
  p('melancolique', 'La même, côté sombre', 'vi–IV–I–V', 'Les mêmes quatre accords, mais on commence sur le repos mineur : la boucle sonne grave. Zombie (The Cranberries).'),
  p('doowop', 'Les années 50', 'I–vi–IV–V', 'Maison, repos mineur, départ, tension… et on recommence. Stand By Me.'),
  p('rocknroll', 'Les trois accords du rock', 'I–IV–V–I', 'Départ, tension, retour : la phrase complète en trois accords. La Bamba, Twist and Shout.'),
  p('ii-v-i', 'Le pas de deux du jazz', 'ii–V–I', 'Deux quintes descendantes d’affilée : la façon la plus sûre de rentrer à la maison. Autumn Leaves.'),
  p('plagale', 'La cadence « amen »', 'I–IV–I', 'Un aller-retour avec le départ, sans passer par la tension : la fin des cantiques.'),
  p('turnaround', 'Le tour du jazz', 'I–vi–ii–V', 'Trois quintes descendantes en boucle : le V renvoie au I et le tour recommence. I Got Rhythm.'),
  p('cercle', 'Le cercle des quintes', 'iii–vi–ii–V–I', 'Chaque accord tombe d’une quinte sur le suivant jusqu’à la maison. Sur la carte en cercle, on fait le tour.'),
  p('royal', 'La route royale', 'IV–V–iii–vi', 'Départ, tension… mais au lieu de rentrer, on glisse sur iii puis vi. Très aimée de la pop japonaise.'),
  p('pachelbel', 'Le canon de Pachelbel', 'I–V–vi–iii–IV–I–IV–V', 'Une basse qui descend pas à pas, reprise par des milliers de chansons depuis trois siècles.', 0.8),
  p('blues', 'Le blues de 12 mesures', 'I–I–I–I–IV–IV–I–I–V–IV–I–V', 'Quatre mesures à la maison, deux au départ, deux à la maison, puis tension, départ, maison et la relance.', 0.55),
];

export const DEFAULT_PROGRESSION = 'pop';

export const degreesOf = (prog: Progression): Degree[] => prog.labels.map((l) => parseDegreeLabel(l)!);

export const progressionById = (id: string | null): Progression | undefined => LIBRARY.find((x) => x.id === id);

/** Suite sans répétitions immédiates, comme dans les comptes des chansons ; `null` si hors des longueurs comptées (2 à 8). */
export function countableDegrees(prog: Progression): Degree[] | null {
  const out: Degree[] = [];
  for (const d of degreesOf(prog)) {
    const last = out[out.length - 1];
    if (!last || last.step !== d.step || last.cls !== d.cls) out.push(d);
  }
  if (out.length < 2 || out.length > 8 || prog.labels.length !== out.length) return null;
  return out;
}
