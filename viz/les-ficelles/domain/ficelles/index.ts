/** Les six ficelles, dans l\'ordre de la page. */
import { descend } from './descend';
import { dominante } from './dominante';
import { emprunt } from './emprunt';
import { enrichis } from './enrichis';
import { montee } from './montee';
import { suspendu } from './suspendu';
import type { Ficelle, FicelleId } from './type';

export type { Application, Ficelle, FicelleId } from './type';

export const FICELLES: readonly Ficelle[] = [descend, emprunt, dominante, suspendu, enrichis, montee];
export const IDS: readonly FicelleId[] = FICELLES.map((f) => f.id);

export function ficelle(id: FicelleId): Ficelle {
  const f = FICELLES.find((x) => x.id === id);
  if (!f) throw new Error(`Ficelle inconnue : ${id}`);
  return f;
}
