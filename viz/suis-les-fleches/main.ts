import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import './viz.css';

/** Données statiques de cette visualisation (produites par `npm run data -- suis-les-fleches`). */
export const DATA_URL = assetUrl('data/suis-les-fleches');

mountShell({ currentSlug: 'suis-les-fleches' });

const stage = document.getElementById('stage')!;
stage.textContent = 'La visualisation « Suis les flèches » s’affichera ici.';
