/**
 * Textes de l'interface, rassemblés ici pour préparer une version anglaise sans toucher au code.
 * Les notes de la page (comment lire, méthode…) restent dans index.html.
 */
import { intervalName, noteName } from '../domain/pitch';
import type { PairBeats } from '../domain/beats';
import type { TuningId } from '../domain/tuning';

const oneDecimal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const twoDecimals = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export const fmtHz = (hz: number) => `${(hz >= 1000 ? integer : oneDecimal).format(hz)} Hz`;

/** « −2,0 cents », « +13,7 cents », « 0 cent ». */
export function fmtCents(c: number): string {
  if (Math.abs(c) < 0.05) return '0 cent';
  const v = oneDecimal.format(Math.abs(c));
  return `${c < 0 ? '−' : '+'}${v} cents`;
}

/** « 0,9 battement par seconde », « 10 battements par seconde », « aucun battement ». */
export function fmtBeats(hz: number): string {
  if (hz < 0.02) return 'aucun battement';
  if (hz < 0.5) return `un battement toutes les ${oneDecimal.format(1 / hz)} s`;
  if (hz < 2) return `${twoDecimals.format(hz)} battement par seconde`;
  if (hz < 10) return `${oneDecimal.format(hz)} battements par seconde`;
  return `${integer.format(hz)} battements par seconde`;
}

const ORDINAL = ['', '1ʳᵉ', '2ᵉ', '3ᵉ', '4ᵉ', '5ᵉ', '6ᵉ', '7ᵉ', '8ᵉ', '9ᵉ', '10ᵉ'];
export const fmtOrdinal = (n: number) => ORDINAL[n] ?? `${n}ᵉ`;

/** « do4 – sol4 », « do4, mi4, sol4 ». */
export const fmtNotes = (midis: readonly number[]) => midis.map(noteName).join(midis.length === 2 ? ' – ' : ', ');

export const fmtInterval = (st: number) => intervalName(st);

export const TUNING_SHORT: Record<TuningId, string> = { egal: 'ton piano', pur: 'pur', pythagore: 'Pythagore' };

/** Phrase de résultat pour une paire : « Do4 – sol4, une quinte. Sur ton piano, elle est plus étroite de 2,0 cents que la quinte pure. » */
export function pairSentence(p: PairBeats, tuning: TuningId): string {
  const name = fmtInterval(p.semitones);
  const where = tuning === 'egal' ? 'Sur ton piano' : tuning === 'pur' ? 'En intonation juste' : 'Chez Pythagore';
  if (Math.abs(p.cents) < 0.05) return `${where}, cette ${name} est pure : ses harmoniques coïncident exactement.`;
  const dir = p.cents > 0 ? 'plus large' : 'plus étroite';
  return `${where}, cette ${name} est ${dir} de ${oneDecimal.format(Math.abs(p.cents))} cents que la ${name} pure.`;
}

export const STRINGS = {
  listen: 'Écouter',
  stop: 'Arrêter',
  compare: 'Comparer avec le pur',
  comparing: 'Puis, pur…',
  share: 'Partager cet accord',
  clear: 'Effacer',
  pick: 'Joue une ou plusieurs notes sur le clavier.',
  onlyOne: 'Ajoute une deuxième note pour former un intervalle.',
  presets: 'Essaie aussi',
  pairs: 'Paire à regarder',
  soundHint: 'Le son ne part que quand tu le demandes. Baisse un peu le volume : les battements s’entendent mieux doucement.',
} as const;

export const PRESETS: { label: string; notes: number[]; tuning?: TuningId }[] = [
  { label: 'Quinte', notes: [60, 67] },
  { label: 'Tierce majeure', notes: [60, 64] },
  { label: 'Tierce mineure', notes: [60, 63] },
  { label: 'Accord parfait', notes: [60, 64, 67] },
  { label: 'Octave', notes: [60, 72] },
  { label: 'Tierce de Pythagore', notes: [60, 64], tuning: 'pythagore' },
];
