import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ThreeDots } from 'react-loader-spinner';
import FingerprintJS from 'fingerprintjs2';
import Cookies from 'js-cookie';
import Flashcard from './Flashcard';
import { useQuestions, shuffleArray } from './useQuestions';
import FileDropzone from './FileDropzone';
import './App.css';

const App = () => {
  const [username, setUsername] = useState('');
  const maxQuestions = 10;  // Defina el máximo de preguntas aquí para controlar el alcance
  const [questions, loadQuestions, setQuestions] = useQuestions(username, maxQuestions);
  const [currentFile, setCurrentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [cardStyle, setCardStyle] = useState({});
  const [swipeCount, setSwipeCount] = useState(0);
  const [retryMode, setRetryMode] = useState(false);
  
  const updateAnswerStatus = (questionId, isCorrect) => {
    localStorage.setItem(`question_correct_${questionId}`, isCorrect ? "true" : "false");
    if (!isCorrect) {
      const attempts = parseInt(localStorage.getItem(`incorrect_attempts_${questionId}`) || '0', 10) + 1;
      localStorage.setItem(`incorrect_attempts_${questionId}`, attempts.toString());
    }
  };  

  // Function that will log the questions and a message to the console when retrying, for debugging purposes
  const logQuestions = (questions, message) => {
    console.log(message);
    questions.forEach(question => console.log(question.question));
  };

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
    setCurrentFile(file); 
    setLoading(true);
    loadQuestions(file);
    setTimeout(() => {
      setLoading(false);
      setSwipeCount(0); 
      setCurrentQuestionIndex(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setShowResults(false);
      setRetryMode(false);
    }, 3000);
  };

  const handleSwipe = (direction) => {
    const question = questions[currentQuestionIndex];
    const isCorrect = direction === 'Right';
    updateAnswerStatus(question.id, isCorrect);
    setSwipeCount(prev => prev + 1); 

    setCardStyle({
      transform: `translateX(${direction === 'Right' ? 1000 : -1000}px)`,
      transition: 'transform 0.7s ease-out',
      backgroundColor: direction === 'Right' ? 'lightgreen' : 'lightcoral'
    });

    setTimeout(() => {
      setCardStyle({});
      setCurrentQuestionIndex(prev => (prev + 1) % questions.length);
      if (isCorrect) {
        setCorrectCount(prev => prev + 1);
      } else {
        setIncorrectCount(prev => prev + 1);
      }
    }, 300);

    if (swipeCount + 1 >= maxQuestions || currentQuestionIndex + 1 >= questions.length) {
      setShowResults(true);
      logQuestions(questions.filter(q => localStorage.getItem(`question_correct_${q.id}`) !== "true"), "Preguntas incorrectas al finalizar:");
    }
  };


  
/*  const handleRetry = (retryCorrect) => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSwipeCount(0);
    const remainingQuestions = questions.filter(
      question => retryCorrect || localStorage.getItem(`question_${question.id}`) !== 'correct'
    );
    setQuestions(remainingQuestions);
  }; */


  const handleRetry = (retryIncorrect) => {
    if (!retryIncorrect) {
        loadQuestions(currentFile); // Recargar todas las preguntas si se presiona "Retry All"
        console.log("Reintentando todas las preguntas...");
    } else {
        const incorrectQuestions = questions.filter(q => localStorage.getItem(`question_correct_${q.id}`) !== "true");
        if (incorrectQuestions.length === 0) {
            console.log("No hay respuestas incorrectas para reintento.");
            return;
        }
        setQuestions(shuffleArray(incorrectQuestions)); // Actualizar estado con las preguntas incorrectas
        setCurrentQuestionIndex(0);
        setRetryMode(true);
        setSwipeCount(0);
        setCorrectCount(0);
        setIncorrectCount(0);
        setShowResults(false);
        logQuestions(incorrectQuestions, "Reintentando preguntas incorrectas:");
    }
};


  

  const handleFinish = () => {
    console.log("Fin del juego, resultados:");
    console.log(`Correctas: ${correctCount}`);
    console.log(`Incorrectas: ${incorrectCount}`);
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
    <div className="app" style={{ backgroundColor: retryMode ? 'salmon' : 'white' }}> 
      {loading ? (
        <ThreeDots color="#00BFFF" height={80} width={80} />
      ) : showResults ? (
        <div className="results">
          <h1>Results</h1>
          <br></br>
          <p>Correct Answers: {correctCount}</p>
          <p>Incorrect Answers: {incorrectCount}</p>
          <br></br>
          <h1>{correctCount / (correctCount + incorrectCount) >= 0.8 ? 'Passed' : 'Failed'}</h1>
          <br></br>
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
              answer={questions[currentQuestionIndex].answer_community}
              questionNumber={currentQuestionIndex + 1}
              questionId={questions[currentQuestionIndex].id}
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