import { describe, expect, it } from 'vitest';
import { abcWarnings } from '@shell/music/score';
import { SCORES } from './partition';

describe('partitions de « __TITLE__ »', () => {
  it.each(Object.entries(SCORES))('%s se lit sans avertissement', (_id, abc) => {
    expect(abcWarnings(abc)).toEqual([]);
  });
});
