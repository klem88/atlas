/**
 * Partitions de « __TITLE__ », en notation ABC (voir src/shell/music/score.ts pour les conventions).
 * Avec L:1/8 : un « 8 » est une ronde, un « 4 » une blanche. C = do4 (do central), C, = do3, c = do5.
 */
import { pianoTune } from '@shell/music/score';

export const SCORES: Record<string, string> = {
  'etape-1': pianoTune({
    rh: '"^Do"[EGc]8 | "^Fa"[FAc]8 | "^Sol"[DGB]8 | "^Do"[EGc]8 |]',
    lh: '[C,C]8 | [F,,F,]8 | [G,,G,]8 | [C,C]8 |]',
  }),
};
