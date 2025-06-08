import React from 'react';

const Results = ({ correctAnswer, scores, playerName, isFinished }) => {
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);
  const currentPlayer = scores.find(player => player.name === playerName);
  const currentPlayerRank = sortedScores.findIndex(player => player.name === playerName) + 1;

  const handleReturnToJoin = () => {
    // Force return to join screen
    window.location.reload();
  };

  return (
    <div className="card">
      <h2 style={{ color: '#333', textAlign: 'center', marginBottom: '20px' }}>
        {isFinished ? '🏆 Final Results!' : '📊 Question Results'}
      </h2>
      
      {!isFinished && correctAnswer && (
        <div style={{ 
          background: 'linear-gradient(135deg, #28a745, #20c997)', 
          color: 'white', 
          padding: '16px', 
          borderRadius: '12px', 
          marginBottom: '20px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }}>
          ✅ Correct Answer: {correctAnswer}
        </div>
      )}

      <div className="scores-list">
        <h3>🏆 Leaderboard</h3>
        {sortedScores.map((player, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          const isCurrentPlayer = player.name === playerName;
          
          return (
            <div 
              key={player.id || player.name} 
              className={`score-item ${isCurrentPlayer ? 'current-player' : ''}`}
            >
              <span style={{ fontSize: '1.1rem' }}>
                {medal} {player.name}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {player.score} pts
              </span>
            </div>
          );
        })}
      </div>

      {currentPlayer && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#333',
          padding: '16px',
          borderRadius: '12px',
          margin: '16px 0',
          textAlign: 'center',
          border: '2px solid #007bff'
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px' }}>
            🎯 Your Position: #{currentPlayerRank}
          </div>
          <div style={{ fontSize: '1.1rem' }}>
            Total Score: {currentPlayer.score} points
          </div>
        </div>
      )}

      {isFinished ? (
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            color: '#333',
            fontSize: '1.1rem',
            textAlign: 'center',
            fontStyle: 'italic',
            marginBottom: '16px'
          }}>
            🎯 Waiting for host to start a new game...
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleReturnToJoin}
            style={{ marginTop: '16px' }}
          >
            Return to Join Screen
          </button>
        </div>
      ) : (
        <div style={{ 
          color: '#333',
          fontSize: '1.1rem',
          textAlign: 'center',
          fontStyle: 'italic',
          marginTop: '20px'
        }}>
          ⏳ Waiting for next question...
        </div>
      )}
    </div>
  );
};

export default Results;