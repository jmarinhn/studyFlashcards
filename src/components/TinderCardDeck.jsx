import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getCorrectLetters, normalizeOptions } from '../utils/deckUtils';
import MarkdownText from './MarkdownText';
import './TinderCardDeck.css';

export default function TinderCardDeck({
  questions,
  currentIndex,
  onSwipe,
  onExit,
  stats,
  isReviewRound = false,
  roundNumber = 1,
  deckTitle = '',
  theme = 'dark',
  onToggleTheme,
}) {
  const [flipped, setFlipped] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyOutDirection, setFlyOutDirection] = useState(null); // 'left' | 'right' | null

  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const currentCard = questions[currentIndex];
  const nextCard = questions[currentIndex + 1];

  // Resetear estados al cambiar de carta
  useEffect(() => {
    setFlipped(false);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setFlyOutDirection(null);
  }, [currentIndex, questions]);

  // Manejador del swipe completado
  const triggerSwipe = useCallback((direction) => {
    if (flyOutDirection) return; // Ya está animando
    setFlyOutDirection(direction);

    setTimeout(() => {
      onSwipe(direction === 'right');
    }, 280);
  }, [flyOutDirection, onSwipe]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si el usuario está en un input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        triggerSwipe('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        triggerSwipe('right');
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFlipped((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSwipe]);

  // Eventos de Touch / Mouse Drag
  const handlePointerDown = (e) => {
    if (flyOutDirection) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX === undefined) return;

    dragStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || flyOutDirection) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX === undefined) return;

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerUp = (e) => {
    if (!isDragging || flyOutDirection) return;
    setIsDragging(false);

    const deltaX = dragOffset.x;
    const deltaY = dragOffset.y;
    const dragDistance = Math.hypot(deltaX, deltaY);
    const elapsedTime = Date.now() - dragStartRef.current.time;

    // Si fue un tap rápido sin apenas arrastrar (<10px y <350ms), voltear carta
    if (dragDistance < 12 && elapsedTime < 350) {
      setFlipped((prev) => !prev);
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    // Umbral de swipe (110px o velocidad alta)
    const swipeThreshold = 110;
    const isQuickSwipe = Math.abs(deltaX) > 60 && elapsedTime < 250;

    if (deltaX > swipeThreshold || (isQuickSwipe && deltaX > 0)) {
      triggerSwipe('right');
    } else if (deltaX < -swipeThreshold || (isQuickSwipe && deltaX < 0)) {
      triggerSwipe('left');
    } else {
      // Regreso elástico
      setDragOffset({ x: 0, y: 0 });
    }
  };

  if (!currentCard) {
    return <div className="deck-empty">No hay preguntas disponibles</div>;
  }

  const correctLetters = getCorrectLetters(currentCard);
  const optionsList = normalizeOptions(currentCard?.options);

  // Cálculo de rotación y opacidades dinámicas
  const rotateDeg = dragOffset.x * 0.08;
  const swipeRatio = Math.min(Math.abs(dragOffset.x) / 120, 1);
  const showRightStamp = dragOffset.x > 20 || flyOutDirection === 'right';
  const showLeftStamp = dragOffset.x < -20 || flyOutDirection === 'left';
  const rightStampOpacity = flyOutDirection === 'right' ? 1 : dragOffset.x > 20 ? swipeRatio : 0;
  const leftStampOpacity = flyOutDirection === 'left' ? 1 : dragOffset.x < -20 ? swipeRatio : 0;

  // Estilo dinámico de la carta superior
  let topCardTransform = '';
  let topCardTransition = isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

  if (flyOutDirection === 'right') {
    topCardTransform = 'translate3d(1200px, 50px, 0) rotate(35deg)';
    topCardTransition = 'transform 0.3s ease-in, opacity 0.3s ease-in';
  } else if (flyOutDirection === 'left') {
    topCardTransform = 'translate3d(-1200px, 50px, 0) rotate(-35deg)';
    topCardTransition = 'transform 0.3s ease-in, opacity 0.3s ease-in';
  } else {
    topCardTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.5}px, 0) rotate(${rotateDeg}deg)`;
  }

  // Previsualización de la carta siguiente
  const nextCardScale = 0.94 + swipeRatio * 0.06;
  const nextCardOffsetY = 16 - swipeRatio * 16;

  return (
    <div className="tinder-deck-container">
      {/* Header superior con progreso y estadísticas */}
      <div className="deck-top-bar">
        <button className="deck-exit-btn" onClick={onExit} title="Volver al menú">
          ← Menú
        </button>

        <div className="deck-badge-group">
          {deckTitle && (
            <span className="deck-title-pill" title={deckTitle}>
              {deckTitle}
            </span>
          )}
          {isReviewRound ? (
            <span className="deck-badge review-badge">
              🔄 Repaso #{roundNumber}
            </span>
          ) : (
            <span className="deck-badge study-badge">
              📚 Modo Estudio
            </span>
          )}
          <span className="deck-progress-pill">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="deck-top-right-group">
          <div className="deck-stats-pill">
            <span className="stat-correct" title="Correctas">✓ {stats?.correct || 0}</span>
            <span className="stat-divider">|</span>
            <span className="stat-incorrect" title="A repasar">✗ {stats?.incorrect || 0}</span>
          </div>
          {onToggleTheme && (
            <button
              className="deck-theme-btn"
              onClick={onToggleTheme}
              title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}
        </div>
      </div>

      {/* Stack de Cartas */}
      <div
        className="card-stack-viewport"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Carta siguiente en el fondo */}
        {nextCard && (
          <div
            className="tinder-card next-card"
            style={{
              transform: `scale(${nextCardScale}) translateY(${nextCardOffsetY}px)`,
              opacity: 0.75 + swipeRatio * 0.25,
            }}
          >
            <div className="card-face front-face preview-face">
              <div className="card-header">
                <span className="card-category">Siguiente</span>
                <span className="card-id">#{nextCard.id}</span>
              </div>
              <h3 className="card-question">
                <MarkdownText text={nextCard.question} />
              </h3>
            </div>
          </div>
        )}

        {/* Carta actual frontal e interactiva */}
        <div
          className={`tinder-card active-card ${flyOutDirection ? 'flying-out' : ''}`}
          style={{
            transform: topCardTransform,
            transition: topCardTransition,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          {/* Sellos dinámicos de Swipe */}
          <div
            className="tinder-stamp stamp-correct"
            style={{ opacity: rightStampOpacity, display: showRightStamp ? 'block' : 'none' }}
          >
            CORRECTO ✓
          </div>
          <div
            className="tinder-stamp stamp-incorrect"
            style={{ opacity: leftStampOpacity, display: showLeftStamp ? 'block' : 'none' }}
          >
            REPASAR ✗
          </div>

          {/* Tarjeta con soporte 3D Flip */}
          <div className={`card-inner-flip ${flipped ? 'is-flipped' : ''}`}>
            {/* CARA FRONTAL: Pregunta y Opciones */}
            <div className="card-face front-face">
              <div className="card-header">
                <span className="card-category">Pregunta</span>
                <span className="card-id">#{currentCard.id}</span>
              </div>

              <div className="card-question-box">
                <h3 className="card-question">
                  <MarkdownText text={currentCard.question} />
                </h3>
              </div>

              {correctLetters.length > 1 && (
                <div className="multi-choice-tag">
                  ✦ Selección múltiple ({correctLetters.length} respuestas)
                </div>
              )}

              <div className="options-stack">
                {optionsList.map((opt) => (
                  <div key={opt.letter} className="option-row">
                    <span className="opt-letter">{opt.letter}</span>
                    <span className="opt-text">
                      <MarkdownText text={opt.text} />
                    </span>
                  </div>
                ))}
              </div>

              <div className="tap-to-flip-hint">
                <span className="flip-icon">👆</span> Toca para dar vuelta y ver la respuesta
              </div>
            </div>

            {/* CARA TRASERA: Respuesta Correcta y Explicación */}
            <div className="card-face back-face">
              <div className="card-header">
                <span className="card-category back-title">✓ Respuesta Revelada</span>
                <span className="card-id">#{currentCard.id}</span>
              </div>

              <div className="answer-reveal-box">
                <div className="reveal-badge">
                  {correctLetters.length > 1 ? 'Respuestas Correctas:' : 'Respuesta Correcta:'}
                </div>
                <div className="revealed-letters">
                  {correctLetters.map((l) => (
                    <span key={l} className="correct-letter-badge">{l}</span>
                  ))}
                </div>
              </div>

              <div className="correct-options-list">
                {optionsList
                  .filter((opt) => correctLetters.includes(opt.letter))
                  .map((opt) => (
                    <div key={opt.letter} className="revealed-option-item">
                      <span className="rev-letter">{opt.letter}</span>
                      <span className="rev-text">
                        <MarkdownText text={opt.text} />
                      </span>
                    </div>
                  ))}
              </div>

              {currentCard.explanation && (
                <div className="card-explanation">
                  <strong>💡 Explicación:</strong>
                  <p>
                    <MarkdownText text={currentCard.explanation} />
                  </p>
                </div>
              )}

              <div className="self-evaluate-prompt">
                <p>¿La tuviste correcta?</p>
                <div className="evaluate-hints">
                  <span>← Swipe Izq: No</span>
                  <span>Swipe Der: Sí →</span>
                </div>
              </div>

              <div className="tap-to-flip-hint back-hint">
                <span className="flip-icon">🔄</span> Toca para volver a la pregunta
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles Flotantes estilo Tinder */}
      <div className="tinder-controls-bar">
        <button
          className="tinder-btn btn-nope"
          onClick={() => triggerSwipe('left')}
          title="Marcar como incorrecta / Repasar (Flecha Izq)"
          disabled={!!flyOutDirection}
        >
          <span className="btn-icon">✕</span>
          <span className="btn-label">Repasar</span>
        </button>

        <button
          className="tinder-btn btn-flip"
          onClick={() => setFlipped((prev) => !prev)}
          title="Dar vuelta a la carta (Espacio o Enter)"
        >
          <span className="btn-icon">🔄</span>
          <span className="btn-label">{flipped ? 'Ver Pregunta' : 'Ver Respuesta'}</span>
        </button>

        <button
          className="tinder-btn btn-like"
          onClick={() => triggerSwipe('right')}
          title="Marcar como correcta (Flecha Der)"
          disabled={!!flyOutDirection}
        >
          <span className="btn-icon">✓</span>
          <span className="btn-label">Correcta</span>
        </button>
      </div>

      {/* Atajos de teclado */}
      <div className="keyboard-shortcuts-pill">
        <span><kbd>←</kbd> Repasar</span>
        <span><kbd>Espacio</kbd> Voltear</span>
        <span><kbd>→</kbd> Correcta</span>
      </div>
    </div>
  );
}
