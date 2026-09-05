import { parseQuestionsJson } from './deckUtils.js';

export function serializeDeck(deck) {
  return JSON.stringify({
    format: 'study-flashcards',
    version: 1,
    title: deck.title,
    description: deck.description || '',
    questions: deck.questions.map(({ id, question, options, answer_official, answer_community, explanation }) => ({
      id, question, options, answer_official, answer_community, explanation,
    })),
  }, null, 2);
}

export function importDeck(json, fallbackTitle = 'Mazo compartido') {
  const isExport = json?.format === 'study-flashcards';
  if (isExport && json.version !== 1) throw new Error('Esta versión del mazo no es compatible.');
  const questions = parseQuestionsJson(isExport ? json.questions : json);
  if (!questions.length) throw new Error('No se encontraron preguntas válidas con opciones.');
  return {
    title: isExport && typeof json.title === 'string' && json.title.trim() ? json.title.trim() : fallbackTitle,
    description: isExport && typeof json.description === 'string' ? json.description : '',
    questions,
  };
}

export function deckFilename(title) {
  const name = String(title).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
  return `${name || 'mazo'}.json`;
}

export function downloadDeck(deck) {
  const blob = new Blob([serializeDeck(deck)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = deckFilename(deck.title);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareDeck(deck) {
  const file = new File([serializeDeck(deck)], deckFilename(deck.title), { type: 'application/json' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: deck.title, text: 'Importa este mazo JSON en StudyFlashcards para estudiarlo.' });
      return 'shared';
    } catch (error) {
      if (error.name === 'AbortError') return 'cancelled';
      // Some browsers advertise file sharing but reject JSON files or deny permission.
    }
  }
  downloadDeck(deck);
  return 'downloaded';
}

export function restoreDecks(storage) {
  try {
    const stored = JSON.parse(storage.getItem('study_custom_decks') || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((deck) => {
      try {
        if (typeof deck.id !== 'string' || !deck.id.startsWith('custom-')) return [];
        const imported = importDeck({ ...deck, format: 'study-flashcards', version: 1 });
        return [{ ...imported, id: deck.id, isCustom: true }];
      } catch { return []; }
    });
  } catch { return []; }
}
