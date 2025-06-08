import React from 'react';

const GameLobby = ({ playerName, playerCount }) => {
  return (
    <div className="card">
      <h2 className="text-center">🏁 Waiting for Game to Start</h2>
      
      <div className="player-info">
        <div className="player-name">Welcome, {playerName}!</div>
        <div>Players joined: {playerCount}</div>
      </div>

      <div className="waiting-message">
        Waiting for host to start the game...
      </div>
    </div>
  );
};

export default GameLobby;