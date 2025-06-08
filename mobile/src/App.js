import React, { useState, useEffect } from 'react';
import useWebSocket from './hooks/useWebSocket';
import JoinGame from './components/JoinGame';
import GameLobby from './components/GameLobby';
import QuestionView from './components/QuestionView';
import WaitingScreen from './components/WaitingScreen';
import Results from './components/Results';

function App() {
  // Determine WebSocket URL based on environment
  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // This will use the current host:port
    const wsUrl = `${protocol}//${host}`;
    console.log('WebSocket URL:', wsUrl); // Debug log
    return wsUrl;
  };

  const { isConnected, lastMessage, sendMessage } = useWebSocket(getWebSocketUrl());
  
  const [gameState, setGameState] = useState('join');
  const [playerName, setPlayerName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [scores, setScores] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [hints, setHints] = useState([]);

  // Debug log for game state changes
  useEffect(() => {
    console.log('Game state changed to:', gameState);
  }, [gameState]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log('Mobile received message:', lastMessage);
    const { event, data } = lastMessage;
    
    switch (event) {
      case 'join_confirmed':
        console.log('Join confirmed for player:', data.playerName);
        // Don't change state here - wait for game_state
        break;
        
      case 'game_state':
        console.log('Game state received:', data);
        if (data.state === 'lobby') {
          console.log('Moving to lobby state');
          setGameState('lobby');
          setPlayerCount(data.players ? data.players.length : 0);
        } else if (data.state === 'in_progress') {
          setGameState('waiting'); // Game already started
        }
        break;
        
      case 'question':
        setCurrentQuestion(data.question);
        setTimeLeft(data.timeLimit);
        setSelectedAnswer(null);
        setHints(data.hints || []); // Initialize with any existing hints
        setGameState('question');
        break;
        
      case 'question_results':
        setCorrectAnswer(data.correctAnswer);
        setScores(data.scores);
        setGameState('results');
        break;
        
      case 'final_results':
        setScores(data.finalScores);
        setGameState('final');
        break;
        
      case 'game_reset':
        console.log('Game reset received - returning to join screen');
        setGameState('join');
        setPlayerName('');
        setCurrentQuestion(null);
        setSelectedAnswer(null);
        setTimeLeft(0);
        setPlayerCount(0);
        setScores([]);
        setCorrectAnswer('');
        break;
        
      case 'hint_revealed':
        console.log('New hint revealed:', data.hint);
        setHints(data.allShownHints || []);
        break;
        
      case 'error':
        console.log('Error received:', data.message);
        alert(data.message);
        break;
        
      default:
        console.log('Unhandled mobile event:', event, data);
    }
  }, [lastMessage]);

  const handleJoinGame = (name) => {
    console.log('Attempting to join game with name:', name);
    
    if (!isConnected) {
      alert('Not connected to server. Please wait...');
      return;
    }
    
    setPlayerName(name);
    console.log('Sending join_game message');
    sendMessage('join_game', { playerName: name });
  };

  const handleSubmitAnswer = (answer) => {
    setSelectedAnswer(answer);
    sendMessage('submit_answer', {
      answer: answer,
      timestamp: Date.now()
    });
    setGameState('waiting');
  };

  const renderCurrentView = () => {
    console.log('Rendering mobile view for state:', gameState, 'Connected:', isConnected);
    
    switch (gameState) {
      case 'join':
        return <JoinGame onJoinGame={handleJoinGame} />;
      case 'lobby':
        return (
          <GameLobby 
            playerName={playerName}
            playerCount={playerCount}
          />
        );
      case 'question':
        return (
          <QuestionView
            question={currentQuestion}
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
            onSubmitAnswer={handleSubmitAnswer}
            hints={hints}
          />
        );
      case 'waiting':
        return <WaitingScreen selectedAnswer={selectedAnswer} />;
      case 'results':
        return (
          <Results
            correctAnswer={correctAnswer}
            scores={scores}
            playerName={playerName}
            isFinished={false}
          />
        );
      case 'final':
        return (
          <Results
            correctAnswer=""
            scores={scores}
            playerName={playerName}
            isFinished={true}
          />
        );
      default:
        return (
          <div>
            <div>Loading... (State: {gameState})</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Connected: {isConnected ? 'Yes' : 'No'}<br/>
              Player: {playerName || 'None'}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🎯 Trivia Game</h1>
      </div>
      
      <div className="card">
        <div className={`status ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
          {isConnected ? '✅ Connected to game' : '❌ Connection lost - Reconnecting...'}
        </div>
        {/* Debug info */}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          State: {gameState} | Connected: {isConnected ? 'Yes' : 'No'}
        </div>
      </div>

      {renderCurrentView()}
    </div>
  );
}

export default App;