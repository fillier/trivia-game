import React, { useState } from 'react';

const HostLogin = ({ onAuthenticate, isConnected, isAttempting }) => {
  const [hostCode, setHostCode] = useState('ADMIN123'); // Pre-filled for convenience

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hostCode.trim()) {
      alert('Please enter host code');
      return;
    }
    onAuthenticate(hostCode.trim());
  };

  return (
    <div className="card">
      <h2>Host Authentication</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="input"
          placeholder="Enter host code"
          value={hostCode}
          onChange={(e) => setHostCode(e.target.value)}
          disabled={!isConnected || isAttempting}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!isConnected || !hostCode.trim() || isAttempting}
        >
          {isAttempting ? 'Connecting...' : 'Connect as Host'}
        </button>
      </form>
      
      {!isConnected && (
        <div style={{ color: '#dc3545', marginTop: '8px', fontSize: '14px' }}>
          ⚠️ Waiting for server connection...
        </div>
      )}
      
      {isAttempting && (
        <div style={{ color: '#007bff', marginTop: '8px', fontSize: '14px' }}>
          🔄 Authenticating...
        </div>
      )}
    </div>
  );
};

export default HostLogin;