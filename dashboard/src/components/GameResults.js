import React from 'react';

const GameResults = ({ scores, onResetGame }) => {
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="card">
      <h2>🏆 Final Results</h2>
      
      <div className="player-list">
        <h3>Leaderboard:</h3>
        {sortedScores.map((player, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
          
          return (
            <div key={player.id} className="player-item">
              <span>{medal} {player.name}</span>
              <span><strong>{player.score} points</strong></span>
            </div>
          );
        })}
      </div>

      <div className="grid">
        <button 
          className="btn btn-primary"
          onClick={onResetGame}
        >
          Start New Game
        </button>
      </div>
    </div>
  );
};

export default GameResults;