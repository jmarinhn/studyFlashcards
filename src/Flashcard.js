import React, { useState, useEffect, useMemo } from 'react';
import './Flashcard.css';

// Función para mezclar opciones y preservar la asociación de letras
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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === ' ') {
        event.preventDefault();  // Prevent the default action to avoid scrolling
        setFlipped(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Clean up to avoid memory leaks
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getFullAnswers = () => {
    return answer.split('').map(letter =>
      options.find(option => option.letter === letter)?.text || ''
    ).join(', ');
  };

  const shuffledOptions = useMemo(() => shuffleOptions(options), [options]);
  console.log(shuffledOptions);

  return (
    <div className="flashcard" onClick={() => setFlipped(f => !f)}>
      <div className={`card ${flipped ? 'flipped' : ''}`}>
        <div className="front">
          <h1 className="question">{question}</h1>
          <ol TYPE="A">
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

export default Flashcard;
