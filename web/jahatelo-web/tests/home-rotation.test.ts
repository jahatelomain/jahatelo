import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { planFeaturedSlides, planPopupSlides } from '../lib/homeRotation';

describe('planPopupSlides', () => {
  it('cycles the first ad across visits while preserving every active ad for swiping', () => {
    const ads = ['C', 'A', 'B'];
    assert.deepEqual([0, 1, 2, 3].map((turn) => planPopupSlides(ads, BigInt(turn)).map((slide) => slide.id)), [
      ['A', 'B', 'C'], ['B', 'C', 'A'], ['C', 'A', 'B'], ['A', 'B', 'C'],
    ]);
  });

  it('does not assign slides when the popup has no active ads', () => {
    assert.deepEqual(planPopupSlides([], BigInt(0)), []);
  });
});

describe('planFeaturedSlides', () => {
  it('gives every checked motel an equal chance to be first, independent of input ranking', () => {
    const motelIds = ['E', 'C', 'A', 'D', 'B'];
    const first = Array.from({ length: 6 }, (_, index) => planFeaturedSlides(motelIds, ['X'], BigInt(index))[0].id);
    assert.deepEqual(first, ['A', 'B', 'C', 'D', 'E', 'X']);
  });

  it('rotates creatives within the one ad slot after five motels without adding more ads', () => {
    const motels = ['A', 'B', 'C', 'D', 'E'];
    const seen = Array.from({ length: 18 }, (_, index) => planFeaturedSlides(motels, ['Z', 'X', 'Y'], BigInt(index)));
    assert.ok(seen.every((slides) => slides.length === 6 && slides.filter((slide) => slide.kind === 'ad').length === 1));
    assert.deepEqual(seen.map((slides) => slides[0].id), [
      'A', 'B', 'C', 'D', 'E', 'X', 'A', 'B', 'C', 'D', 'E', 'Y', 'A', 'B', 'C', 'D', 'E', 'Z',
    ]);
  });

  it('inserts a slot after the last incomplete group and handles no motels', () => {
    assert.deepEqual(planFeaturedSlides(['A', 'B', 'C', 'D', 'E', 'F'], ['X', 'Y'], BigInt(0)).map((slide) => slide.id),
      ['A', 'B', 'C', 'D', 'E', 'X', 'F', 'Y']);
    assert.deepEqual(planFeaturedSlides([], ['Y', 'X'], BigInt(0)).map((slide) => slide.id), ['X']);
    assert.deepEqual(planFeaturedSlides([], [], BigInt(0)), []);
  });

  it('excludes ad slots when no ads are active and does not repeat IDs', () => {
    assert.deepEqual(planFeaturedSlides(['B', 'A', 'A'], [], BigInt(1)).map((slide) => slide.id), ['B', 'A']);
  });
});
