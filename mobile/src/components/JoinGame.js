import React, { useState, useEffect } from 'react';

const JoinGame = ({ onJoinGame }) => {
  const [playerName, setPlayerName] = useState('');

  // Clear input when component mounts (after reset)
  useEffect(() => {
    setPlayerName('');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = playerName.trim();
    if (name) {
      onJoinGame(name);
    }
  };

  return (
    <div className="card">
      <h2 className="text-center">Join the Game</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="input"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={20}
          autoFocus
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!playerName.trim()}
        >
          Join Game
        </button>
      </form>
    </div>
  );
};

export default JoinGame;