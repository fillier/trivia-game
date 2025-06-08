import React from 'react';

const WaitingScreen = ({ selectedAnswer }) => {
  return (
    <div className="card">
      <div className="answer-submitted">
        ✅ Answer submitted!
      </div>
      
      <div className="waiting-message">
        Your answer: <strong>{selectedAnswer}</strong>
      </div>
      
      <div className="waiting-message">
        Waiting for other players and results...
      </div>
    </div>
  );
};

export default WaitingScreen;