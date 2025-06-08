import React, { useState, useEffect } from 'react';
import useWebSocket from './hooks/useWebSocket';
import HostLogin from './components/HostLogin';
import GameLobby from './components/GameLobby';
import GameActive from './components/GameActive';
import GameResults from './components/GameResults';

function App() {
  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
      ? window.location.host 
      : 'localhost:3001';
    return `${protocol}//${host}`;
  };

  const { isConnected, lastMessage, sendMessage } = useWebSocket(getWebSocketUrl());
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authAttempting, setAuthAttempting] = useState(false);
  const [gameState, setGameState] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [scores, setScores] = useState([]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log('Dashboard received:', lastMessage);
    const { event, data } = lastMessage;
    
    switch (event) {
      case 'host_authenticated':
        setAuthAttempting(false);
        if (data.success) {
          setIsAuthenticated(true);
          console.log('Host authentication successful');
        } else {
          setIsAuthenticated(false);
          alert('Invalid host code');
        }
        break;
        
      case 'players_update':
        setPlayers(data.players || []);
        break;
        
      case 'answers_update':
        setAnswers(data.answers || []);
        break;
        
      case 'game_ended':
        setGameState('results');
        setScores(data.finalScores || []);
        break;
        
      default:
        console.log('Unhandled dashboard event:', event, data);
    }
  }, [lastMessage]);

  // Handle authentication
  const handleAuthentication = (hostCode) => {
    if (!isConnected) {
      alert('Not connected to server. Please wait...');
      return;
    }
    
    if (authAttempting) {
      console.log('Authentication already in progress');
      return;
    }
    
    console.log('Attempting authentication with code:', hostCode);
    setAuthAttempting(true);
    setIsAuthenticated(false); // Reset auth state
    
    sendMessage('host_auth', { hostCode });
  };

  const handleStartGame = () => {
    sendMessage('start_game', {});
    setGameState('active');
  };

  const handleNextQuestion = () => {
    sendMessage('next_question', {});
    setAnswers([]);
  };

  const handleShowResults = () => {
    sendMessage('show_results', {});
  };

  const handleResetGame = () => {
    sendMessage('reset_game', {});
    setGameState('lobby');
    setPlayers([]);
    setAnswers([]);
    setScores([]);
    setCurrentQuestion(null);
  };

  const renderCurrentView = () => {
    if (!isAuthenticated) {
      return (
        <HostLogin 
          onAuthenticate={handleAuthentication}
          isConnected={isConnected}
          isAttempting={authAttempting}
        />
      );
    }

    switch (gameState) {
      case 'lobby':
        return (
          <GameLobby
            players={players}
            onStartGame={handleStartGame}
          />
        );
      case 'active':
        return (
          <GameActive
            players={players}
            answers={answers}
            onNextQuestion={handleNextQuestion}
            onShowResults={handleShowResults}
            onResetGame={handleResetGame}
          />
        );
      case 'results':
        return (
          <GameResults
            scores={scores}
            onResetGame={handleResetGame}
          />
        );
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="container">
      <h1>🎯 Trivia Game Dashboard</h1>
      
      <div className="card">
        <div className={`status ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
          {isConnected ? '✅ Connected to server' : '❌ Connection lost'}
        </div>
        
        {isAuthenticated && (
          <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            🎮 Host authenticated | Game state: {gameState} | Players: {players.length}
          </div>
        )}
      </div>

      {renderCurrentView()}
    </div>
  );
}

export default App;