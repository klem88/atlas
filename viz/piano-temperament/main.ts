import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import './viz.css';

/** Données statiques de cette visualisation (produites par `npm run data -- piano-temperament`). */
export const DATA_URL = assetUrl('data/piano-temperament');

mountShell({ currentSlug: 'piano-temperament' });

const stage = document.getElementById('stage')!;
stage.textContent = 'La visualisation « Pourquoi ton piano est (légèrement) faux » s’affichera ici.';
