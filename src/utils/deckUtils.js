// Utilidades para el manejo y barajado de mazos de flashcards

export const shuffle = (array) => {
  if (!array || !Array.isArray(array)) return [];
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Parsea un objeto JSON a un arreglo de preguntas normalizadas
export const parseQuestionsJson = (jsonResult) => {
  if (!jsonResult || typeof jsonResult !== 'object') {
    throw new Error('El formato JSON no es válido.');
  }

  // Soporta tanto objeto con llaves {"1": {...}, "2": {...}} como arreglo [{...}, {...}]
  const items = Array.isArray(jsonResult)
    ? jsonResult
    : Object.keys(jsonResult).map((key) => ({ id: key, ...jsonResult[key] }));

  const questions = items.map((item, index) => {
    // Normalizar opciones a arreglo de pares { letter, text }
    let rawOptions = item.options || {};
    let optionsArray = [];

    if (Array.isArray(rawOptions)) {
      optionsArray = rawOptions.map((opt, i) => {
        if (typeof opt === 'string') {
          return { letter: String.fromCharCode(65 + i), text: opt };
        }
        return { letter: opt.letter || String.fromCharCode(65 + i), text: opt.text || opt.label || '' };
      });
    } else {
      optionsArray = Object.keys(rawOptions).map((letter) => ({
        letter: letter.toUpperCase(),
        text: rawOptions[letter],
      }));
    }

    const official = (item.answer_official || item.answer || '').toString().trim().toUpperCase();
    const community = (item.answer_community || '').toString().trim().toUpperCase();

    return {
      id: item.id || `q-${index + 1}`,
      question: item.question || item.text || 'Sin pregunta especificada',
      options: optionsArray,
      answer_official: official,
      answer_community: community || official,
      explanation: item.explanation || item.notes || '',
    };
  });

  return questions.filter((q) => q.question && q.options.length > 0);
};

// Obtiene las letras correctas en forma de arreglo ordenado
export const getCorrectLetters = (question) => {
  if (!question) return [];
  const ans = question.answer_community || question.answer_official || '';
  return ans
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .split('')
    .sort();
};

// Verifica si una respuesta del usuario coincide exactamente
export const isAnswerCorrect = (selectedLetters, question) => {
  const correct = getCorrectLetters(question);
  if (!selectedLetters || selectedLetters.length !== correct.length) return false;
  const sortedSelected = [...selectedLetters].map((l) => l.toUpperCase()).sort();
  return sortedSelected.every((letter, index) => letter === correct[index]);
};
