import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import './viz.css';

/** Données statiques de cette visualisation (produites par `npm run data -- forme-accord`). */
export const DATA_URL = assetUrl('data/forme-accord');

mountShell({ currentSlug: 'forme-accord' });

const stage = document.getElementById('stage')!;
stage.textContent = 'La visualisation « La forme d’un accord » s’affichera ici.';
