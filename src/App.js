import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ThreeDots } from 'react-loader-spinner';
import FingerprintJS from 'fingerprintjs2';
import Cookies from 'js-cookie';
import Flashcard from './Flashcard';
import useQuestions from './useQuestions';
import FileDropzone from './FileDropzone';
import './App.css';

const App = () => {
  const [username, setUsername] = useState('');
  const [questions, loadQuestions, setQuestions] = useQuestions(username);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [cardStyle, setCardStyle] = useState({});
  const [flipped, setFlipped] = useState(false);
  const [feedbackIcon, setFeedbackIcon] = useState('');

  useEffect(() => {
    FingerprintJS.get((components) => {
      const values = components.map((component) => component.value);
      const uniqueHash = FingerprintJS.x64hash128(values.join(''), 31);
      setUsername(uniqueHash);
    });
  }, []);

  const handleFileAccepted = (file) => {
    setLoading(true);
    loadQuestions(file);
    setTimeout(() => {
      setLoading(false);
      setCurrentQuestionIndex(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setShowResults(false);
    }, 3000);
  };

  useEffect(() => {
    Cookies.set(`currentQuestionIndex_${username}`, JSON.stringify(currentQuestionIndex));
  }, [currentQuestionIndex, username]);  

  const handleSwipe = (direction) => {
    const isCorrect = direction === 'Right';
    const feedback = isCorrect ? '❤️' : '❌';
    const newBg = isCorrect ? 'lightgreen' : 'lightcoral';
    setFeedbackIcon(feedback);
    setCardStyle({
      transform: `translateX(${isCorrect ? 150 : -150}px) rotate(${isCorrect ? 10 : -10}deg)`,
      transition: 'transform 0.5s ease-out',
      backgroundColor: newBg
    });


    setTimeout(() => {
      setCardStyle({});
      setFeedbackIcon('');
      if (isCorrect) {
        setCorrectCount(c => c + 1);
      } else {
        setIncorrectCount(c => c + 1);
      }
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(i => i + 1);
      } else {
        setShowResults(true);
      }
    }, 500);

    if (currentQuestionIndex + 1 >= questions.length) {
      setShowResults(true);
    }
  };

  
  const handleRetry = () => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    // Filter out questions that were answered correctly
    const remainingQuestions = questions.filter(
      (question) => localStorage.getItem(`question_${question.id}`) !== 'correct'
    );
    setQuestions(remainingQuestions);
  };

  const handleFinish = () => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setQuestions([]);
    localStorage.clear();
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('Left'),
    onSwipedRight: () => handleSwipe('Right'),
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        handleSwipe('Right'); // Swipe right
      } else if (event.key === 'ArrowLeft') {
        handleSwipe('Left'); // Swipe left
      } else if (event.key === ' ') {
        setFlipped((prev) => !prev); // Flip the card
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown); 
  }, [currentQuestionIndex, questions.length]);

  return (
    <div className="app" style={{ backgroundColor: cardStyle.backgroundColor || 'white' }}>
      {loading ? (
        <ThreeDots color="#00BFFF" height={80} width={80} />
      ) : showResults ? (
        <div className="results">
          <h1>Results</h1>
          <p>Correct Answers: {correctCount}</p>
          <p>Incorrect Answers: {incorrectCount}</p>
          <p>{correctCount / (correctCount + incorrectCount) >= 0.8 ? 'Passed' : 'Failed'}</p>
          <button onClick={() => handleRetry(true)}>Retry Correct</button>
          <button onClick={() => handleRetry(false)}>Finish Session</button>
        </div>
      ) : questions.length > 0 ? (
        <div {...swipeHandlers} style={cardStyle}>
          <Flashcard
            question={questions[currentQuestionIndex].question}
            options={questions[currentQuestionIndex].options}
            answer={questions[currentQuestionIndex].answer_official}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />
          {feedbackIcon && <div className="feedback-icon">{feedbackIcon}</div>}
        </div>
      ) : (
        <FileDropzone onFileAccepted={handleFileAccepted} />
      )}
    </div>
  );
};


export default App;