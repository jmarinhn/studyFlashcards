import React from 'react';
import './Leaderboard.css';

export default function Leaderboard({ data, onBack, onClear }) {
  return (
    <div className="leaderboard-container">
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <div className="leaderboard-badge">Top Exámenes</div>
          <h2>🏆 Tabla de Posiciones</h2>
          <p>Mejores puntajes obtenidos en el Modo Examen</p>
        </div>

        {(!data || data.length === 0) ? (
          <div className="no-leaderboard-data">
            <span className="no-data-icon">🎯</span>
            <p>Aún no hay puntuaciones registradas.</p>
            <span className="no-data-hint">¡Completa un examen en Modo Test para aparecer aquí!</span>
          </div>
        ) : (
          <div className="leaderboard-list">
            <div className="leaderboard-row-header">
              <span className="col-rank">#</span>
              <span className="col-name">Estudiante</span>
              <span className="col-score">Puntaje</span>
              <span className="col-date">Fecha</span>
            </div>

            {data.map((entry, index) => (
              <div
                key={index}
                className={`leaderboard-row ${index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}`}
              >
                <span className="col-rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </span>
                <span className="col-name">{entry.name || 'Anónimo'}</span>
                <span className={`col-score ${entry.score >= 70 ? 'score-passed' : 'score-failed'}`}>
                  {entry.score}%
                </span>
                <span className="col-date">{entry.date || 'Reciente'}</span>
              </div>
            ))}
          </div>
        )}

        <div className="leaderboard-actions">
          <button className="leaderboard-back-btn" onClick={onBack}>
            ← Volver al Menú
          </button>
          {data && data.length > 0 && (
            <button className="leaderboard-clear-btn" onClick={onClear} title="Borrar historial local">
              Borrar Historial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
