/*import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import './Flashcard.css';

// Function to shuffle options and preserve letter association
function shuffleOptions(options) {
  const entries = options.map(option => ({...option}));
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return entries;
}

const Flashcard = ({ question, options, answer, questionNumber }) => {
  const [flipped, setFlipped] = useState(false);
  const maxQuestions = 60;
  const incorrectAttempts = parseInt(localStorage.getItem(`incorrect_attempts_${question.id}`) || '0', 10);

  const handleKeyDown = (event) => {
    if (event.key === ' ') {
      event.preventDefault();
      setFlipped(prev => !prev);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getFullAnswers = () => {
    return answer.split('').map(letter =>
      options.find(option => option.letter === letter)?.text || 'Missing Answer. Check JSON file.'
    ).join(', ');
  };

  const shuffledOptions = useMemo(() => shuffleOptions(options), [options]);

  console.log(`Rendering Flashcard for question ${questionNumber + 1}`);

  return (
    <div className="flashcard" onClick={() => setFlipped(f => !f)} tabIndex={0} aria-label="Click or press space to flip the card">
      <div className={`card ${flipped ? 'flipped' : ''}`}>
        <div className="front">
          <h1 className="question">{question}</h1>
          {incorrectAttempts > 1 && (
            <div className="red-dot" aria-label="Question answered incorrectly more than once"></div>
          )}
          <ol type="A">
            {shuffledOptions.map((option, index) => (
              <li key={index}>{option.text}</li>
            ))}
          </ol>
        </div>
        <div className="back">
          <h1>Answer:</h1>
          <p>{getFullAnswers()}</p>
        </div>
      </div>
      <div className="question-counter">
        {questionNumber} / {maxQuestions}
      </div>
    </div>
  );
};

Flashcard.propTypes = {
  question: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    letter: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired
  })).isRequired,
  answer: PropTypes.string.isRequired,
  questionNumber: PropTypes.number.isRequired
};

export default Flashcard;
*/
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import './Flashcard.css';
import { useSwipeable } from 'react-swipeable';

function shuffleOptions(options) {
  let entries = Object.entries(options).map(([letter, text]) => ({ letter, text }));
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return entries;
}

