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
  const [availableHints, setAvailableHints] = useState(0);
  const [shownHints, setShownHints] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [scores, setScores] = useState([]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log('Dashboard received:', lastMessage);
    const { event, data } = lastMessage;
    
    switch (event) {
      case 'host_authenticated':
        console.log('Processing host_authenticated event:', data);
        setAuthAttempting(false);
        if (data.success) {
          console.log('Setting isAuthenticated to true');
          setIsAuthenticated(true);
        } else {
          console.log('Authentication failed');
          setIsAuthenticated(false);
          alert('Invalid host code');
        }
        break;
        
      case 'players_update':
        console.log('Players update:', data.players);
        setPlayers(data.players || []);
        // If no players and we're in active state, go back to lobby
        if ((data.players || []).length === 0 && gameState === 'active') {
          setGameState('lobby');
        }
        break;
        
      case 'question_started':
        setCurrentQuestion(data.question);
        setAvailableHints(data.availableHints);
        setShownHints(0);
        break;
        
      case 'hint_shown':
        setShownHints(prev => prev + 1);
        break;
        
      case 'hint_error':
        alert(data.message);
        break;
        
      case 'answers_update':
        console.log('Answers update:', data.answers);
        setAnswers(data.answers || []);
        break;
        
      case 'game_ended':
        setGameState('results');
        setScores(data.finalScores || []);
        break;
        
      // Add explicit handling for game reset from server side
      case 'game_reset_complete':
        console.log('Game reset - returning to lobby');
        setGameState('lobby');
        setPlayers([]);
        setAnswers([]);
        setScores([]);
        setCurrentQuestion(null);
        setAvailableHints(0);
        setShownHints(0);
        break;
        
      default:
        console.log('Unhandled dashboard event:', event, data);
    }
  }, [lastMessage, gameState]);

  // Debug: Log authentication state changes
  useEffect(() => {
    console.log('Authentication state changed:', { isAuthenticated, authAttempting });
  }, [isAuthenticated, authAttempting]);

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
    
    console.log('Starting authentication with code:', hostCode);
    setAuthAttempting(true);
    setIsAuthenticated(false); // Reset auth state
    
    // Add a small delay to ensure state is updated
    setTimeout(() => {
      console.log('Sending host_auth message');
      sendMessage('host_auth', { hostCode });
    }, 100);
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
    console.log('Initiating game reset...');
    sendMessage('reset_game', {});
    
    // Immediately update local state (don't wait for server confirmation)
    setGameState('lobby');
    setPlayers([]);
    setAnswers([]);
    setScores([]);
    setCurrentQuestion(null);
  };

  const handleShowHint = () => {
    sendMessage('show_hint', {});
  };

  const renderCurrentView = () => {
    console.log('Rendering view - isAuthenticated:', isAuthenticated);
    
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
            currentQuestion={currentQuestion}
            availableHints={availableHints}
            shownHints={shownHints}
            onNextQuestion={handleNextQuestion}
            onShowResults={handleShowResults}
            onResetGame={handleResetGame}
            onShowHint={handleShowHint}
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
        
        {/* Debug info */}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          Auth: {isAuthenticated ? 'Yes' : 'No'} | Attempting: {authAttempting ? 'Yes' : 'No'} | State: {gameState} | Players: {players.length}
        </div>
      </div>

      {renderCurrentView()}
    </div>
  );
}

export default App;