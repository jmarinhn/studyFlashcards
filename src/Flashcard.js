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
import React, { useState, useEffect } from 'react';
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

const Flashcard = ({ question, options, answer_official, answer_community, onSwipe }) => {
  const [flipped, setFlipped] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);

  useEffect(() => {
    setShuffledOptions(shuffleOptions(options));  // Baraja las opciones solo cuando cambian
  }, [options]);  // Dependencia en las opciones propias de la pregunta

  const getFullAnswers = () => {
    const validAnswer = answer_community || answer_official || '';
    return validAnswer.split('').map((letter, index) =>
      options[letter] ? `<li>${options[letter]}</li>` : '<li>Missing Answer. Check JSON file.</li>'
    ).join('');
  };
  
  
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      onSwipe(false);
      setFlipped(false);  // Reset flip state on swipe
    },
    onSwipedRight: () => {
      onSwipe(true);
      setFlipped(false);  // Reset flip state on swipe
    }
  });

  if (!question || !options) {
    return <div>Loading or no data available...</div>;
  }

  return (
    <div {...swipeHandlers} className={`flashcard`} onClick={() => setFlipped(f => !f)} tabIndex={0}>
      <div className={`card ${flipped ? 'flipped' : ''}`}>
        <div className="front">
          <h3 className="question">{question}</h3>
          <ol type="A">
            {shuffledOptions.map((option, index) => (
              <li key={index}>{option.text}</li>
            ))}
          </ol>
        </div>
        {flipped && (
          <div className="back">
            <h3>Answer:</h3>
            <ol type="A">
              <p dangerouslySetInnerHTML={{ __html: getFullAnswers() }} />
            </ol>
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
  onSwipe: PropTypes.func.isRequired
};

export default Flashcard;