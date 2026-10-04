import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import './viz.css';

/** Données statiques de cette visualisation (produites par `npm run data -- les-ficelles`). */
export const DATA_URL = assetUrl('data/les-ficelles');

mountShell({ currentSlug: 'les-ficelles' });

const stage = document.getElementById('stage')!;
stage.textContent = 'La visualisation « Les ficelles » s’affichera ici.';
