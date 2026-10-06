import { mountExercise } from '@shell/music/exercise';
import { mountShell } from '@shell/shell';
import { SCORES } from './domain/partition';
import './viz.css';

mountShell({ currentSlug: 'jazz-ii-v' });
mountExercise({ slug: 'jazz-ii-v', scores: SCORES });
