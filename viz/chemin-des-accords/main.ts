import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import './viz.css';

/** Données statiques de cette visualisation (produites par `npm run data -- chemin-des-accords`). */
export const DATA_URL = assetUrl('data/chemin-des-accords');

mountShell({ currentSlug: 'chemin-des-accords' });

const stage = document.getElementById('stage')!;
stage.textContent = 'La visualisation « Le chemin des accords » s’affichera ici.';
