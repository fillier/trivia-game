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

// Set proper MIME types
express.static.mime.define({
  'application/javascript': ['js'],
  'text/css': ['css'],
  'text/html': ['html']
});

// Serve static files in production
if (NODE_ENV === 'production') {
  const dashboardBuildPath = path.join(__dirname, '../dashboard/build');
  const mobileBuildPath = path.join(__dirname, '../mobile/build');
  
  console.log('Checking build paths:');
  console.log('Dashboard build path:', dashboardBuildPath, 'exists:', fs.existsSync(dashboardBuildPath));
  console.log('Mobile build path:', mobileBuildPath, 'exists:', fs.existsSync(mobileBuildPath));
  
  // Serve ALL mobile files under /mobile path
  if (fs.existsSync(mobileBuildPath)) {
    app.use('/mobile', express.static(mobileBuildPath, {
      index: false,  // Don't auto-serve index.html for directories
      fallthrough: true
    }));
    console.log('✅ Mobile static files configured at /mobile');
  }
  
  // Serve ALL dashboard files at root (but not index.html automatically)
  if (fs.existsSync(dashboardBuildPath)) {
    app.use('/', express.static(dashboardBuildPath, {
      index: false,  // Don't auto-serve index.html for directories
      fallthrough: true
    }));
    console.log('✅ Dashboard static files configured at /');
  }
  
  // Explicit HTML routes AFTER static file serving
  app.get('/mobile', (req, res) => {
    console.log('Serving mobile index.html');
    res.sendFile(path.join(mobileBuildPath, 'index.html'));
  });
  
  app.get('/mobile/*', (req, res) => {
    console.log('Serving mobile index.html for path:', req.path);
    res.sendFile(path.join(mobileBuildPath, 'index.html'));
  });
  
  app.get('/', (req, res) => {
    console.log('Serving dashboard index.html');
    res.sendFile(path.join(dashboardBuildPath, 'index.html'));
  });
  
} else {
  console.log('Running in development mode - static files not served');
}

// API routes (make sure these come AFTER static files but BEFORE catch-all)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: NODE_ENV,
    players: gameState.currentGame ? gameState.currentGame.players.length : 0,
    gameState: gameState.currentGame ? gameState.currentGame.state : 'unknown'
  });
});

app.get('/api/game-info', (req, res) => {
  res.json({
    totalQuestions: questions.questions ? questions.questions.length : 0,
    currentQuestion: gameState.currentGame ? gameState.currentGame.currentQuestionIndex : 0,
    gameState: gameState.currentGame ? gameState.currentGame.state : 'unknown',
    playerCount: gameState.currentGame ? gameState.currentGame.players.length : 0
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
  console.log('Host authentication attempt with code:', data.hostCode);
  console.log('Expected code:', gameState.hostCode);
  
  if (data.hostCode === gameState.hostCode) {
    hostConnection = ws;
    const response = {
      event: 'host_authenticated',
      data: { success: true }
    };
    console.log('Sending successful auth response:', response);
    ws.send(JSON.stringify(response));
    
    // Send current players immediately after authentication
    setTimeout(() => {
      sendToHost('players_update', { players: gameState.currentGame.players });
    }, 100);
    
    console.log('Host authenticated successfully');
  } else {
    const response = {
      event: 'host_authenticated',
      data: { success: false }
    };
    console.log('Sending failed auth response:', response);
    ws.send(JSON.stringify(response));
    console.log('Host authentication failed - invalid code');
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
  
  console.log('Player joined:', data.playerName, 'ID:', playerId);
  
  // Send game state to new player (this is what was missing!)
  ws.send(JSON.stringify({
    event: 'game_state',
    data: { 
      state: gameState.currentGame.state,
      players: gameState.currentGame.players,
      playerCount: gameState.currentGame.players.length
    }
  }));
  
  // Also send a join confirmation
  ws.send(JSON.stringify({
    event: 'join_confirmed',
    data: {
      playerId: playerId,
      playerName: data.playerName
    }
  }));
  
  // Update host and other clients
  broadcastPlayersUpdate();
  
  console.log('Game state sent to new player');
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
  console.log('Resetting game...');
  
  // Store current player connections before clearing
  const currentPlayerConnections = new Map(playerConnections);
  
  gameState.currentGame = {
    state: 'lobby',
    currentQuestionIndex: 0,
    questionStartTime: null,
    players: [],
    currentAnswers: []
  };
  
  saveGameState();
  
  // Send reset to all currently connected players
  console.log(`Sending reset to ${currentPlayerConnections.size} players`);
  currentPlayerConnections.forEach((ws, playerId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'game_reset',
        data: {}
      }));
      console.log(`Reset sent to player: ${playerId}`);
    }
  });
  
  // Clear player connections after sending reset
  playerConnections.clear();
  
  // Update host with empty players list
  sendToHost('players_update', { players: [] });
  
  // Send explicit reset confirmation to host
  setTimeout(() => {
    sendToHost('game_reset_complete', {});
  }, 100);
  
  console.log('Game reset complete - all players notified');
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