import React, { useState, useEffect } from 'react';
import { DEMO_DECKS } from './data/demoDecks';
import { shuffle, parseQuestionsJson, normalizeQuestion } from './utils/deckUtils';
import TinderCardDeck from './components/TinderCardDeck';
import StudyResults from './components/StudyResults';
import TestMode from './components/TestMode';
import TestResults from './components/TestResults';
import Leaderboard from './components/Leaderboard';
import FileDropzone from './components/FileDropzone';
import './App.css';

export default function App() {
  // Estado general
  const [stage, setStage] = useState('menu'); // 'menu' | 'study' | 'studyResults' | 'test' | 'testResults' | 'leaderboard' | 'upload'
  const [username, setUsername] = useState(() => localStorage.getItem('study_username') || 'Estudiante');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Tema Claro / Oscuro
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('study_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('study_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Mazos
  const [activeDeckKey, setActiveDeckKey] = useState('gcp_master');
  const [customDecks, setCustomDecks] = useState([]);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Modo Estudio
  const [studyStats, setStudyStats] = useState({ correct: 0, incorrect: 0 });
  const [studyIncorrectList, setStudyIncorrectList] = useState([]);
  const [isReviewRound, setIsReviewRound] = useState(false);
  const [reviewRoundNumber, setReviewRoundNumber] = useState(1);
  const [totalQuestionsInRound, setTotalQuestionsInRound] = useState(0);

  // Modo Test
  const [lastTestResult, setLastTestResult] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('study_leaderboard') || '[]');
      const migrated = raw.map((entry) => ({
        ...entry,
        deckTitle:
          !entry.deckTitle || entry.deckTitle === 'Examen General' || entry.deckTitle === 'Examen Cloud'
            ? '☁️ AWS Cloud & DevOps Essentials'
            : entry.deckTitle,
      }));
      // Persistir la corrección automáticamente en localStorage
      localStorage.setItem('study_leaderboard', JSON.stringify(migrated));
      return migrated;
    } catch {
      return [];
    }
  });

  // Guardar nombre
  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setUsername(trimmed);
      localStorage.setItem('study_username', trimmed);
    }
    setIsEditingName(false);
  };

  // Obtener lista completa de mazos (demos + personalizados)
  const getAllDecks = () => {
    const demos = Object.values(DEMO_DECKS);
    return [...demos, ...customDecks];
  };

  const getActiveDeck = () => {
    const all = getAllDecks();
    return all.find((d) => d.id === activeDeckKey) || all[0];
  };

  // Iniciar Modo Estudio
  const startStudySession = (count = null, specificQuestions = null, isReview = false) => {
    let pool = specificQuestions;
    if (!pool) {
      const deck = getActiveDeck();
      pool = deck ? [...deck.questions] : [];
    }

    // Normalizar cada pregunta por seguridad
    const normalizedPool = pool.map((q, idx) => normalizeQuestion(q, idx)).filter(Boolean);

    // Barajar preguntas
    let shuffled = shuffle(normalizedPool);
    if (count && count < shuffled.length) {
      shuffled = shuffled.slice(0, count);
    }

    setCurrentQuestions(shuffled);
    setCurrentIndex(0);
    setStudyStats({ correct: 0, incorrect: 0 });
    setStudyIncorrectList([]);
    setTotalQuestionsInRound(shuffled.length);
    setIsReviewRound(isReview);
    if (!isReview) {
      setReviewRoundNumber(1);
    }
    setStage('study');
  };

  // Manejador del Swipe en Modo Estudio
  const handleStudySwipe = (isCorrect) => {
    const currentQ = currentQuestions[currentIndex];

    if (isCorrect) {
      setStudyStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setStudyStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
      setStudyIncorrectList((prev) => [...prev, currentQ]);
    }

    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Fin del mazo
      setStage('studyResults');
    }
  };

  // Repasar únicamente las preguntas incorrectas
  const handleReviewIncorrect = () => {
    if (studyIncorrectList.length === 0) return;
    setReviewRoundNumber((prev) => prev + 1);
    startStudySession(null, studyIncorrectList, true);
  };

  // Iniciar Modo Test
  const startTestSession = () => {
    const deck = getActiveDeck();
    if (!deck || deck.questions.length === 0) return;

    // Normalizar y barajar preguntas para el examen (máximo 65)
    const normalizedPool = deck.questions.map((q, idx) => normalizeQuestion(q, idx)).filter(Boolean);
    const testPool = shuffle(normalizedPool).slice(0, 65);
    setCurrentQuestions(testPool);
    setStage('test');
  };

  // Completar Modo Test
  const handleCompleteTest = (result) => {
    const activeDeck = getActiveDeck();
    const resolvedTitle = result.deckTitle || activeDeck?.title || 'Examen General';

    const enrichedResult = {
      ...result,
      deckTitle: resolvedTitle,
    };
    setLastTestResult(enrichedResult);

    // Guardar en Leaderboard
    const newEntry = {
      name: result.name,
      deckTitle: resolvedTitle,
      score: result.score,
      date: new Date().toLocaleDateString(),
    };
    const updated = [...leaderboardData, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    setLeaderboardData(updated);
    localStorage.setItem('study_leaderboard', JSON.stringify(updated));
    setStage('testResults');
  };

  // Limpiar Leaderboard
  const handleClearLeaderboard = () => {
    if (window.confirm('¿Deseas reiniciar la tabla de posiciones?')) {
      setLeaderboardData([]);
      localStorage.removeItem('study_leaderboard');
    }
  };

  // Cargar mazo personalizado desde archivo JSON
  const handleCustomDeckLoaded = (newDeckData) => {
    const newDeck = {
      id: `custom-${Date.now()}`,
      title: `📁 ${newDeckData.title || 'Mazo Personalizado'}`,
      description: `${newDeckData.questions.length} preguntas importadas desde archivo JSON.`,
      questions: newDeckData.questions,
      isCustom: true,
    };
    setCustomDecks((prev) => [newDeck, ...prev]);
    setActiveDeckKey(newDeck.id);
    setStage('menu');
  };

  const activeDeck = getActiveDeck();

  return (
    <div className="app-main-layout">
      {/* VISTA: MENÚ PRINCIPAL */}
      {stage === 'menu' && (
        <div className="menu-container">
          <header className="menu-header">
            <div className="brand-logo">
              <span className="brand-icon">⚡</span>
              <span className="brand-title">flashcardMatch</span>
            </div>
            <p className="brand-tagline">
              Modo Estudio interactivo tipo Tinder con volteo 3D y repaso iterativo de errores
            </p>

            {/* Controles de Cabecera: Perfil y Tema */}
            <div className="header-controls-row">
              <div className="user-profile-chip">
                {isEditingName ? (
                  <div className="name-edit-box">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Tu nombre..."
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button onClick={handleSaveName}>Guardar</button>
                  </div>
                ) : (
                  <div
                    className="name-display"
                    onClick={() => {
                      setNameInput(username);
                      setIsEditingName(true);
                    }}
                    title="Clic para cambiar tu nombre"
                  >
                    <span className="user-avatar">👤</span>
                    <span className="user-name">{username}</span>
                    <span className="edit-hint">✏️</span>
                  </div>
                )}
              </div>

              <button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title="Cambiar entre Modo Claro y Modo Oscuro"
              >
                {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
              </button>
            </div>
          </header>

          {/* Selector de Mazos */}
          <section className="decks-section">
            <div className="section-title-row">
              <h3>📦 Selecciona tu Mazo de Estudio</h3>
              <button className="import-btn" onClick={() => setStage('upload')}>
                ➕ Cargar JSON
              </button>
            </div>

            <div className="decks-grid">
              {getAllDecks().map((deck) => {
                const isSelected = deck.id === activeDeckKey;
                return (
                  <div
                    key={deck.id}
                    className={`deck-card-option ${isSelected ? 'selected-deck' : ''}`}
                    onClick={() => setActiveDeckKey(deck.id)}
                  >
                    <div className="deck-card-top">
                      <h4>{deck.title}</h4>
                      <span className="q-count-badge">
                        {deck.questions.length} cards
                      </span>
                    </div>
                    <p className="deck-card-desc">{deck.description}</p>
                    {isSelected && <span className="active-indicator">✓ Activo</span>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Modos de Juego */}
          <section className="modes-section">
            <div className="mode-card study-mode-card">
              <div className="mode-card-header">
                <span className="mode-icon">📚</span>
                <div>
                  <h3>Modo Estudio (Tinder Cards)</h3>
                  <p>Arrastra a la derecha si acertaste, a la izquierda para repasar. Toca para ver la respuesta.</p>
                </div>
              </div>

              <div className="study-actions-row">
                <button
                  className="study-launch-btn primary-launch"
                  onClick={() => startStudySession()}
                  disabled={!activeDeck || activeDeck.questions.length === 0}
                >
                  🚀 Estudiar Todo ({activeDeck?.questions.length || 0})
                </button>
                {activeDeck && activeDeck.questions.length > 10 && (
                  <button
                    className="study-launch-btn"
                    onClick={() => startStudySession(10)}
                  >
                    10 Preguntas
                  </button>
                )}
                {activeDeck && activeDeck.questions.length > 25 && (
                  <button
                    className="study-launch-btn"
                    onClick={() => startStudySession(25)}
                  >
                    25 Preguntas
                  </button>
                )}
              </div>
            </div>

            <div className="mode-card test-mode-card">
              <div className="mode-card-header">
                <span className="mode-icon">📝</span>
                <div>
                  <h3>Modo Examen (Test Oficial)</h3>
                  <p>Evaluación formal contrarreloj sin revelar respuestas hasta finalizar. Registra tu puntaje en el Leaderboard.</p>
                </div>
              </div>

              <button
                className="test-launch-btn"
                onClick={startTestSession}
                disabled={!activeDeck || activeDeck.questions.length === 0}
              >
                ⏱ Iniciar Examen Oficial (60 min)
              </button>
            </div>
          </section>

          {/* Acceso a Leaderboard */}
          <footer className="menu-footer">
            <button className="leaderboard-nav-btn" onClick={() => setStage('leaderboard')}>
              🏆 Ver Tabla de Posiciones ({leaderboardData.length})
            </button>
          </footer>
        </div>
      )}

      {/* VISTA: MODO ESTUDIO (TINDER CARDS) */}
      {stage === 'study' && (
        <TinderCardDeck
          questions={currentQuestions}
          currentIndex={currentIndex}
          onSwipe={handleStudySwipe}
          onExit={() => setStage('menu')}
          stats={studyStats}
          isReviewRound={isReviewRound}
          roundNumber={reviewRoundNumber}
          deckTitle={getActiveDeck()?.title}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* VISTA: RESULTADOS DE ESTUDIO Y REPASO DE INCORRECTAS */}
      {stage === 'studyResults' && (
        <StudyResults
          stats={studyStats}
          incorrectCards={studyIncorrectList}
          totalStudied={totalQuestionsInRound}
          roundNumber={reviewRoundNumber}
          deckTitle={getActiveDeck()?.title}
          onReviewIncorrect={handleReviewIncorrect}
          onRestartAll={() => startStudySession()}
          onBackToMenu={() => setStage('menu')}
        />
      )}

      {/* VISTA: MODO TEST */}
      {stage === 'test' && (
        <TestMode
          questions={currentQuestions}
          username={username}
          deckTitle={getActiveDeck()?.title}
          onCompleteTest={handleCompleteTest}
          onExit={() => setStage('menu')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* VISTA: RESULTADOS DEL TEST */}
      {stage === 'testResults' && lastTestResult && (
        <TestResults
          result={lastTestResult}
          deckTitle={lastTestResult.deckTitle || getActiveDeck()?.title}
          onViewLeaderboard={() => setStage('leaderboard')}
          onBackToMenu={() => setStage('menu')}
          onRetryTest={startTestSession}
        />
      )}

      {/* VISTA: LEADERBOARD */}
      {stage === 'leaderboard' && (
        <Leaderboard
          data={leaderboardData}
          onBack={() => setStage('menu')}
          onClear={handleClearLeaderboard}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* VISTA: CARGAR ARCHIVO JSON */}
      {stage === 'upload' && (
        <FileDropzone
          onDeckLoaded={handleCustomDeckLoaded}
          onCancel={() => setStage('menu')}
        />
      )}
    </div>
  );
}
