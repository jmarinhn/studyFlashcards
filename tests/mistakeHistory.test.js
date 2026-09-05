import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeMistakes, loadMistakes } from '../src/utils/mistakeHistory.js';
const q = (id, question) => ({ id, question, options: { A: 'Sí', B: 'No' }, answer_official: 'A' });
test('accumulates multiple sessions, deduplicates, and retains earlier failures after a correct round', () => {
  const first = mergeMistakes([], [q('1', 'Uno')]);
  const next = mergeMistakes(first, [q('1', 'Dos'), q('2', 'Uno')]);
  assert.equal(next.length, 2);
  assert.deepEqual(mergeMistakes(next, []), next);
  assert.equal(loadMistakes({ getItem: () => JSON.stringify({ deck: next }) }).deck.length, 2);
});
test('keeps decks separate and recovers from invalid persisted data', () => {
  const saved = loadMistakes({ getItem: () => JSON.stringify({ a: [q('1', 'A')], b: [q('1', 'B')], broken: null }) });
  assert.equal(saved.a.length, 1);
  assert.equal(saved.b[0].question, 'B');
  assert.deepEqual(loadMistakes({ getItem: () => '{' }), {});
});
