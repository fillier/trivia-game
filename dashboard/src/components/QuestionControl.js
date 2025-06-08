import React from 'react';

const QuestionControl = ({
  currentQuestion,
  answersReceived,
  totalPlayers,
  onNextQuestion,
  onShowResults,
  onEndGame
}) => {
  return (
    <div className="card">
      <h2>Game Control</h2>
      
      <div className="question-display">
        <h3>Current Question:</h3>
        <div>{currentQuestion || 'No question sent yet'}</div>
      </div>

      <div className="answers-count">
        Answers received: {answersReceived} / {totalPlayers}
      </div>

      <div className="grid">
        <button className="btn btn-primary" onClick={onNextQuestion}>
          Next Question
        </button>
        
        <button 
          className="btn btn-success" 
          onClick={onShowResults}
          disabled={answersReceived === 0}
        >
          Show Results
        </button>
        
        <button className="btn btn-danger" onClick={onEndGame}>
          End Game
        </button>
      </div>
    </div>
  );
};

export default QuestionControl;