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
  const [allQuestions, setAllQuestions] = useState([]);  // Pool completo de preguntas
  const [questions, setQuestions] = useState([]);  // Preguntas para la sesión actual
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const TEST_QUESTION_COUNT = 65;  // Preguntas en el examen
  const PASSING_SCORE = 70;  // Porcentaje para aprobar
  const [scoreboard, setScoreboard] = useState(() => {
    const saved = localStorage.getItem('scoreboard');
    return saved ? JSON.parse(saved) : [];
  });
  const [timeLeft, setTimeLeft] = useState(3600);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [studyIncorrect, setStudyIncorrect] = useState([]);  // Preguntas incorrectas en estudio
  const [studyCorrect, setStudyCorrect] = useState(0);  // Correctas en estudio
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
          setAllQuestions(questionsArray);
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
      // Tracking en modo estudio
      if (isCorrect) {
        setStudyCorrect(prev => prev + 1);
      } else {
        // Guardar la pregunta incorrecta para repaso
        setStudyIncorrect(prev => [...prev, questions[currentQuestionIndex]]);
      }

      // Verificar si es la última pregunta
      if (currentQuestionIndex >= questions.length - 1) {
        setStage('studyResults');
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    } else if (stage === 'test') {
      // Actualizar contadores (sin feedback inmediato)
      const newCorrect = isCorrect ? correctAnswers + 1 : correctAnswers;
      const newIncorrect = isCorrect ? incorrectAnswers : incorrectAnswers + 1;

      if (isCorrect) {
        setCorrectAnswers(newCorrect);
      } else {
        setIncorrectAnswers(newIncorrect);
      }

      // Verificar si es la última pregunta
      if (currentQuestionIndex >= questions.length - 1) {
        console.log("Test completed.");
        setTimerActive(false);
        const finalScore = Math.round((newCorrect / questions.length) * 100);
        const passed = finalScore >= PASSING_SCORE;

        // Guardar en leaderboard
        onAddToLeaderboard({
          name: username,
          score: finalScore
        });

        setFeedbackMessage(passed ? `🎉 PASSED! Score: ${finalScore}%` : `❌ FAILED. Score: ${finalScore}%`);
        setStage('results');
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  // Iniciar modo test con 60 preguntas aleatorias
  const startTestMode = () => {
    const shuffled = shuffleArray([...allQuestions]);
    const testQuestions = shuffled.slice(0, TEST_QUESTION_COUNT);
    setQuestions(testQuestions);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setTimeLeft(3600);
    setFeedbackMessage('');
    setStage('test');
    setTimerActive(true);
    console.log(`Test started with ${testQuestions.length} questions`);
  };

  // Volver al modo estudio con cantidad seleccionada
  const startStudyMode = (count = null) => {
    let studyQuestions;
    if (count && count < allQuestions.length) {
      const shuffled = shuffleArray([...allQuestions]);
      studyQuestions = shuffled.slice(0, count);
    } else {
      studyQuestions = [...allQuestions];
    }
    setQuestions(studyQuestions);
    setCurrentQuestionIndex(0);
    setStudyCorrect(0);
    setStudyIncorrect([]);
    setTimerActive(false);
    setStage('study');
    console.log(`Study mode started with ${studyQuestions.length} questions`);
  };

  // Repasar solo las incorrectas
  const reviewIncorrect = () => {
    if (studyIncorrect.length > 0) {
      setQuestions([...studyIncorrect]);
      setCurrentQuestionIndex(0);
      setStudyCorrect(0);
      setStudyIncorrect([]);
      setStage('study');
      console.log(`Reviewing ${studyIncorrect.length} incorrect questions`);
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
        <div className="study-header">
          <button className="exitButton" onClick={() => setStage('menu')}>← Menu</button>
          <div className="study-progress">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </div>
          <div className="study-stats">
            <span className="correct-count">✓ {studyCorrect}</span>
            <span className="incorrect-count">✗ {studyIncorrect.length}</span>
          </div>
        </div>
        {questions.length > 0 ? (
          <Flashcard
            question={questions[currentQuestionIndex].question}
            options={questions[currentQuestionIndex].options}
            answer_official={questions[currentQuestionIndex].answer_official}
            answer_community={questions[currentQuestionIndex].answer_community}
            onSwipe={handleSwipe}
            mode="study"
          />
        ) : (
          <div>No questions available</div>
        )}
        <div className="swipe-instructions">
          <span className="swipe-left">← Swipe left: Incorrect</span>
          <span className="swipe-right">Swipe right: Correct →</span>
        </div>
      </>
    );
  };

  const renderTestMode = () => {
    return (
      <>
        <div className="test-header">
          <div>Tiempo restante: {Math.floor(timeLeft / 60)}:{('0' + timeLeft % 60).slice(-2)}</div>
          <div>Pregunta {currentQuestionIndex + 1} de {questions.length}</div>
          <div>✓ {correctAnswers} | ✗ {incorrectAnswers}</div>
        </div>
        {feedbackMessage && <div className="feedback">{feedbackMessage}</div>}
        {questions.length > 0 ? (
          <Flashcard
            question={questions[currentQuestionIndex].question}
            options={questions[currentQuestionIndex].options}
            answer_official={questions[currentQuestionIndex].answer_official}
            answer_community={questions[currentQuestionIndex].answer_community}
            onSwipe={handleSwipe}
            mode="test"
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
          <div className="enter-name-container">
            <h1>flashcardMatch</h1>
            <h2>👤 Enter Your Name</h2>
            <input
              className="name-input"
              type="text"
              placeholder="Your name..."
              onKeyDown={handleNameSubmit}
              autoFocus
            />
            <p className="hint">Press Enter to continue</p>
          </div>
        );
      case 'menu':
        console.log("User has entered the room. Showing main menu...");
        return (
          <>
            <h1>flashcardMatch</h1>
            <h2>Welcome, {username}!</h2>
            <p>Total questions available: {allQuestions.length}</p>

            <div className="mode-section">
              <h3>📚 Study Mode</h3>
              <div className="button-group">
                <button onClick={() => startStudyMode(25)}>25 questions</button>
                <button onClick={() => startStudyMode(50)}>50 questions</button>
                <button onClick={() => startStudyMode(100)}>100 questions</button>
                <button onClick={() => startStudyMode()}>All ({allQuestions.length})</button>
              </div>
            </div>

            <div className="mode-section">
              <h3>📝 Test Mode</h3>
              <button className='quizButton' onClick={startTestMode}>
                Start Exam ({TEST_QUESTION_COUNT} random questions, {PASSING_SCORE}% to pass)
              </button>
            </div>

            <button onClick={() => setStage('results')}>🏆 Leaderboard</button>
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
        } else if (timeLeft === 3600) {
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
        return <Leaderboard data={scoreboard} onBack={() => setStage('menu')} />
      case 'studyResults':
        const totalStudied = studyCorrect + studyIncorrect.length;
        const accuracy = totalStudied > 0 ? Math.round((studyCorrect / totalStudied) * 100) : 0;
        return (
          <div className="study-results">
            <h2>📊 Study Session Complete!</h2>
            <div className="results-stats">
              <p><strong>Questions studied:</strong> {totalStudied}</p>
              <p className="correct-count"><strong>Correct:</strong> {studyCorrect}</p>
              <p className="incorrect-count"><strong>Incorrect:</strong> {studyIncorrect.length}</p>
              <p><strong>Accuracy:</strong> {accuracy}%</p>
            </div>

            {studyIncorrect.length > 0 && (
              <div className="review-section">
                <p>You got {studyIncorrect.length} questions wrong.</p>
                <button className="review-btn" onClick={reviewIncorrect}>
                  🔄 Review Incorrect ({studyIncorrect.length})
                </button>
              </div>
            )}

            <div className="button-group">
              <button onClick={() => startStudyMode(25)}>Study 25 more</button>
              <button onClick={() => startStudyMode(50)}>Study 50 more</button>
              <button onClick={() => setStage('menu')}>Back to Menu</button>
            </div>
          </div>
        );
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
