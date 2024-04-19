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
  const [questions, loadQuestions, setQuestions, totalQuestions] = useQuestions(username);
  // Ajusta el máximo en función del total cargado
  const maxQuestions = Math.min(60, totalQuestions);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [cardStyle, setCardStyle] = useState({});
  const [swipeCount, setSwipeCount] = useState(0);
  const [retryMode, setRetryMode] = useState(false);
  const [mode, setMode] = useState("");
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

  const handleSwipe = (direction) => {
    if (mode === "test") {
      const question = questions[currentQuestionIndex];
      const isCorrect = direction === 'Right';
      updateAnswerStatus(question.id, isCorrect);
      setSwipeCount(swipeCount + 1);

      if (swipeCount + 1 >= totalQuestions || currentQuestionIndex + 1 >= questions.length) {
        setShowResults(true);
        setMode("");
      }

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
    }
  };
  
  const handleRetry = (retryIncorrect) => {
    // Retrieve only incorrect questions if retryIncorrect is true
    const filteredQuestions = retryIncorrect ? 
      questions.filter(question => !localStorage.getItem(`question_correct_${question.id}`)) : 
      questions;

    setQuestions(shuffleArray(filteredQuestions));
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setShowResults(false);
    setRetryMode(true);
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

  const handleModeSelect = (selectedMode) => {
    console.log(`Current mode: ${mode}, Total questions: ${totalQuestions}, Questions Loaded: ${questions.length}`);
    console.log(`Switching to ${selectedMode} mode.`);
    setMode(selectedMode);
    if (selectedMode === "study") {
      // In study mode, use all questions
      const shuffledQuestions = shuffleArray([...questions]);
      setQuestions(shuffledQuestions);
    } else {
      // In test mode, ensure only the correct number of questions is used
      const shuffledQuestions = shuffleArray([...questions]).slice(0, maxQuestions);
      setQuestions(shuffledQuestions);
    }
    setCurrentQuestionIndex(0); // Reset the index for both modes
    setSwipeCount(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setShowResults(false);
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


  return (
    <div className="app" style={{ backgroundColor: mode === "test" ? 'salmon' : 'white' }}>
      {loading ? (
        <>
          <ThreeDots color="#00BFFF" height={80} width={80} />
          <p>{jsonStatus}</p>
        </>
      ) : jsonStatus === "JSON Validated!" ? (
        <>
          <p>Total questions detected: {totalQuestions}</p>
          <button onClick={() => handleModeSelect("study")}>Study</button>
          <button onClick={() => handleModeSelect("test")}>Test</button>
        </>
      ) : showResults ? (
        <div className="results">
          <h1>Results</h1>
          <br></br>
          <p>Correct Answers: {correctCount}</p>
          <p>Incorrect Answers: {incorrectCount}</p>
          <br></br>
          <h2 className={correctCount / (correctCount + incorrectCount) >= 0.8 ? 'passed' : 'failed'}>
            {correctCount / (correctCount + incorrectCount) >= 0.8 ? 'Passed' : 'Failed'}
          </h2>
          <br></br>
          <button onClick={() => handleRetry(false)}>Retry All</button>
          <button onClick={() => handleRetry(true)}>Retry Incorrect</button>
          <button onClick={handleFinish}>Finish Session</button>
        </div>
      ) : questions.length > 0 && mode === "study" ? (
        <div>
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