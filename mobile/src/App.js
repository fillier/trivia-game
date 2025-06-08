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
    const host = process.env.NODE_ENV === 'production' 
      ? window.location.host 
      : 'localhost:3001';
    return `${protocol}//${host}`;
  };

  const { isConnected, lastMessage, sendMessage } = useWebSocket(getWebSocketUrl());
  
  const [gameState, setGameState] = useState('join'); // join, lobby, question, waiting, results, final
  const [playerName, setPlayerName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [scores, setScores] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState('');

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const { event, data } = lastMessage;
    
    switch (event) {
      case 'game_state':
        if (data.state === 'lobby') {
          setGameState('lobby');
          setPlayerCount(data.players.length);
        }
        break;
        
      case 'question':
        setCurrentQuestion(data.question);
        setTimeLeft(data.timeLimit);
        setSelectedAnswer(null);
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
        // Reset all state and return to join screen
        setGameState('join');
        setPlayerName('');
        setCurrentQuestion(null);
        setSelectedAnswer(null);
        setTimeLeft(0);
        setPlayerCount(0);
        setScores([]);
        setCorrectAnswer('');
        break;
        
      case 'error':
        alert(data.message);
        break;
        
      default:
        console.log('Unhandled event:', event, data);
    }
  }, [lastMessage]);

  const handleJoinGame = (name) => {
    setPlayerName(name);
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
        return <div>Loading...</div>;
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
      </div>

      {renderCurrentView()}
    </div>
  );
}

export default App;