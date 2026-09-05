import test from 'node:test';
import assert from 'node:assert/strict';
import { importDeck, serializeDeck, deckFilename, restoreDecks, shareDeck } from '../src/utils/deckSharing.js';
const raw = [{ question: '¿Qué opciones?', options: { A: 'Sí', B: 'También' }, answer_official: 'AB', answer_community: 'A', explanation: 'Explicación ñ' }];
const deck = { ...importDeck(raw, 'Mi mazo'), id: 'custom-1', description: 'Descripción', isCustom: true };

test('shared JSON round trips metadata, options, answers and Unicode without user data', () => {
  const restored = importDeck(JSON.parse(serializeDeck({ ...deck, email: 'private@example.com' })));
  assert.deepEqual(restored.questions, deck.questions);
  assert.equal(restored.title, deck.title);
  assert.equal(restored.description, deck.description);
  assert.ok(!serializeDeck({ ...deck, email: 'private@example.com' }).includes('private@example.com'));
  assert.equal(importDeck({ 1: raw[0] }).questions.length, 1);
  assert.throws(() => importDeck({ format: 'study-flashcards', version: 2, questions: raw }));
  assert.throws(() => importDeck([]));
});

test('restores saved decks while skipping broken entries', () => {
  const storage = { getItem: () => JSON.stringify([deck, { id: 'custom-broken', questions: null }]) };
  assert.equal(restoreDecks(storage).length, 1);
  assert.equal(restoreDecks({ getItem: () => '{' }).length, 0);
  assert.equal(deckFilename('🎯 ../Mi examen: GCP?'), 'Mi-examen-GCP.json');
});

test('shares a reimportable file and treats cancellation as cancellation', async () => {
  let shared;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    canShare: () => true,
    share: async (data) => { shared = data; },
  } });
  assert.equal(await shareDeck(deck), 'shared');
  assert.equal(importDeck(JSON.parse(await shared.files[0].text())).title, deck.title);
  navigator.share = async () => { throw Object.assign(new Error(), { name: 'AbortError' }); };
  assert.equal(await shareDeck(deck), 'cancelled');
});

test('downloads JSON when file sharing is unsupported or denied', async () => {
  const links = [];
  globalThis.document = {
    createElement: () => ({ click() { this.clicked = true; }, remove() {} }),
    body: { appendChild(link) { links.push(link); } },
  };
  navigator.canShare = () => false;
  assert.equal(await shareDeck(deck), 'downloaded');
  navigator.canShare = () => true;
  navigator.share = async () => { throw new Error('Denied'); };
  assert.equal(await shareDeck(deck), 'downloaded');
  assert.equal(links.length, 2);
  assert.ok(links.every(link => link.clicked && link.download === 'Mi-mazo.json'));
});
