/**
 * Partitions de « Six ficelles au piano », en notation ABC (voir src/shell/music/score.ts pour les conventions).
 * Avec L:1/8 : un « 8 » est une ronde, un « 4 » une blanche. C = do4 (do central), C, = do3, c = do5.
 * Une altération vaut pour le reste de la mesure (« [DF_B]4 [DEB]4 » : le second si est bémol).
 */
import { pianoTune } from '@shell/music/score';

/** La grille, pour l'affichage en jetons. Deux accords dans une mesure : deux temps chacun. */
export const GRILLE = [
  { label: 'A, deux fois', bars: ['Do7M', 'Sol/Si', 'La m7', 'Sol m7 · Do9', 'Fa7M', 'Fa m', 'Do/Sol · La7', 'Ré m7 · Fa/Sol'] },
  { label: 'Pont', bars: ['La7sus4 · La7'] },
  { label: 'A′ en Ré', bars: ['Ré7M', 'La/Do♯', 'Si m7', 'La m7 · Ré9', 'Sol7M', 'Sol m', 'Ré/La · Si7', 'Mi m7 · Sol/La', 'Ré7M'] },
] as const;

// Étape 1 : accords plaqués, en rondes.
const rh1 =
  '|: "^Do7M"[EGB]8 | "^Sol/Si"[DGB]8 | "^La m7"[EGc]8 | "^Sol m7"[DF_B]4 "^Do9"[DEB]4 | "^Fa7M"[CEA]8 | "^Fa m"[CF_A]8 | "^Do/Sol"[CEG]4 "^La7"[^CEG]4 | "^Ré m7"[CFA]4 "^Fa/Sol"[CFA]4 :| ' +
  '"^La7sus4"[EGd]4 "^La7"[EG^c]4 |[K:D] "^Ré7M"[FAc]8 | "^La/Do♯"[EAc]8 | "^Si m7"[FAd]8 | "^La m7"[EG=c]4 "^Ré9"[EFc]4 | "^Sol7M"[DFB]8 | "^Sol m"[DG_B]8 | "^Ré/La"[DFA]4 "^Si7"[^DFA]4 | "^Mi m7"[DGB]4 "^Sol/La"[DGB]4 | "^Ré7M"!fermata![CFA]8 |]';
const lh1 =
  '|: [C,C]8 | [B,,B,]8 | [A,,A,]8 | [G,,G,]4 [C,C]4 | [F,,F,]8 | [F,,F,]8 | [G,,G,]4 [A,,A,]4 | [D,,D,]4 [G,,G,]4 :| ' +
  '[A,,A,]8 |[K:D] [D,D]8 | [C,C]8 | [B,,B,]8 | [A,,A,]4 [D,D]4 | [G,,G,]8 | [G,,G,]8 | [A,,A,]4 [B,,B,]4 | [E,,E,]4 [A,,A,]4 | !fermata![D,,D,]8 |]';

// Étape 2 : ballade. Main droite en blanches, main gauche en croches arpégées.
const rh2 =
  '|: "^Do7M"[EGB]4 [EGB]4 | "^Sol/Si"[DGB]4 [DGB]4 | "^La m7"[EGc]4 [EGc]4 | "^Sol m7"[DF_B]4 "^Do9"[DEB]4 | "^Fa7M"[CEA]4 [CEA]4 | "^Fa m"[CF_A]4 [CFA]4 | "^Do/Sol"[CEG]4 "^La7"[^CEG]4 | "^Ré m7"[CFA]4 "^Fa/Sol"[CFA]4 :| ' +
  '"^La7sus4"[EGd]4 "^La7"[EG^c]4 |[K:D] "^Ré7M"[FAc]4 [FAc]4 | "^La/Do♯"[EAc]4 [EAc]4 | "^Si m7"[FAd]4 [FAd]4 | "^La m7"[EG=c]4 "^Ré9"[EFc]4 | "^Sol7M"[DFB]4 [DFB]4 | "^Sol m"[DG_B]4 [DGB]4 | "^Ré/La"[DFA]4 "^Si7"[^DFA]4 | "^Mi m7"[DGB]4 "^Sol/La"[DGB]4 | "^Ré7M"!fermata![CFA]8 |]';
const lhA =
  '|: C,G,CG, C,G,CG, | B,,D,G,D, B,,D,G,D, | A,,E,CE, A,,E,CE, | G,,D,_B,D, C,G,CG, | F,,C,A,C, F,,C,A,C, | F,,C,_A,C, F,,C,A,C, | G,,C,E,C, A,,E,A,E, | D,,A,,F,A,, G,,D,G,D, :|';
const lhPont = 'A,,E,DE, A,,E,^CE, |';
const lhA2 =
  '[K:D] D,A,DA, D,A,DA, | C,E,A,E, C,E,A,E, | B,,F,DF, B,,F,DF, | A,,E,=CE, D,A,DA, | G,,D,B,D, G,,D,B,D, | G,,D,_B,D, G,,D,B,D, | A,,D,F,D, B,,F,B,F, | E,,B,,G,B,, A,,E,A,E, | !fermata![D,,A,,]8 |]';

// Étape 3 : mélodie sur le A. Les degrés sous la portée nomment la note de couleur.
const rh3 =
  '|: "^Do7M""_7M"B4 c2 d2 | "^Sol/Si""_9"A4 B2 c2 | "^La m7""_7"G4 A2 B2 | "^Sol m7""_7"F2 G2 "^Do9""_7"_B4 | "^Fa7M"A2 c2 "_7M"e4 | "^Fa m"d2 c2 "_♭3"_A4 | "^Do/Sol"G2 c2 "^La7""_3"^c4 | "^Ré m7"f2 "_9"e2 "^Fa/Sol"d4 :|';

// Étape 4 : le pont, puis le A′ en Ré, mélodie transposée d'un ton.
const rh4 =
  '"^La7sus4"d4 "^La7""_3"^c4 |[K:D] "^Ré7M""_7M"c4 d2 e2 | "^La/Do♯""_9"B4 c2 d2 | "^Si m7""_7"A4 B2 c2 | "^La m7""_7"G2 A2 "^Ré9""_7"=c4 | "^Sol7M"B2 d2 "_7M"f4 | "^Sol m"e2 d2 "_♭3"_B4 | "^Ré/La"A2 d2 "^Si7""_3"^d4 | "^Mi m7"g2 "_9"f2 "^Sol/La"e4 | "^Ré7M"!fermata!f8 |]';

export const SCORES: Record<string, string> = {
  'etape-1': pianoTune({ rh: rh1, lh: lh1 }),
  'etape-2': pianoTune({ rh: rh2, lh: `${lhA} ${lhPont}${lhA2}` }),
  'etape-3': pianoTune({ rh: rh3, lh: lhA }),
  'etape-4': pianoTune({ rh: rh4, lh: `${lhPont}${lhA2}` }),
};
