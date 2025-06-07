# Technical Design Document: Real-Time Trivia Game

## 1. Overview

A real-time multiplayer trivia game where mobile devices connect to a central server via WebSockets. A host controls the game flow through a web dashboard, while players participate using web-based mobile clients.

## 2. Architecture

### 2.1 System Components
- **Node.js WebSocket Server**: Central game server handling all real-time communication
- **React Web Dashboard**: Host/admin interface for game control
- **Mobile Web Clients**: Player interfaces (responsive web apps)
- **JSON Data Store**: File-based storage for questions and game state

### 2.2 Communication Flow
```
[Mobile Clients] <-- WebSocket --> [Node.js Server] <-- WebSocket --> [React Dashboard]
                                        |
                                   [JSON Files]
```

## 3. Data Models

### 3.1 Question Structure (questions.json)
```json
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correct_answer": "Paris"
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "The Earth is flat.",
      "correct_answer": "false"
    },
    {
      "id": 3,
      "type": "text_input",
      "question": "What year did World War II end?",
      "correct_answer": "1945"
    }
  ]
}
```

### 3.2 Game State Structure (gamestate.json)
```json
{
  "hostCode": "ADMIN123",
  "gameSettings": {
    "questionTimer": 30,
    "showScores": true
  },
  "currentGame": {
    "state": "lobby|in_progress|ended",
    "currentQuestionIndex": 0,
    "questionStartTime": null,
    "players": [
      {
        "id": "player_uuid",
        "name": "PlayerName",
        "score": 0,
        "connected": true
      }
    ],
    "currentAnswers": [
      {
        "playerId": "player_uuid",
        "answer": "Paris",
        "timestamp": 1234567890
      }
    ]
  }
}
```

## 4. WebSocket Events

### 4.1 Client to Server Events

#### Player Events
- `join_game`: `{ playerName: string }`
- `submit_answer`: `{ answer: string, timestamp: number }`
- `disconnect`: Auto-handled

#### Host Events
- `host_auth`: `{ hostCode: string }`
- `start_game`: `{}`
- `next_question`: `{}`
- `show_results`: `{}`
- `reset_game`: `{}`

### 4.2 Server to Client Events

#### To Players
- `game_state`: `{ state: "lobby|in_progress|ended", players: Player[] }`
- `question`: `{ question: Question, timeLimit: number }`
- `question_results`: `{ correctAnswer: string, scores: PlayerScore[] }`
- `final_results`: `{ finalScores: PlayerScore[] }`
- `error`: `{ message: string }`

#### To Host
- `players_update`: `{ players: Player[] }`
- `answers_update`: `{ answers: Answer[], totalPlayers: number }`
- `host_authenticated`: `{ success: boolean }`

## 5. Server Implementation (Node.js)

### 5.1 Core Dependencies
```json
{
  "dependencies": {
    "ws": "^8.x",
    "express": "^4.x",
    "uuid": "^9.x",
    "cors": "^2.x"
  }
}
```

### 5.2 Server Structure
```
src/
├── server.js              # Main server file
├── gameManager.js         # Game state management
├── questionManager.js     # Question loading/management
├── playerManager.js       # Player connection handling
├── hostManager.js         # Host authentication/control
└── data/
    ├── questions.json     # Question database
    └── gamestate.json     # Current game state
```

### 5.3 Key Server Functions

#### Game State Management
- Load/save game state to JSON
- Validate host authentication
- Manage player connections
- Handle question progression
- Calculate scores

#### WebSocket Handling
- Connection management for players and host
- Event routing and validation
- Broadcast game updates
- Handle disconnections gracefully

## 6. Frontend Implementation

### 6.1 React Host Dashboard

#### Components Structure
```
src/
├── components/
│   ├── HostAuth.jsx       # Host code entry
│   ├── GameLobby.jsx      # Pre-game player list
│   ├── QuestionControl.jsx # Question display and controls
│   ├── AnswerMonitor.jsx  # Real-time answer tracking
│   └── Results.jsx        # Score display and game reset
├── hooks/
│   └── useWebSocket.js    # WebSocket connection hook
└── App.jsx                # Main dashboard container
```

#### Key Features
- Host authentication with code
- Real-time player list in lobby
- Question display with manual progression
- Live answer submission monitoring
- Score display and game reset controls

### 6.2 Mobile Web Client

#### Components Structure
```
src/
├── components/
│   ├── JoinGame.jsx       # Player name entry
│   ├── GameLobby.jsx      # Waiting room
│   ├── QuestionView.jsx   # Question display and answer input
│   ├── WaitingScreen.jsx  # Between questions
│   └── Results.jsx        # Final scores
├── hooks/
│   └── useWebSocket.js    # WebSocket connection hook
└── App.jsx                # Main game container
```

#### Responsive Design
- Mobile-first CSS design
- Touch-friendly interface
- Auto-scaling text and buttons
- Optimized for various screen sizes

## 7. Game Flow

### 7.1 Game States
1. **Lobby**: Players join, host sees player list
2. **In Progress**: Questions are presented, answers collected
3. **Question Results**: Show correct answer and current scores
4. **Final Results**: Show final leaderboard
5. **Reset**: Return to lobby for new game

### 7.2 Detailed Flow
1. Host authenticates with dashboard
2. Players join via mobile devices (enter names)
3. Host sees player list, starts game when ready
4. For each question:
   - Host advances to next question
   - Question sent to all players with timer
   - Players submit answers
   - Timer expires or host shows results
   - Display correct answer and updated scores
5. After final question, show final leaderboard
6. Host can reset game to return to lobby

## 8. Error Handling

### 8.1 Connection Issues
- Automatic reconnection attempts for players
- Host disconnection pauses game state
- Player disconnection removes from active game

### 8.2 Game State Validation
- Prevent players joining mid-game
- Validate answer submissions against current question
- Handle malformed WebSocket messages gracefully

### 8.3 Data Integrity
- Backup game state before modifications
- Validate JSON structure on server startup
- Handle missing or corrupted question files

## 9. Configuration

### 9.1 Environment Variables
```
PORT=3001
HOST_CODE=ADMIN123
QUESTION_TIMER_DEFAULT=30
MAX_PLAYERS=50
```

### 9.2 Game Settings (configurable in gamestate.json)
- Question timer duration
- Host authentication code
- Score display preferences
- Maximum player limits

## 10. Deployment Considerations

### 10.1 File Structure
```
voting-game/
├── server/                # Node.js backend
├── dashboard/             # React host interface
├── mobile/                # Mobile web client
├── data/                  # JSON data files
└── docs/                  # Documentation
```

### 10.2 Production Setup
- Serve React apps as static files through Express
- Configure WebSocket connection URLs for environment
- Set up process management (PM2) for server
- Configure reverse proxy (nginx) if needed

This technical design provides a complete blueprint for implementing the real-time trivia game with all specified features and requirements.