import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import './viz.css';

/** Données statiques de cette visualisation (produites par `npm run data -- __SLUG__`). */
export const DATA_URL = assetUrl('data/__SLUG__');

mountShell({ currentSlug: '__SLUG__' });

const stage = document.getElementById('stage')!;
stage.textContent = 'La visualisation « __TITLE__ » s’affichera ici.';
