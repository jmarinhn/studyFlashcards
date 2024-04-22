import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ThreeDots } from 'react-loader-spinner';
import FingerprintJS from 'fingerprintjs2';
import Cookies from 'js-cookie';
import { useQuestions, shuffleArray } from './useQuestions';
import FileDropzone from './FileDropzone';
import Flashcard from './Flashcard';
import './App.css';

const App = () => {
  const [username, setUsername] = useState('');
  const [questions, loadQuestions, setQuestions, totalQuestions] = useQuestions(username);
  const maxQuestions = Math.min(60, totalQuestions);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [cardStyle, setCardStyle] = useState({});
  const [swipeCount, setSwipeCount] = useState(0);
  const [retryMode, setRetryMode] = useState(false);
  const [mode, setMode] = useState("none");
  const [previousMode, setPreviousMode] = useState("none");
  const [jsonStatus, setJsonStatus] = useState("Validating JSON...");
  const [flipped, setFlipped] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);

  const updateAnswerStatus = (questionId, isCorrect) => {
    localStorage.setItem(`question_correct_${questionId}`, isCorrect ? "true" : "false");
    if (!isCorrect) {
      const attempts = parseInt(localStorage.getItem(`incorrect_attempts_${questionId}`) || '0', 10) + 1;
      localStorage.setItem(`incorrect_attempts_${questionId}`, attempts.toString());
    }
  };  

  const handleFileAccepted = (file) => {
    setCurrentFile(file); 
    setLoading(true);
    setJsonStatus("Validating JSON...");
    loadQuestions(file, () => {
      setTimeout(() => {
        console.log("Callback triggered - JSON is now processed and validated.");
        setJsonStatus("JSON Validated!");   
        setLoading(false);
        setShowResults(false);
        setRetryMode(false);
        setSwipeCount(0); 
        setCurrentQuestionIndex(0);
        setCorrectCount(0);
        setIncorrectCount(0);
      }, 3000);
    });
  };

  const handleModeSelect = (selectedMode) => {
    if (mode !== selectedMode) {
      console.log(`Switching from ${mode || 'none'} to ${selectedMode} mode.`);
      setPreviousMode(mode);
      setMode(selectedMode);
      const newQuestions = selectedMode === 'study' ? shuffleArray([...questions]) : shuffleArray([...questions]).slice(0, maxQuestions);
      setQuestions(newQuestions);
      console.log(`Total questions in mode ${selectedMode}: ${newQuestions.length}`);
      setCurrentQuestionIndex(0);
      setSwipeCount(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setShowResults(false);
    }
  };

  const handleSwipe = (direction) => {
    // Asegurándose de que el swipe funcione en ambos modos
    const question = questions[currentQuestionIndex];
    const isCorrect = direction === 'Right'; // Suponiendo que "Right" siempre es correcto para simplificar
  
    // Solo registrar respuestas en modo test
    if (mode === "test") {
      updateAnswerStatus(question.id, isCorrect);
    }
  
    // Mover a la siguiente pregunta
    setSwipeCount(swipeCount + 1);
    setCardStyle({
      transform: `translateX(${direction === 'Right' ? 1000 : -1000}px)`,
      transition: 'transform 0.7s ease-out',
      backgroundColor: direction === 'Right' ? 'lightgreen' : 'lightcoral'
    });
  
    setTimeout(() => {
      setCardStyle({});
      setCurrentQuestionIndex((currentQuestionIndex + 1) % questions.length);
      if (isCorrect) {
        setCorrectCount(correctCount + 1);
      } else {
        setIncorrectCount(incorrectCount + 1);
      }
    }, 300);
  };
  
  

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('Left'),
    onSwipedRight: () => handleSwipe('Right'),
  });


  // Solo actualiza las preguntas cuando el modo cambia y es necesario
  useEffect(() => {
    if (mode) {
      const newQuestions = mode === 'study' ? [...questions] : shuffleArray([...questions]).slice(0, maxQuestions);
      setQuestions(newQuestions);
      setCurrentQuestionIndex(0);
      setSwipeCount(0);
      setCorrectCount(0);
      setIncorrectCount(0);
    }
  }, [mode]); // Solo escucha cambios en `mode`  

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

  const handleFinish = () => {
    const percent = (correctCount / (correctCount + incorrectCount) * 100).toFixed(2);
    console.log("Fin del juego, resultados:");
    console.log(`Porcentaje de respuestas correctas: ${percent}%`);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setQuestions([]);
    setMode('none'); // Establecer modo a 'none' para volver al menú principal
    setPreviousMode(mode); // Guardar el último modo para volver a él después de terminar
    localStorage.clear();
  };

 
  const handleRetry = (retryIncorrect) => {
    if (retryIncorrect) {
      const incorrectQuestions = questions.filter(question => localStorage.getItem(`question_correct_${question.id}`) === 'false');
      if (incorrectQuestions.length === 0) {
        console.log("No incorrect questions to retry.");
        return;
      }
      setQuestions(shuffleArray(incorrectQuestions));
    } else {
      // Re-embaraja todas las preguntas si no es un reintentar incorrectas
      setQuestions(shuffleArray([...questions])); 
    }
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setShowResults(false);
    setRetryMode(true);
  };

  return (
    <div className="app" style={{ backgroundColor: mode === "test" ? 'gray' : 'white' }}>
      {loading ? (
        <>
          <ThreeDots color="#00BFFF" height={80} width={80} />
          <p>{jsonStatus}</p>
        </>
      ) : jsonStatus === "JSON Validated!" && mode === "none" ? (
        <>
          <h1>flashcard<i>Match</i></h1>
          <p>Total questions detected: {totalQuestions}</p>
          <br></br>
          <button className="studyButton" onClick={() => handleModeSelect("study")} style={{ borderRadius: 'rounded' }}>Study</button>
          <br></br>          
          <button className="quizButton" onClick={() => handleModeSelect("test")} style={{ borderRadius: 'rounded' }}>Test</button>
        </>
      ) : (mode === "study" || mode === "test") && questions.length > 0 ? (
        <div className={`${mode}Mode`}>
          <div {...swipeHandlers} style={cardStyle}>
          <Flashcard
          key={currentQuestionIndex}
          question={questions[currentQuestionIndex].question}
          options={questions[currentQuestionIndex].options}
          answer={questions[currentQuestionIndex].answer_community}  // Asegúrate de que este campo existe en tus datos
          questionNumber={currentQuestionIndex + 1}
          questionId={questions[currentQuestionIndex].id}
          totalQuestions={mode === "study" ? questions.length : maxQuestions}
        />
            <button onClick={handleFinish}>Finish Session</button>
          </div>
        </div>
      ) : showResults ? (
          <div className="results" style={{ textAlign: 'center' }}>
          <h1>Results</h1>
          <h1 className={correctCount / (correctCount + incorrectCount) >= 0.8 ? 'passed' : 'failed'}>
            {(correctCount / (correctCount + incorrectCount) * 100).toFixed(2)}%
          </h1>
          <p>Correct Answers: {correctCount}</p>
          <p>Incorrect Answers: {incorrectCount}</p>
          <button onClick={() => handleRetry(false)}>Retry All</button>
          <button onClick={() => handleRetry(true)}>Retry Incorrect</button>
          <button onClick={handleFinish}>Finish Session</button>
        </div>
      ) : (
        <FileDropzone onFileAccepted={handleFileAccepted} />
      )}
    </div>
  );
};

export default App;