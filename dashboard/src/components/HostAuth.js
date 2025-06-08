import React, { useState } from 'react';

const HostAuth = ({ onAuth }) => {
  const [hostCode, setHostCode] = useState('ADMIN123');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hostCode.trim()) {
      onAuth(hostCode.trim());
    }
  };

  return (
    <div className="card">
      <h2>Host Authentication</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          className="input"
          placeholder="Enter host code"
          value={hostCode}
          onChange={(e) => setHostCode(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Connect as Host
        </button>
      </form>
    </div>
  );
};

export default HostAuth;