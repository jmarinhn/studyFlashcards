import React, { useState, useEffect } from 'react';
import { DEMO_DECKS } from './data/demoDecks';
import { shuffle, parseQuestionsJson, normalizeQuestion } from './utils/deckUtils';
import TinderCardDeck from './components/TinderCardDeck';
import StudyResults from './components/StudyResults';
import TestMode from './components/TestMode';
import TestResults from './components/TestResults';
import Leaderboard from './components/Leaderboard';
import FileDropzone from './components/FileDropzone';
import GoogleAuthModal from './components/GoogleAuthModal';
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

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Usuario y Cuenta de Google
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('study_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleGoogleSignIn = (googleUser) => {
    setUser(googleUser);
    setUsername(googleUser.name);
    localStorage.setItem('study_user', JSON.stringify(googleUser));
    localStorage.setItem('study_username', googleUser.name);
  };

  const handleGoogleSignOut = () => {
    setUser(null);
    localStorage.removeItem('study_user');
  };

  const getUserStats = () => {
    const activeName = user?.name || username;
    const userExams = leaderboardData.filter((e) => e.name === activeName);
    const best = userExams.length > 0 ? Math.max(...userExams.map((e) => e.score)) : 0;
    return {
      examsCompleted: userExams.length,
      bestScore: best,
    };
  };

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
      name: user?.name || result.name || username,
      picture: user?.picture || null,
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
              <img src="/logo192.png" alt="FlashcardMatch Logo" className="brand-app-icon" />
              <h1 className="brand-title">Flashcard<span>Match</span></h1>
            </div>
            <p className="brand-tagline">
              Modo Estudio interactivo tipo Tinder con volteo 3D y repaso iterativo de errores
            </p>

            {/* Controles de Cabecera: Perfil y Tema */}
            <div className="header-controls-row">
              {user ? (
                <div
                  className="user-profile-chip google-logged-in"
                  onClick={() => setIsAuthModalOpen(true)}
                  title="Ver tu Perfil de Google"
                >
                  <div className="google-avatar-wrapper">
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="header-avatar-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff`;
                      }}
                    />
                    <span className="google-mini-badge">
                      <svg viewBox="0 0 24 24" width="10" height="10">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    </span>
                  </div>
                  <span className="user-name">{user.name}</span>
                </div>
              ) : (
                <>
                  <button
                    className="google-header-login-btn"
                    onClick={() => setIsAuthModalOpen(true)}
                    title="Crear cuenta o acceder con Google"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Crear cuenta con Google</span>
                  </button>

                  <div className="user-profile-chip guest-chip">
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
                        title="Clic para cambiar tu nombre de invitado"
                      >
                        <span className="user-avatar">👤</span>
                        <span className="user-name">{username}</span>
                        <span className="edit-hint">✏️</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {deferredPrompt && (
                <button
                  className="pwa-install-btn"
                  onClick={handleInstallApp}
                  title="Instalar FlashcardMatch en tu computadora o móvil"
                >
                  📲 Instalar App
                </button>
              )}

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

      {/* Modal de Crear Cuenta / Perfil con Google */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        userStats={getUserStats()}
      />
    </div>
  );
}
