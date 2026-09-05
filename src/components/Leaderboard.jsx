import React, { useState, useMemo } from 'react';
import './Leaderboard.css';

export default function Leaderboard({ data, onBack, onClear }) {
  const [selectedDeckFilter, setSelectedDeckFilter] = useState('ALL');

  // Obtener lista única de exámenes presentes en el historial
  const availableDecks = useMemo(() => {
    if (!data || data.length === 0) return [];
    const set = new Set();
    data.forEach((entry) => {
      const title = entry.deckTitle || 'Examen General';
      set.add(title);
    });
    return Array.from(set);
  }, [data]);

  // Filtrar datos según examen seleccionado
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (selectedDeckFilter === 'ALL') return data;
    return data.filter((entry) => (entry.deckTitle || 'Examen General') === selectedDeckFilter);
  }, [data, selectedDeckFilter]);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <div className="leaderboard-badge">Top Exámenes</div>
          <h2>🏆 Tabla de Posiciones</h2>
          <p>Mejores puntajes obtenidos en el Modo Examen</p>
        </div>

        {/* Filtro por Examen si hay múltiples registrados */}
        {availableDecks.length > 1 && (
          <div className="leaderboard-filter-bar">
            <span className="filter-label">Filtrar por examen:</span>
            <select
              className="deck-filter-select"
              value={selectedDeckFilter}
              onChange={(e) => setSelectedDeckFilter(e.target.value)}
            >
              <option value="ALL">🌐 Todos los Exámenes ({data.length})</option>
              {availableDecks.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        )}

        {(!filteredData || filteredData.length === 0) ? (
          <div className="no-leaderboard-data">
            <span className="no-data-icon">🎯</span>
            <p>Aún no hay puntuaciones registradas para esta selección.</p>
            <span className="no-data-hint">¡Completa un examen en Modo Test para aparecer aquí!</span>
          </div>
        ) : (
          <div className="leaderboard-list">
            <div className="leaderboard-row-header">
              <span className="col-rank">#</span>
              <span className="col-name">Estudiante</span>
              <span className="col-deck">Examen</span>
              <span className="col-score">Puntaje</span>
              <span className="col-date">Fecha</span>
            </div>

            {filteredData.map((entry, index) => (
              <div
                key={index}
                className={`leaderboard-row ${
                  index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''
                }`}
              >
                <span className="col-rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </span>
                <span className="col-name" title={entry.name}>
                  {entry.picture ? (
                    <img
                      src={entry.picture}
                      alt={entry.name}
                      className="lb-avatar-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="lb-avatar-fallback">👤</span>
                  )}
                  <span className="lb-name-text">{entry.name || 'Anónimo'}</span>
                </span>
                <span className="col-deck" title={entry.deckTitle || 'Examen General'}>
                  <span className="deck-tag">
                    {entry.deckTitle || 'Examen General'}
                  </span>
                </span>
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
