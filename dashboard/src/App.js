import React, { useState, useEffect } from 'react';
import useWebSocket from './hooks/useWebSocket';
import HostAuth from './components/HostAuth';
import GameLobby from './components/GameLobby';
import QuestionControl from './components/QuestionControl';
import Results from './components/Results';

function App() {
  const { isConnected, lastMessage, sendMessage } = useWebSocket('ws://localhost:3001');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gameState, setGameState] = useState('auth'); // auth, lobby, game, results
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answersReceived, setAnswersReceived] = useState(0);
  const [finalScores, setFinalScores] = useState([]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const { event, data } = lastMessage;
    
    switch (event) {
      case 'host_authenticated':
        if (data.success) {
          setIsAuthenticated(true);
          setGameState('lobby');
        } else {
          alert('Invalid host code');
        }
        break;
        
      case 'players_update':
        setPlayers(data.players);
        break;
        
      case 'answers_update':
        setAnswersReceived(data.answers.length);
        break;
        
      case 'game_ended':
        setFinalScores(data.finalScores);
        setGameState('results');
        break;
        
      default:
        console.log('Unhandled event:', event, data);
    }
  }, [lastMessage]);

  const handleAuth = (hostCode) => {
    sendMessage('host_auth', { hostCode });
  };

  const handleStartGame = () => {
    sendMessage('start_game', {});
    setGameState('game');
    setAnswersReceived(0);
  };

  const handleNextQuestion = () => {
    sendMessage('next_question', {});
    setAnswersReceived(0);
    setCurrentQuestion(`Question sent to ${players.length} players`);
  };

  const handleShowResults = () => {
    sendMessage('show_results', {});
  };

  const handleEndGame = () => {
    sendMessage('end_game', {});
  };

  const handleResetGame = () => {
    sendMessage('reset_game', {});
    setGameState('lobby');
    setPlayers([]);
    setCurrentQuestion(null);
    setAnswersReceived(0);
    setFinalScores([]);
  };

  const renderCurrentView = () => {
    if (!isAuthenticated) {
      return <HostAuth onAuth={handleAuth} />;
    }

    switch (gameState) {
      case 'lobby':
        return (
          <GameLobby 
            players={players}
            onStartGame={handleStartGame}
          />
        );
      case 'game':
        return (
          <QuestionControl
            currentQuestion={currentQuestion}
            answersReceived={answersReceived}
            totalPlayers={players.length}
            onNextQuestion={handleNextQuestion}
            onShowResults={handleShowResults}
            onEndGame={handleEndGame}
          />
        );
      case 'results':
        return (
          <Results
            finalScores={finalScores}
            onResetGame={handleResetGame}
          />
        );
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="container">
      <h1 className="text-center">🎯 Trivia Game - Host Dashboard</h1>
      
      <div className="card">
        <div className={`status ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
          {isConnected ? '✅ Connected to server' : '❌ Disconnected from server'}
        </div>
      </div>

      {renderCurrentView()}
    </div>
  );
}

export default App;