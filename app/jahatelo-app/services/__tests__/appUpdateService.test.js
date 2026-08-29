/* global describe, expect, it */
import { compareVersions } from '../../utils/version';

describe('compareVersions', () => {
  it.each([
    ['1.0.0', '1.0.0', 0],
    ['1.0.1', '1.0.0', 1],
    ['1.2.0', '1.10.0', -8],
    ['2.0', '1.9.9', 1],
  ])('compara %s con %s', (current, target, expected) => {
    expect(compareVersions(current, target)).toBe(expected);
  });
});
