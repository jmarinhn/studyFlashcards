import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import './StudyResults.css';

export default function StudyResults({
  stats,
  incorrectCards,
  totalStudied,
  roundNumber,
  onReviewIncorrect,
  onRestartAll,
  onBackToMenu,
}) {
  const isAllMastered = incorrectCards.length === 0;
  const accuracy = totalStudied > 0 ? Math.round((stats.correct / totalStudied) * 100) : 0;

  // Si todas fueron dominadas, lanzar confetti festivo
  useEffect(() => {
    if (isAllMastered) {
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#6366f1', '#fbbf24']
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#38bdf8', '#ec4899']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isAllMastered]);

  return (
    <div className="study-results-container">
      <div className="results-card">
        {/* Encabezado */}
        <div className="results-header">
          <div className="results-badge">
            {roundNumber > 1 ? `Ronda de Repaso #${roundNumber}` : 'Mazo Completado'}
          </div>
          <h2 className="results-title">
            {isAllMastered ? '🏆 ¡100% Dominado!' : '📊 Resumen de tu Sesión'}
          </h2>
          <p className="results-subtitle">
            {isAllMastered
              ? '¡Excelente trabajo! Has respondido correctamente todas las preguntas de este mazo.'
              : 'Has terminado esta pasada por el mazo. Revisa tus resultados a continuación:'}
          </p>
        </div>

        {/* Métrica de Precisión con Barra de Progreso */}
        <div className="accuracy-meter-box">
          <div className="accuracy-label-row">
            <span>Precisión de acierto</span>
            <span className="accuracy-pct">{accuracy}%</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${accuracy}%`,
                background: accuracy >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : accuracy >= 50 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #f43f5e, #fb7185)'
              }}
            />
          </div>
        </div>

        {/* Tablero de Estadísticas */}
        <div className="stats-grid">
          <div className="stat-box stat-correct-box">
            <span className="stat-icon">✓</span>
            <div className="stat-number">{stats.correct}</div>
            <div className="stat-desc">Correctas</div>
          </div>

          <div className="stat-box stat-incorrect-box">
            <span className="stat-icon">✕</span>
            <div className="stat-number">{incorrectCards.length}</div>
            <div className="stat-desc">A Repasar</div>
          </div>

          <div className="stat-box stat-total-box">
            <span className="stat-icon">📑</span>
            <div className="stat-number">{totalStudied}</div>
            <div className="stat-desc">Preguntas</div>
          </div>
        </div>

        {/* Acción Principal: Repasar las malas */}
        {!isAllMastered ? (
          <div className="review-action-panel">
            <div className="review-info">
              <span className="alert-dot"></span>
              <span>Te quedaron <strong>{incorrectCards.length} preguntas</strong> por dominar.</span>
            </div>
            <button className="cta-btn review-btn" onClick={onReviewIncorrect}>
              <span className="cta-icon">🔄</span>
              <span>Repasar solo las malas ({incorrectCards.length})</span>
            </button>
            <p className="review-hint">
              Te mostraremos únicamente las preguntas incorrectas en una nueva ronda hasta que las domines todas.
            </p>
          </div>
        ) : (
          <div className="mastery-banner">
            <div className="mastery-icon">🎉</div>
            <div className="mastery-text">
              <h4>¡Mazo totalmente dominado!</h4>
              <p>No tienes preguntas pendientes en la lista de errores.</p>
            </div>
          </div>
        )}

        {/* Desglose de preguntas incorrectas (si hay) */}
        {!isAllMastered && incorrectCards.length > 0 && (
          <div className="missed-questions-preview">
            <h4>Preguntas a repasar ({incorrectCards.length}):</h4>
            <div className="missed-list">
              {incorrectCards.map((q, idx) => (
                <div key={q.id || idx} className="missed-item">
                  <span className="missed-index">#{idx + 1}</span>
                  <span className="missed-text">{q.question}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones Secundarios */}
        <div className="results-actions-footer">
          <button className="secondary-btn restart-btn" onClick={onRestartAll}>
            🔀 Estudiar todo de nuevo
          </button>
          <button className="secondary-btn menu-btn" onClick={onBackToMenu}>
            ← Volver al Menú
          </button>
        </div>
      </div>
    </div>
  );
}
