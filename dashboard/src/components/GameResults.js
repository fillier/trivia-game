import React from 'react';

const GameResults = ({ scores, onResetGame }) => {
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="card">
      <h2>🏆 Final Results</h2>
      
      <div className="player-list">
        <h3>Leaderboard:</h3>
        {sortedScores.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No scores available</p>
        ) : (
          sortedScores.map((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            return (
              <div key={player.id} className="player-item">
                <span>{medal} {player.name}</span>
                <span><strong>{player.score} points</strong></span>
              </div>
            );
          })
        )}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button 
          className="btn btn-primary"
          onClick={onResetGame}
          style={{ fontSize: '18px', padding: '16px 32px' }}
        >
          🎯 Start New Game
        </button>
      </div>
      
      <div style={{ marginTop: '16px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
        This will reset the game and all players will need to rejoin
      </div>
    </div>
  );
};

export default GameResults;