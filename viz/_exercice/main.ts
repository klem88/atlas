import { mountExercise } from '@shell/music/exercise';
import { mountShell } from '@shell/shell';
import { SCORES } from './domain/partition';
import './viz.css';

mountShell({ currentSlug: '__SLUG__' });
mountExercise({ slug: '__SLUG__', scores: SCORES });
