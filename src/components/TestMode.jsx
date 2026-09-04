import React, { useState, useEffect } from 'react';
import { getCorrectLetters, isAnswerCorrect, normalizeOptions } from '../utils/deckUtils';
import './TestMode.css';

export default function TestMode({
  questions,
  username,
  onCompleteTest,
  onExit,
  initialTimeSeconds = 3600, // 60 minutos por defecto
  passingScore = 70
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [answersMap, setAnswersMap] = useState({}); // { [questionId]: ['A', 'B'] }
  const [timeLeft, setTimeLeft] = useState(initialTimeSeconds);

  const currentCard = questions[currentIndex];
  const correctLetters = getCorrectLetters(currentCard);
  const optionsList = normalizeOptions(currentCard?.options);
  const isMultipleChoice = correctLetters.length > 1;

  // Restaurar selección previa si regresa o resetear al cambiar
  useEffect(() => {
    if (currentCard) {
      setSelectedLetters(answersMap[currentCard.id] || []);
    }
  }, [currentIndex, currentCard, answersMap]);

  // Temporizador regresivo
  useEffect(() => {
    if (timeLeft <= 0) {
      finishExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const toggleOption = (letter) => {
    if (isMultipleChoice) {
      setSelectedLetters((prev) =>
        prev.includes(letter) ? prev.filter((l) => l !== letter) : [...prev, letter]
      );
    } else {
      setSelectedLetters([letter]);
    }
  };

  const handleNext = () => {
    const updatedMap = {
      ...answersMap,
      [currentCard.id]: selectedLetters,
    };
    setAnswersMap(updatedMap);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishExam(updatedMap);
    }
  };

  const finishExam = (finalAnswersMap = answersMap) => {
    let correctCount = 0;
    const reviewDetails = [];

    questions.forEach((q) => {
      const userLetters = finalAnswersMap[q.id] || [];
      const isCorrect = isAnswerCorrect(userLetters, q);
      if (isCorrect) correctCount++;
      reviewDetails.push({
        question: q,
        userAnswer: userLetters,
        correctLetters: getCorrectLetters(q),
        isCorrect,
      });
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);
    const passed = scorePct >= passingScore;

    onCompleteTest({
      name: username || 'Estudiante',
      score: scorePct,
      correctCount,
      totalCount: questions.length,
      passed,
      timeTakenSeconds: initialTimeSeconds - timeLeft,
      reviewDetails,
    });
  };

  // Formato MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentCard) {
    return <div className="test-empty">No hay preguntas para el examen.</div>;
  }

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="test-mode-container">
      {/* Header del examen */}
      <div className="test-top-bar">
        <button className="test-exit-btn" onClick={onExit}>
          ✕ Salir
        </button>

        <div className="test-meta">
          <span className="test-pill-mode">📝 Modo Examen</span>
          <span className="test-pill-progress">
            Pregunta {currentIndex + 1} de {questions.length}
          </span>
        </div>

        <div className={`test-timer ${timeLeft < 300 ? 'timer-urgent' : ''}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Tarjeta de Pregunta de Examen */}
      <div className="test-question-card">
        <div className="test-card-header">
          <span className="test-q-id">#{currentCard.id}</span>
          {isMultipleChoice ? (
            <span className="test-choice-hint badge-multiple">Selección Múltiple</span>
          ) : (
            <span className="test-choice-hint badge-single">Opción Única</span>
          )}
        </div>

        <h3 className="test-question-text">{currentCard.question}</h3>

        <div className="test-options-list">
          {optionsList.map((opt) => {
            const isSelected = selectedLetters.includes(opt.letter);
            return (
              <div
                key={opt.letter}
                className={`test-option-item ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleOption(opt.letter)}
              >
                <span className="test-opt-box">
                  {isSelected ? '✓' : opt.letter}
                </span>
                <span className="test-opt-text">{opt.text}</span>
              </div>
            );
          })}
        </div>

        {/* Barra de Navegación del Examen */}
        <div className="test-card-footer">
          {currentIndex > 0 && (
            <button
              className="test-nav-btn btn-prev"
              onClick={() => setCurrentIndex((prev) => prev - 1)}
            >
              ← Anterior
            </button>
          )}

          <button
            className={`test-nav-btn ${isLastQuestion ? 'btn-finish' : 'btn-next'}`}
            onClick={handleNext}
            disabled={selectedLetters.length === 0}
          >
            {isLastQuestion ? '🏁 Finalizar y Calificar' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}
