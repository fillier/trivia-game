import React from 'react';

const GameLobby = ({ players, onStartGame }) => {
  return (
    <div className="card">
      <h2>🏁 Game Lobby</h2>
      
      <div className="player-list">
        <h3>Players Joined: {players.length}</h3>
        {players.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No players have joined yet. Share the game link with players!
          </p>
        ) : (
          <div>
            {players.map((player, index) => (
              <div key={player.id} className="player-item">
                <span>👤 {player.name}</span>
                <span>Score: {player.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid">
        <button 
          className="btn btn-success"
          onClick={onStartGame}
          disabled={players.length === 0}
        >
          Start Game ({players.length} players)
        </button>
      </div>
    </div>
  );
};

export default GameLobby;