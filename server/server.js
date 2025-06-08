const WebSocket = require('ws');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (NODE_ENV === 'production') {
  // Serve dashboard static files
  app.use('/dashboard', express.static(path.join(__dirname, '../dashboard/build')));
  
  // Serve mobile static files  
  app.use('/mobile', express.static(path.join(__dirname, '../mobile/build')));
  
  // Serve dashboard at root
  app.use('/', express.static(path.join(__dirname, '../dashboard/build')));
  
  // Handle client-side routing
  app.get('/dashboard/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dashboard/build/index.html'));
  });
  
  app.get('/mobile/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../mobile/build/index.html'));
  });
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dashboard/build/index.html'));
  });
}

// API routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: NODE_ENV,
    players: gameState.currentGame.players.length,
    gameState: gameState.currentGame.state
  });
});

app.get('/api/game-info', (req, res) => {
  res.json({
    totalQuestions: questions.questions ? questions.questions.length : 0,
    currentQuestion: gameState.currentGame.currentQuestionIndex,
    gameState: gameState.currentGame.state,
    playerCount: gameState.currentGame.players.length
  });
});

// Create HTTP server
const server = require('http').createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Game state
let gameState = {};
let questions = {};
let hostConnection = null;
let playerConnections = new Map();

// Load data files
function loadGameData() {
  try {
    const gameStatePath = path.join(__dirname, '../data/gamestate.json');
    const questionsPath = path.join(__dirname, '../data/questions.json');
    
    gameState = JSON.parse(fs.readFileSync(gameStatePath, 'utf8'));
    questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    
    // Use environment variables for configuration
    gameState.hostCode = process.env.HOST_CODE || 'ADMIN123';
    gameState.gameSettings.questionTimer = parseInt(process.env.QUESTION_TIMER_DEFAULT) || 30;
    
    console.log('Game data loaded successfully');
    console.log(`Host code: ${gameState.hostCode}`);
    console.log(`Question timer: ${gameState.gameSettings.questionTimer}s`);
    console.log(`Total questions: ${questions.questions.length}`);
  } catch (error) {
    console.error('Error loading game data:', error);
  }
}

// Save game state
function saveGameState() {
  try {
    const gameStatePath = path.join(__dirname, '../data/gamestate.json');
    fs.writeFileSync(gameStatePath, JSON.stringify(gameState, null, 2));
  } catch (error) {
    console.error('Error saving game state:', error);
  }
}

// Broadcast to all players
function broadcastToPlayers(event, data) {
  playerConnections.forEach((ws, playerId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    }
  });
}

// Send to host
function sendToHost(event, data) {
  if (hostConnection && hostConnection.readyState === WebSocket.OPEN) {
    hostConnection.send(JSON.stringify({ event, data }));
  }
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const { event, data } = JSON.parse(message);
      
      switch (event) {
        case 'host_auth':
          handleHostAuth(ws, data);
          break;
          
        case 'join_game':
          handlePlayerJoin(ws, data);
          break;
          
        case 'start_game':
          handleStartGame();
          break;
          
        case 'next_question':
          handleNextQuestion();
          break;
          
        case 'submit_answer':
          handleSubmitAnswer(ws, data);
          break;
          
        case 'show_results':
          handleShowResults();
          break;
          
        case 'reset_game':
          handleResetGame();
          break;
          
        case 'end_game':
          handleEndGame();
          break;
          
        default:
          console.log('Unknown event:', event);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    // Handle disconnection
    if (ws === hostConnection) {
      hostConnection = null;
      console.log('Host disconnected');
    } else {
      // Remove player
      for (let [playerId, connection] of playerConnections) {
        if (connection === ws) {
          playerConnections.delete(playerId);
          // Remove from game state
          gameState.currentGame.players = gameState.currentGame.players.filter(
            player => player.id !== playerId
          );
          saveGameState();
          broadcastPlayersUpdate();
          console.log('Player disconnected:', playerId);
          break;
        }
      }
    }
  });
});

// Event handlers
function handleHostAuth(ws, data) {
  if (data.hostCode === gameState.hostCode) {
    hostConnection = ws;
    ws.send(JSON.stringify({
      event: 'host_authenticated',
      data: { success: true }
    }));
    
    // Send current players
    sendToHost('players_update', { players: gameState.currentGame.players });
    console.log('Host authenticated');
  } else {
    ws.send(JSON.stringify({
      event: 'host_authenticated',
      data: { success: false }
    }));
  }
}

