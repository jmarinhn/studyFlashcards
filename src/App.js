import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ThreeDots } from 'react-loader-spinner';
import FingerprintJS from 'fingerprintjs2';
import Cookies from 'js-cookie';
import { useQuestions, shuffleArray } from './useQuestions';
import FileDropzone from './FileDropzone';
import Flashcard from './Flashcard';
import Leaderboard from './Leaderboard';
import './App.css';

/*
const App = () => {
  const [stage, setStage] = useState('welcome'); // 'welcome', 'upload', 'enterName', 'menu', 'study', 'test', 'results' 
  const [username, setUsername] = useState('');
  const [inputUsername, setInputUsername] = useState(''); // Para capturar el nombre de usuario
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

  useEffect(() => {
    if (stage === 'welcome') {
      setTimeout(() => {
        setStage('upload');
      }, 5000); // Wait for 5 seconds then switch to upload
    }
  }, [stage]);

  const handleFileAccepted = (file) => {
    setCurrentFile(file);
    setJsonStatus("Please enter your name to proceed...");
    setStage('enterName');
  };

  const handleNameSubmit = (event) => {
    if (event.key === 'Enter') {
      setUsername(event.target.value);
      setStage('menu');
    }
  };

  const renderWelcome = () => (
    <div className="fade-in-out">
      <h1>flashcardMatch</h1>
    </div>
  );
  
  const renderFileUpload = () => (
    <div>
      <FileDropzone onFileAccepted={handleFileAccepted} />
    </div>
  );

  const renderNameInput = () => (
    <input
      type="text"
      placeholder="Enter your name"
      onKeyPress={handleNameSubmit}
      autoFocus
    />
  );


  const updateAnswerStatus = (questionId, isCorrect) => {
    localStorage.setItem(`question_correct_${questionId}`, isCorrect ? "true" : "false");
    if (!isCorrect) {
      const attempts = parseInt(localStorage.getItem(`incorrect_attempts_${questionId}`) || '0', 10) + 1;
      localStorage.setItem(`incorrect_attempts_${questionId}`, attempts.toString());
    }
  };  

  const processQuestions = () => {
    if (!inputUsername.trim()) {
      alert("Please enter a valid name.");
      return;
    }
    setUsername(inputUsername);
    loadQuestions(currentFile, () => {
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
  

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('Left'),
    onSwipedRight: () => handleSwipe('Right'),
  });



  const renderMainMenu = () => (
    <div>
      <h1>Welcome, {username}!</h1>
      <p>Total questions detected: {questions.length}</p>
      <br></br>
      <button className='studyButton'>Study</button>
      <br></br>
      <button className='quizButton'>Test</button>
    </div>
  );

  const renderContent = () => {
    switch (stage) {
      case 'welcome':
        return renderWelcome();
      case 'upload':
        return renderFileUpload();
      case 'enterName':
        return renderNameInput();
      case 'menu':
          return (
            <>
              <h1>flashcardMatch</h1>
              <h2>Welcome, {username}!</h2>
              <p>Total questions detected: {questions.length}</p>
              <button onClick={() => setStage('study')}>Study</button>
              <button onClick={() => setStage('test')}>Test</button>
              <button onClick={() => setStage('leaderboard')}>Leaderboard</button>
            </>
          );
      case 'study':
        return <Flashcard data={questions[currentQuestionIndex]} />;
      case 'test':
        return <Flashcard data={questions[currentQuestionIndex]} onSwipe={handleSwipe} />;
      case 'results':
        return <Leaderboard data={scoreboard} />;
      default:
        return <div>Unknown stage</div>;
  
    }
  };




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
    const percent = (correctCount / (correctCount + incorrectCount) * 100).toFixed(2);
    console.log("Fin del juego, resultados:");
    console.log(`Porcentaje de respuestas correctas: ${percent}%`);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setQuestions([]);
    localStorage.clear();
  };

/*
  return (
    <div className="app" style={{ backgroundColor: mode === "test" ? 'gray' : 'white' }}>
      {loading ? (
        <>
          <ThreeDots color="#00BFFF" height={80} width={80} />
          <p>{jsonStatus}</p>
        </>
      ) : (
        <>
          {jsonStatus.startsWith("Please enter") && (
            <>
              <input
                type="text"
                placeholder="Enter your name"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                onKeyDown={handleUsernameInput}
              />
              <button onClick={processQuestions}>Submit</button>
            </>
          )}
          {renderBasedOnMode()}
        </>
      )}
    </div>
  );
    // Función auxiliar para renderizar basado en el estado y modo actual.
    function renderBasedOnMode() {
      if (mode === "none") return renderMainMenu();
      if (showResults) return renderResults();
      return renderQuestion();
    }
};


export default App;*/
/*
return (
  <div className="app">
    {loading ? <ThreeDots color="#00BFFF" height={80} width={80} /> : renderContent()}
  </div>
);
};

export default App;
*/
const App = () => {
  const [stage, setStage] = useState('welcome');
  const [username, setUsername] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scoreboard, setScoreboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3600); // tiempo en segundos para una hora
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [timerActive, setTimerActive] = useState(false);  
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  
  useEffect(() => {
    if (stage === 'welcome') {
      setTimeout(() => {
        setStage('upload');
      }, 5000);
    }
  }, [stage]);

  const handleFileAccepted = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonResult = JSON.parse(event.target.result);
        const questionsArray = Object.keys(jsonResult).map((key) => {
          const item = jsonResult[key];
          return {
            id: key,
            question: item.question,
            options: item.options,
            answer_official: item.answer_official,
            answer_community: item.answer_community
          };
        });
        if (questionsArray.length > 0) {
          setQuestions(questionsArray);
          setStage('enterName');
        } else {
          setFeedbackMessage("No questions found in JSON");
          setQuestions([]);
        }
      } catch (error) {
        setFeedbackMessage("Error parsing JSON: " + error.message);
        setQuestions([]);
      }
    };
    reader.onerror = () => {
      setFeedbackMessage("Failed to read file");
      setQuestions([]);
    };
    reader.readAsText(file);
  };
  

  

  const handleNameSubmit = (event) => {
    if (event.key === 'Enter') {
      setUsername(event.target.value);
      setStage('menu');
    }
  };
 

  const handleSwipe = (isCorrect) => {
    if (stage === 'study') {
      setCurrentQuestionIndex((currentQuestionIndex + 1) % questions.length);  // Esto permitirá un bucle continuo de preguntas
    } else if (stage === 'test') {
      // Agregar lógica para modo prueba si es necesario
      if (stage === 'test' && currentQuestionIndex >= 59) {
        console.log("Test completed.");
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setFeedbackMessage("Calculating results...");
          setTimeout(() => {
            onAddToLeaderboard({
              name: username,
              score: Math.round((correctAnswers / 60) * 100),
              jsonName: currentFile.name
            });
            setStage('results');
          }, 2000);  // Tiempo para calcular resultados
        }, 3000);  // Tiempo para mostrar carga
      } else {
        setCurrentQuestionIndex((currentQuestionIndex + 1) % questions.length);
        if (isCorrect) {
          setCorrectAnswers(correctAnswers + 1);
          setFeedbackMessage('Correct! Well done.');
        } else {
          setIncorrectAnswers(incorrectAnswers + 1);
          setFeedbackMessage('Oops! That’s not right.');
        }
      }
      
    } else if (stage === 'menu' && selectedMode === 'test') {
      let shuffledQuestions = shuffleArray([...questions]);
      setQuestions(shuffledQuestions.slice(0, 60));
      setCurrentQuestionIndex(0);
      setCorrectAnswers(0);
      setIncorrectAnswers(0);
      setTimeLeft(3600);
      setStage('test');
      setTimerActive(true);
    }
    
  };
  

  const averageTimePerQuestion = correctAnswers > 0 ? Math.floor((3600 - timeLeft) / correctAnswers) : 0;

