import React, { useState } from 'react';

const GameActive = ({ 
  players, 
  answers, 
  currentQuestion,
  availableHints,
  shownHints,
  onNextQuestion, 
  onShowResults, 
  onResetGame,
  onShowHint 
}) => {
  const totalPlayers = players.length;
  const answersReceived = answers.length;
  
  return (
    <div className="card">
      <h2>🎮 Game in Progress</h2>
      
      {currentQuestion && (
        <div className="question-display">
          <h3>Current Question:</h3>
          <p><strong>{currentQuestion.question}</strong></p>
          
          {currentQuestion.options && (
            <div style={{ marginTop: '12px' }}>
              <strong>Options:</strong>
              <ul>
                {currentQuestion.options.map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
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

      {/* Hints Section */}
      {availableHints > 0 && (
        <div className="card" style={{ backgroundColor: '#f8f9fa', marginTop: '16px' }}>
          <h4>💡 Hints ({shownHints}/{availableHints})</h4>
          
          {shownHints > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <strong>Hints shown:</strong>
              <ol>
                {Array.from({length: shownHints}, (_, i) => (
                  <li key={i}>Hint {i + 1}</li>
                ))}
              </ol>
            </div>
          )}
          
          <button 
            className="btn btn-primary"
            onClick={onShowHint}
            disabled={shownHints >= availableHints}
            style={{ marginRight: '8px' }}
          >
            {shownHints >= availableHints ? 'No More Hints' : `Show Hint ${shownHints + 1}`}
          </button>
        </div>
      )}

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