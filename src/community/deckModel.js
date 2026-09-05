export const newQuestion = () => ({ id: crypto.randomUUID(), question: '', options: [{ letter: 'A', text: '' }, { letter: 'B', text: '' }, { letter: 'C', text: '' }, { letter: 'D', text: '' }], answer_official: '', explanation: '' });
export const newGuide = () => ({ title: '', description: '', questions: [newQuestion()] });

export function validateGuide(guide) {
  if (!guide.title?.trim()) throw new Error('Escribe un título para tu guía.');
  if (guide.title.length > 160 || (guide.description || '').length > 2000) throw new Error('El título o la descripción son demasiado largos.');
  if (!guide.questions?.length || guide.questions.length > 200) throw new Error('Una guía debe tener entre 1 y 200 preguntas.');
  const questions = guide.questions.map((q, index) => {
    const options = q.options.filter((o) => o.text.trim()).map((o) => ({ letter: o.letter, text: o.text.trim() }));
    const answer = [...new Set(q.answer_official.toUpperCase().replace(/[^A-Z]/g, ''))].sort().join('');
    if (!q.question.trim() || options.length < 2 || !answer || [...answer].some((letter) => !options.some(o => o.letter === letter))) {
      throw new Error(`Pregunta ${index + 1}: escribe el enunciado, al menos dos opciones y selecciona la respuesta correcta.`);
    }
    if (q.question.length > 5000 || options.some(o => o.text.length > 2000) || (q.explanation || '').length > 10000) throw new Error(`Pregunta ${index + 1}: el texto supera el límite permitido.`);
    return { id: q.id, question: q.question.trim(), options, answer_official: answer, explanation: q.explanation || '' };
  });
  return { title: guide.title.trim(), description: (guide.description || '').trim(), questions };
}

export function guideToStudyDeck(guide) {
  return { id: `community-${guide.id}`, communityId: guide.id, title: guide.title, description: guide.description,
    questions: guide.questions.map(q => ({ ...q, answer_community: q.answer_community || q.answer_official })) };
}
