import React from 'react';

const Results = ({ correctAnswer, scores, playerName, isFinished }) => {
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="card">
      <h2 className="text-center">
        {isFinished ? '🏆 Final Results' : '📊 Question Results'}
      </h2>
      
      {!isFinished && correctAnswer && (
        <div className="question-card">
          <strong>Correct Answer:</strong> {correctAnswer}
        </div>
      )}

      <div className="scores-list">
        <h3 style={{ color: 'white', marginBottom: '16px' }}>
          {isFinished ? 'Final Leaderboard:' : 'Current Scores:'}
        </h3>
        {sortedScores.map((player, index) => {
          const isCurrentPlayer = player.name === playerName;
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
          
          return (
            <div 
              key={player.id} 
              className={`score-item ${isCurrentPlayer ? 'current-player' : ''}`}
            >
              <span>{medal} {player.name}</span>
              <span><strong>{player.score} points</strong></span>
            </div>
          );
        })}
      </div>

      <div className="waiting-message">
        {isFinished 
          ? 'Game completed! Waiting for host to start a new game...'
          : 'Waiting for next question...'
        }
      </div>
    </div>
  );
};

export default Results;