// Función onAddToLeaderboard actualizada para usar localStorage
  const onAddToLeaderboard = (newEntry) => {
    const existingEntries = JSON.parse(localStorage.getItem('scoreboard') || '[]');
    const updatedScoreboard = [...existingEntries, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    localStorage.setItem('scoreboard', JSON.stringify(updatedScoreboard));
    setScoreboard(updatedScoreboard);
  };


  // Agregar un botón para salir de la sesión actual y volver al menú
  const renderExitButton = () => (
    <button className="exitButton" onClick={() => setStage('menu')}>
      Exit Session
    </button>
  );

// Modificar la renderización en los modos de estudio y prueba para incluir el botón de salida
const renderStudyMode = () => {
  return (
    <>
      {renderExitButton()}
      {questions.length > 0 ? (
        <Flashcard
          question={questions[currentQuestionIndex].question}
          options={questions[currentQuestionIndex].options}
          answer_official={questions[currentQuestionIndex].answer_official}
          answer_community={questions[currentQuestionIndex].answer_community}
          onSwipe={handleSwipe}
        />
      ) : (
        <div>No questions available</div>
      )}
    </>
  );
};

const renderTestMode = () => {
  return (
    <>
      {renderExitButton()}
      <div>Time left: {Math.floor(timeLeft / 60)}:{('0' + timeLeft % 60).slice(-2)}</div>
      <div>{feedbackMessage}</div>
      {questions.length > 0 ? (
        <Flashcard
          question={questions[currentQuestionIndex].question}
          options={questions[currentQuestionIndex].options}
          answer_official={questions[currentQuestionIndex].answer_official}
          answer_community={questions[currentQuestionIndex].answer_community}
          onSwipe={handleSwipe}
        />
      ) : (
        <div>No questions available</div>
      )}
    </>
  );
};  
  

  const renderContent = () => {
    switch (stage) {
      case 'welcome':
        return <h1 className="fade-in-out">flashcardMatch</h1>;
      case 'upload':
        return <FileDropzone onFileAccepted={handleFileAccepted} />;
      case 'enterName':
        console.log("File accepted, waiting for name...");
        return (
          <input
            type="text"
            placeholder="Enter your name"
            onKeyPress={handleNameSubmit}
            autoFocus
          />
        );
      case 'menu':
        console.log("User has entered the room. Showing main menu...");
        return (
          <>
            <h1>flashcardMatch</h1>
            <h2>Welcome, {username}!</h2>
            <p>Total questions detected: {questions && questions.length}</p>
            <button className='studyButton' onClick={() => { setStage('study'); setTimerActive(false); }}>Study</button>
            <button className='quizButton' onClick={() => { setStage('test'); setTimerActive(true); }}>Test</button>
            <button onClick={() => setStage('results')}>Leaderboard</button>
          </>
        );      
        case 'study':
          if (questions.length > 0) {
            if (currentQuestionIndex === 0) {
              console.log("Study mode activated. Hard is to study, young padawan...");
            }
            return renderStudyMode();
          } else {
            return <div>No questions available</div>;
          }
        case 'test':
          if (timeLeft === 0) {
            setStage('results');
            setTimerActive(false);
          }else if (timeLeft === 3600){
            console.log("Test mode activated. May the odds be ever in your favor!")
          }
          if (questions.length > 0) {
            if (timeLeft === 0) {
              setStage('results');
              setTimerActive(false);
            }
            return renderTestMode();
          } else {
            return <div>No questions available</div>;
          }
      case 'results':
        console.log("Results are in! Let's see how you did...");
        return <Leaderboard data={scoreboard} userTime={averageTimePerQuestion} onAddToLeaderboard={onAddToLeaderboard} />
      default:
        console.log('syntax error!')
        return <div>Unknown stage</div>;
    }
  };

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (!timerActive && timeLeft !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);
  

  return (
    <div className="app">
      {loading ? <div>Loading...</div> : renderContent()}
    </div>
  );
};

export default App;
