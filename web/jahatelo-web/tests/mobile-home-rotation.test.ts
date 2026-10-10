import { it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveHomeSlides } from '../../../app/jahatelo-app/utils/homeRotation';

it('mobile renders the server-assigned order and omits items that expired while loading', () => {
  const slides = [
    { kind: 'ad', id: 'x' }, { kind: 'motel', id: 'b' }, { kind: 'motel', id: 'gone' }, { kind: 'motel', id: 'a' },
  ];
  const result = resolveHomeSlides(slides, [{ id: 'a' }, { id: 'b' }], [{ id: 'x' }]);
  assert.deepEqual(result.map((item: { type: string; data: { id: string } }) => `${item.type}:${item.data.id}`), ['ad:x', 'promo:b', 'promo:a']);
  assert.deepEqual(resolveHomeSlides(null, [], []), []);
});
