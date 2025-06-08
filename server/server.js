const WebSocket = require('ws');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

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
    
    console.log('Game data loaded successfully');
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
    console.log('Host authenticated');
    
    // Send current game state to host
    sendToHost('players_update', { players: gameState.currentGame.players });
  } else {
    ws.send(JSON.stringify({ 
      event: 'host_authenticated', 
      data: { success: false } 
    }));
  }
}

function handlePlayerJoin(ws, data) {
  if (gameState.currentGame.state !== 'lobby') {
    ws.send(JSON.stringify({ 
      event: 'error', 
      data: { message: 'Game is in progress' } 
    }));
    return;
  }

  const playerId = uuidv4();
  const player = {
    id: playerId,
    name: data.playerName,
    score: 0,
    connected: true
  };

  gameState.currentGame.players.push(player);
  playerConnections.set(playerId, ws);
  
  saveGameState();
  
  // Send game state to player
  ws.send(JSON.stringify({ 
    event: 'game_state', 
    data: { 
      state: gameState.currentGame.state, 
      players: gameState.currentGame.players 
    } 
  }));
  
  broadcastPlayersUpdate();
  console.log('Player joined:', data.playerName);
}

function handleStartGame() {
  gameState.currentGame.state = 'in_progress';
  gameState.currentGame.currentQuestionIndex = 0;
  saveGameState();
  
  broadcastToPlayers('game_state', { 
    state: 'in_progress', 
    players: gameState.currentGame.players 
  });
  
  console.log('Game started');
}

function handleNextQuestion() {
  const questionIndex = gameState.currentGame.currentQuestionIndex;
  
  if (questionIndex < questions.questions.length) {
    const question = questions.questions[questionIndex];
    gameState.currentGame.questionStartTime = Date.now();
    gameState.currentGame.currentAnswers = [];
    saveGameState();
    
    broadcastToPlayers('question', { 
      question, 
      timeLimit: gameState.gameSettings.questionTimer 
    });
    
    console.log('Sent question:', question.question);
  } else {
    // Game ended - show final results
    gameState.currentGame.state = 'ended';
    saveGameState();
    
    broadcastToPlayers('final_results', { 
      finalScores: gameState.currentGame.players 
    });
    
    // Send game_ended event to host
    sendToHost('game_ended', { 
      finalScores: gameState.currentGame.players 
    });
    
    console.log('Game ended - final results sent');
  }
}

function handleSubmitAnswer(ws, data) {
  // Find player ID from connection
  let playerId = null;
  for (let [id, connection] of playerConnections) {
    if (connection === ws) {
      playerId = id;
      break;
    }
  }
  
  if (!playerId) return;
  
  // Check if answer already submitted
  const existingAnswer = gameState.currentGame.currentAnswers.find(
    answer => answer.playerId === playerId
  );
  
  if (existingAnswer) return;
  
  // Add answer
  gameState.currentGame.currentAnswers.push({
    playerId,
    answer: data.answer,
    timestamp: data.timestamp
  });
  
  saveGameState();
  
  // Update host with answer count
  sendToHost('answers_update', {
    answers: gameState.currentGame.currentAnswers,
    totalPlayers: gameState.currentGame.players.length
  });
  
  console.log('Answer submitted by player:', playerId);
}

function handleShowResults() {
  const currentQuestion = questions.questions[gameState.currentGame.currentQuestionIndex];
  
  // Calculate scores
  gameState.currentGame.currentAnswers.forEach(answer => {
    const player = gameState.currentGame.players.find(p => p.id === answer.playerId);
    if (player && isCorrectAnswer(answer.answer, currentQuestion.correct_answer)) {
      player.score += 1;
    }
  });
  
  gameState.currentGame.currentQuestionIndex += 1;
  saveGameState();
  
  broadcastToPlayers('question_results', {
    correctAnswer: currentQuestion.correct_answer,
    scores: gameState.currentGame.players
  });
  
  console.log('Results shown for question:', currentQuestion.question);
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
  
  // Broadcast reset to all players - they should return to join screen
  broadcastToPlayers('game_reset', {});
  
  // Update host
  sendToHost('players_update', { players: [] });
  
  console.log('Game reset - all players cleared');
}

function handleEndGame() {
  gameState.currentGame.state = 'ended';
  saveGameState();
  
  broadcastToPlayers('final_results', { 
    finalScores: gameState.currentGame.players 
  });
  
  // Send game_ended event to host
  sendToHost('game_ended', { 
    finalScores: gameState.currentGame.players 
  });
  
  console.log('Game manually ended by host');
}

function broadcastPlayersUpdate() {
  sendToHost('players_update', { players: gameState.currentGame.players });
}

function isCorrectAnswer(playerAnswer, correctAnswer) {
  return playerAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
}

// Start server
loadGameData();

server.listen(PORT, () => {
  console.log(`Trivia game server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});