import React, { useState } from 'react';
import './TestResults.css';

export default function TestResults({
  result,
  onViewLeaderboard,
  onBackToMenu,
  onRetryTest
}) {
  const [showReview, setShowReview] = useState(false);
  const { name, score, correctCount, totalCount, passed, timeTakenSeconds, reviewDetails } = result;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="test-results-container">
      <div className="test-results-card">
        {/* Banner de Aprobado / Reprobado */}
        <div className={`result-status-banner ${passed ? 'banner-passed' : 'banner-failed'}`}>
          <div className="status-icon">{passed ? '🎉' : '⚠️'}</div>
          <div className="status-text">
            <h2>{passed ? '¡EXAMEN APROBADO!' : 'EXAMEN NO APROBADO'}</h2>
            <p>
              {passed
                ? `¡Felicidades, ${name}! Has superado el puntaje mínimo de aprobación (70%).`
                : `Ánimo, ${name}. Necesitas 70% para aprobar. ¡Sigue practicando en Modo Estudio!`}
            </p>
          </div>
        </div>

        {/* Tablero de Resultados */}
        <div className="test-stats-row">
          <div className="test-stat-item">
            <span className="stat-label">Calificación Final</span>
            <span className={`stat-value-big ${passed ? 'text-emerald' : 'text-rose'}`}>
              {score}%
            </span>
          </div>

          <div className="test-stat-item">
            <span className="stat-label">Aciertos</span>
            <span className="stat-value">
              {correctCount} / {totalCount}
            </span>
          </div>

          <div className="test-stat-item">
            <span className="stat-label">Tiempo Empleado</span>
            <span className="stat-value">{formatTime(timeTakenSeconds)}</span>
          </div>
        </div>

        {/* Botón para alternar revisión de preguntas */}
        {reviewDetails && reviewDetails.length > 0 && (
          <div className="review-toggle-container">
            <button
              className="review-toggle-btn"
              onClick={() => setShowReview((prev) => !prev)}
            >
              {showReview ? '▲ Ocultar desglose de respuestas' : '▼ Ver desglose detallado de respuestas'}
            </button>

            {showReview && (
              <div className="test-review-list">
                {reviewDetails.map((item, idx) => (
                  <div
                    key={item.question.id || idx}
                    className={`review-detail-item ${item.isCorrect ? 'item-correct' : 'item-incorrect'}`}
                  >
                    <div className="detail-header">
                      <span className="detail-status">
                        {item.isCorrect ? '✓ Correcta' : '✕ Incorrecta'}
                      </span>
                      <span className="detail-id">#{item.question.id}</span>
                    </div>

                    <p className="detail-question">{item.question.question}</p>

                    <div className="detail-answers-comparison">
                      <div className="user-ans">
                        <strong>Tu respuesta:</strong>{' '}
                        {item.userAnswer.length > 0 ? item.userAnswer.join(', ') : '(En blanco)'}
                      </div>
                      <div className="correct-ans">
                        <strong>Respuesta correcta:</strong> {item.correctLetters.join(', ')}
                      </div>
                    </div>

                    {item.question.explanation && (
                      <p className="detail-explanation">
                        💡 {item.question.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="test-results-actions">
          <button className="test-action-btn btn-leaderboard" onClick={onViewLeaderboard}>
            🏆 Ver Tabla de Posiciones
          </button>
          <button className="test-action-btn btn-retry" onClick={onRetryTest}>
            🔄 Repetir Examen
          </button>
          <button className="test-action-btn btn-menu" onClick={onBackToMenu}>
            ← Menú Principal
          </button>
        </div>
      </div>
    </div>
  );
}
