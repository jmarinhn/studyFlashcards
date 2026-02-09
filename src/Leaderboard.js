import React from 'react';
import './Leaderboard.css';

const Leaderboard = ({ data, onBack }) => {
  return (
    <div className="leaderboard-container">
      <h2>🏆 Leaderboard</h2>

      {data.length === 0 ? (
        <div className="no-data">
          <p>No scores yet!</p>
          <p>Complete a test to appear here.</p>
        </div>
      ) : (
        <div className="leaderboard-table">
          <div className="table-header">
            <span className="rank">#</span>
            <span className="name">Name</span>
            <span className="score">Score</span>
          </div>
          {data.map((entry, index) => (
            <div key={index} className={`table-row ${index < 3 ? 'top-' + (index + 1) : ''}`}>
              <span className="rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </span>
              <span className="name">{entry.name}</span>
              <span className="score">{entry.score}%</span>
            </div>
          ))}
        </div>
      )}

      <button className="back-btn" onClick={onBack}>
        ← Back to Menu
      </button>
    </div>
  );
};

export default Leaderboard;
