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
  const [cardStyle, setCardStyle] = useState({}); // Correctly declare the cardStyle state
  const [swipeCount, setSwipeCount] = useState(0);  // Track the number of swipes
  const [flipped, setFlipped] = useState(false);
  const maxQuestions = 60;

  useEffect(() => {
    Cookies.set(`currentQuestionIndex_${username}`, JSON.stringify(currentQuestionIndex));
  }, [currentQuestionIndex, username]);

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
      setSwipeCount(1); 
    }, 3000);
  };

  const handleSwipe = (direction) => {


    if (swipeCount >= maxQuestions || swipeCount >= questions.length) {
      console.log('Max swipe count reached, showing results...');
      setShowResults(true);
      return;  // Prevent further swipes if limit is reached
    }

    

    setSwipeCount(swipeCount + 1);  // Increment swipe count

    let newBg = direction === 'Right' ? 'lightgreen' : 'lightcoral';
    let xOffset = direction === 'Right' ? 1000 : -1000;

    setCardStyle({
      transform: `translateX(${xOffset}px)`,
      transition: 'transform 0.6s ease-out',
      backgroundColor: newBg
    });

    setTimeout(() => {
      setCardStyle({});
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1 >= questions.length ? 0 : prevIndex + 1);
      if (direction === 'Right') {
        setCorrectCount((prevCount) => prevCount + 1);
      } else {
        setIncorrectCount((prevCount) => prevCount + 1);
      }
    }, 300);

    if (swipeCount + 1 >= maxQuestions || currentQuestionIndex + 1 >= questions.length) {
      setShowResults(true);
    }

  };

  
  const handleRetry = (retryCorrect) => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSwipeCount(0);
    const remainingQuestions = questions.filter(
      question => retryCorrect || localStorage.getItem(`question_${question.id}`) !== 'correct'
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
          <p>
            {correctCount / (correctCount + incorrectCount) >= 0.8
              ? 'Passed'
              : 'Failed'}
          </p>
          <button onClick={() => handleRetry(false)}>Retry All</button>
          <button onClick={() => handleRetry(true)}>Retry Incorrect</button>
          <button onClick={handleFinish}>Finish Session</button>
        </div>
      ) : questions.length > 0 ? (
        <div>
          <div className="counters">
            <div className="incorrectCount">{incorrectCount}</div>
            <div className="correctCount">{correctCount}</div>
          </div>
          <div {...swipeHandlers} style={cardStyle}>
            <Flashcard
                  key={currentQuestionIndex}
                  question={questions[currentQuestionIndex].question}
                  options={questions[currentQuestionIndex].options}
                  answer={questions[currentQuestionIndex].answer_official}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={maxQuestions}
            />
          </div>
        </div>
      ) : (
        <FileDropzone onFileAccepted={handleFileAccepted} />
      )}
    </div>
  );
};


export default App;