function handlePlayerJoin(ws, data) {
  const playerId = uuidv4();
  const player = {
    id: playerId,
    name: data.playerName,
    score: 0
  };
  
  gameState.currentGame.players.push(player);
  playerConnections.set(playerId, ws);
  saveGameState();
  
  // Send game state to new player
  ws.send(JSON.stringify({
    event: 'game_state',
    data: { 
      state: gameState.currentGame.state,
      players: gameState.currentGame.players
    }
  }));
  
  // Update all clients
  broadcastPlayersUpdate();
  console.log('Player joined:', data.playerName);
}

function handleStartGame() {
  gameState.currentGame.state = 'in_progress';
  gameState.currentGame.currentQuestionIndex = 0;
  saveGameState();
  
  console.log('Game started');
}

function handleNextQuestion() {
  const questionIndex = gameState.currentGame.currentQuestionIndex;
  
  if (questionIndex < questions.questions.length) {
    const question = questions.questions[questionIndex];
    gameState.currentGame.questionStartTime = Date.now();
    gameState.currentGame.currentAnswers = [];
    gameState.currentGame.currentQuestionIndex++;
    saveGameState();
    
    broadcastToPlayers('question', { 
      question, 
      timeLimit: gameState.gameSettings.questionTimer 
    });
    
    console.log('Sent question:', question.question);
  } else {
    handleEndGame();
  }
}

function handleSubmitAnswer(ws, data) {
  // Find player
  let playerId = null;
  for (let [id, connection] of playerConnections) {
    if (connection === ws) {
      playerId = id;
      break;
    }
  }
  
  if (!playerId) return;
  
  // Check if already answered
  const existingAnswer = gameState.currentGame.currentAnswers.find(a => a.playerId === playerId);
  if (existingAnswer) return;
  
  // Add answer
  gameState.currentGame.currentAnswers.push({
    playerId,
    answer: data.answer,
    timestamp: data.timestamp
  });
  
  saveGameState();
  
  // Update host
  sendToHost('answers_update', {
    answers: gameState.currentGame.currentAnswers,
    totalPlayers: gameState.currentGame.players.length
  });
}

function handleShowResults() {
  const currentQuestionIndex = gameState.currentGame.currentQuestionIndex - 1;
  const question = questions.questions[currentQuestionIndex];
  
  if (!question) return;
  
  // Calculate scores
  gameState.currentGame.currentAnswers.forEach(answer => {
    if (answer.answer.toLowerCase() === question.correct_answer.toLowerCase()) {
      const player = gameState.currentGame.players.find(p => p.id === answer.playerId);
      if (player) {
        player.score += question.points || 10;
      }
    }
  });
  
  saveGameState();
  
  broadcastToPlayers('question_results', {
    correctAnswer: question.correct_answer,
    scores: gameState.currentGame.players
  });
}

function handleEndGame() {
  gameState.currentGame.state = 'ended';
  saveGameState();
  
  broadcastToPlayers('final_results', { 
    finalScores: gameState.currentGame.players 
  });
  
  sendToHost('game_ended', { 
    finalScores: gameState.currentGame.players 
  });
  
  console.log('Game ended');
}

function handleResetGame() {
  gameState.currentGame = {
    state: 'lobby',
    currentQuestionIndex: 0,
    questionStartTime: null,
    players: [],
    currentAnswers: []
  };
  
  saveGameState();
  
  // Clear player connections but keep them connected
  playerConnections.clear();
  
  // Broadcast reset to all players
  broadcastToPlayers('game_reset', {});
  
  // Update host
  sendToHost('players_update', { players: [] });
  
  console.log('Game reset');
}

function broadcastPlayersUpdate() {
  sendToHost('players_update', { players: gameState.currentGame.players });
}

// Start server
loadGameData();

server.listen(PORT, () => {
  console.log(`🎯 Trivia Game Server running on port ${PORT}`);
  console.log(`📱 Environment: ${NODE_ENV}`);
  
  if (NODE_ENV === 'production') {
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
    console.log(`📱 Mobile: http://localhost:${PORT}/mobile`);
  } else {
    console.log(`🌐 Dashboard: http://localhost:3000`);
    console.log(`📱 Mobile: http://localhost:3002`);
  }
  
  console.log(`🔌 WebSocket server ready for connections`);
});