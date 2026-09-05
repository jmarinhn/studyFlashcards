import { normalizeQuestion } from './deckUtils.js';

export const MISTAKES_KEY = 'study_mistake_history_v1';

// Use content as identity: imported decks may reuse question IDs.
export function mergeMistakes(previous = [], questions = []) {
  const unique = new Map();
  for (const item of [...previous, ...questions]) {
    try {
      const q = normalizeQuestion(item);
      if (!q || typeof q.question !== 'string' || !q.options.length) continue;
      const key = JSON.stringify([q.question, q.options, q.answer_official, q.answer_community]);
      unique.set(key, q);
    } catch { /* Ignore corrupted saved entries. */ }
  }
  return [...unique.values()];
}

export function loadMistakes(storage) {
  try {
    const raw = JSON.parse(storage.getItem(MISTAKES_KEY) || '{}');
    if (!raw || Array.isArray(raw) || typeof raw !== 'object') return {};
    return Object.fromEntries(Object.entries(raw).filter(([, value]) => Array.isArray(value))
      .map(([key, questions]) => [key, mergeMistakes([], questions)]));
  } catch { return {}; }
}