const Flashcard = ({ question, options, answer_official, answer_community, onSwipe, mode, invertSwipe = false }) => {
  const [flipped, setFlipped] = useState(false);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Baraja las opciones solo cuando cambian las options
  const shuffledOptions = useMemo(() => shuffleOptions(options), [options]);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!hasAnswered) {
        // If invertSwipe is true: left = correct, otherwise: left = incorrect
        onSwipe(invertSwipe ? true : false);
        setHasAnswered(true);
      }
    },
    onSwipedRight: () => {
      if (!hasAnswered) {
        // If invertSwipe is true: right = incorrect, otherwise: right = correct
        onSwipe(invertSwipe ? false : true);
        setHasAnswered(true);
      }
    },
    trackMouse: true,
  });

  // Reset estado cuando cambia la pregunta
  useEffect(() => {
    setFlipped(false);
    setSelectedLetters([]);
    setHasAnswered(false);
  }, [question, options]);

  // Obtiene las letras de la respuesta correcta
  const getCorrectLetters = () => {
    const validAnswer = answer_community || answer_official || '';
    return validAnswer.split('').filter(letter => letter.trim() !== '');
  };

  // Verifica si la respuesta del usuario es correcta
  const checkAnswer = () => {
    const correctLetters = getCorrectLetters();
    if (selectedLetters.length !== correctLetters.length) return false;

    const sortedSelected = [...selectedLetters].sort();
    const sortedCorrect = [...correctLetters].sort();

    return sortedSelected.every((letter, index) => letter === sortedCorrect[index]);
  };

  // Maneja click en una opción
  const handleOptionClick = (e, letter) => {
    e.stopPropagation(); // Evita que el click voltee la tarjeta

    if (hasAnswered) return; // No permitir cambios después de responder

    const correctLetters = getCorrectLetters();
    const isMultipleChoice = correctLetters.length > 1;

    if (isMultipleChoice) {
      // Para preguntas de múltiple selección
      setSelectedLetters(prev => {
        if (prev.includes(letter)) {
          return prev.filter(l => l !== letter);
        } else {
          return [...prev, letter];
        }
      });
    } else {
      // Para preguntas de una sola respuesta
      setSelectedLetters([letter]);
    }
  };

  // Maneja el submit de la respuesta
  const handleSubmit = (e) => {
    e.stopPropagation();
    if (selectedLetters.length === 0) return;

    setHasAnswered(true);
    setFlipped(true);
  };

  // Maneja pasar a la siguiente pregunta
  const handleNext = (e) => {
    e.stopPropagation();
    const isCorrect = checkAnswer();
    onSwipe(isCorrect, selectedLetters, getCorrectLetters());
  };

  // Genera el HTML de las respuestas correctas
  const getFullAnswers = () => {
    const correctLetters = getCorrectLetters();
    return correctLetters.map(letter =>
      options[letter] ? `<li><strong>${letter}:</strong> ${options[letter]}</li>` : '<li>Missing Answer. Check JSON file.</li>'
    ).join('');
  };

  // Swipe handlers para modo estudio (sin calificación)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (mode === 'study') {
        setSwipeDirection('left');
        setTimeout(() => {
          onSwipe(false);
        }, 200);
      }
    },
    onSwipedRight: () => {
      if (mode === 'study') {
        setSwipeDirection('right');
        setTimeout(() => {
          onSwipe(true);
        }, 200);
      }
    },
    trackMouse: true
  });

  if (!question || !options) {
    return <div>Loading or no data available...</div>;
  }

  const correctLetters = getCorrectLetters();
  const isMultipleChoice = correctLetters.length > 1;

  return (
    <div {...swipeHandlers} className={`flashcard ${hasAnswered ? 'answered' : ''} ${swipeDirection ? 'swipe-' + swipeDirection : ''}`} tabIndex={0}>
      <div className={`card ${flipped ? 'flipped' : ''}`}>
        <div className="front" onClick={() => mode === 'study' && setFlipped(f => !f)}>
          <h3 className="question">{question}</h3>
          {isMultipleChoice && (
            <p className="multiple-choice-hint">(Selecciona todas las opciones correctas)</p>
          )}
          <ol type="A" className="options-list">
            {shuffledOptions.map((option, index) => {
              const isSelected = selectedLetters.includes(option.letter);
              const isCorrect = correctLetters.includes(option.letter);

              let optionClass = 'option';
              if (isSelected) optionClass += ' selected';
              if (hasAnswered) {
                if (isCorrect) optionClass += ' correct';
                else if (isSelected && !isCorrect) optionClass += ' incorrect';
              }

              return (
                <li
                  key={option.letter}
                  className={optionClass}
                  onClick={(e) => handleOptionClick(e, option.letter)}
                >
                  <span className="option-text">{option.text}</span>
                </li>
              );
            })}
          </ol>

          {mode === 'test' && (
            <button
              className="next-btn"
              onClick={handleNext}
              disabled={selectedLetters.length === 0}
            >
              Siguiente Pregunta →
            </button>
          )}

          {mode === 'study' && hasAnswered && (
            <div className="answer-feedback">
              <p className={checkAnswer() ? 'correct-feedback' : 'incorrect-feedback'}>
                {checkAnswer() ? '✓ ¡Correcto!' : '✗ Incorrecto'}
              </p>
              <button className="next-btn" onClick={handleNext}>
                Siguiente Pregunta →
              </button>
            </div>
          )}
        </div>

        {flipped && (
          <div className="back" onClick={() => setFlipped(false)}>
            <h3>Respuesta Correcta:</h3>
            <ul className="answer-list" dangerouslySetInnerHTML={{ __html: getFullAnswers() }} />
            {mode === 'study' && (
              <p className="swipe-hint">Desliza para continuar</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

Flashcard.propTypes = {
  question: PropTypes.string.isRequired,
  options: PropTypes.object.isRequired,
  answer_official: PropTypes.string,
  answer_community: PropTypes.string,
  onSwipe: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['study', 'test'])
};

export default Flashcard;