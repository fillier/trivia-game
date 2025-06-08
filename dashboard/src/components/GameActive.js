import React from 'react';

const GameActive = ({ players, answers, onNextQuestion, onShowResults, onResetGame }) => {
  const totalPlayers = players.length;
  const answersReceived = answers.length;
  
  return (
    <div className="card">
      <h2>🎮 Game in Progress</h2>
      
      <div className="question-display">
        <div className="answers-count">
          Answers received: {answersReceived} / {totalPlayers}
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <strong>Players:</strong>
          <div className="player-list">
            {players.map((player) => {
              const hasAnswered = answers.some(answer => answer.playerId === player.id);
              return (
                <div key={player.id} className="player-item">
                  <span>👤 {player.name}</span>
                  <span style={{ color: hasAnswered ? '#28a745' : '#dc3545' }}>
                    {hasAnswered ? '✅ Answered' : '⏳ Waiting'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid">
        <button 
          className="btn btn-primary"
          onClick={onNextQuestion}
        >
          Next Question
        </button>
        
        <button 
          className="btn btn-success"
          onClick={onShowResults}
          disabled={answersReceived === 0}
        >
          Show Results
        </button>
        
        <button 
          className="btn btn-danger"
          onClick={onResetGame}
        >
          Reset Game
        </button>
      </div>
    </div>
  );
};

export default GameActive;