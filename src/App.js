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

const App = () => {
  const [stage, setStage] = useState('welcome');
  const [username, setUsername] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scoreboard, setScoreboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3600); 
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
      <div>Time Left:</div>
      <div className='timer'>{Math.floor(timeLeft / 60)}:{('0' + timeLeft % 60).slice(-2)}</div>
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
      {renderExitButton()}
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
            onKeyDown={handleNameSubmit}
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
