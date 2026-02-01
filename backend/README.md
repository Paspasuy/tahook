# Tahook Backend

Node.js backend for a Kahoot-like quiz game with real-time WebSocket support.

## Environment Variables

Create a `.env` file with the following variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=tahook
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:5173
```

## Setup

### Docker Compose (recommended)

From repo root:

```bash
docker compose up --build
```

The backend will be available at `http://localhost:3000` and PostgreSQL at `localhost:5432`.

### Local

1. Install dependencies:
```bash
npm install
```

2. Create PostgreSQL database:
```bash
createdb tahook
```

3. Run migrations:
```bash
npm run migration:run
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

### Quizzes
- `GET /api/quizzes` - Get all published quizzes
- `GET /api/quizzes/my` - Get current user's quizzes (requires auth)
- `GET /api/quizzes/:id` - Get quiz with questions
- `POST /api/quizzes` - Create quiz (requires auth)
- `PUT /api/quizzes/:id` - Update quiz (requires auth)
- `POST /api/quizzes/:id/publish` - Publish quiz (requires auth)
- `DELETE /api/quizzes/:id` - Delete quiz (requires auth)

### Questions
- `GET /api/questions/quiz/:quizId` - Get questions for quiz
- `GET /api/questions/:id` - Get single question
- `POST /api/questions` - Create question (requires auth)
- `PUT /api/questions/:id` - Update question (requires auth)
- `DELETE /api/questions/:id` - Delete question (requires auth)
- `POST /api/questions/reorder` - Reorder questions (requires auth)

### Results
- `GET /api/results/quiz/:quizId` - Get leaderboard for quiz
- `GET /api/results/my` - Get current user's results (requires auth)
- `GET /api/results/:quizId` - Get user's result for specific quiz (requires auth)

## WebSocket Events

Connect with auth token in handshake:
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});
```

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ quizId }` | Create game room (owner only) |
| `join_room` | `{ code }` | Join game room by code |
| `start_quiz` | `{}` | Start the quiz (owner only) |
| `next_question` | `{}` | Show next question (owner only) |
| `submit_answer` | `{ answerIds: string[] }` | Submit answer (players) |
| `show_results` | `{}` | Show question results (owner only) |
| `end_quiz` | `{}` | End quiz and save results (owner only) |
| `get_room_state` | `{}` | Get current room state |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `player_joined` | `{ userId, userName, playerCount, players }` | Player joined room |
| `player_left` | `{ userId, userName, playerCount }` | Player left room |
| `quiz_started` | `{ totalQuestions }` | Quiz has started |
| `question` | `{ question, questionNumber, totalQuestions }` | New question |
| `answer_count` | `{ answered, total }` | Answer progress (owner only) |
| `question_results` | `{ correctAnswers, playerResults, leaderboard }` | Question results |
| `quiz_ended` | `{ leaderboard, quizId }` | Quiz finished |
| `room_closed` | `{ reason }` | Room was closed |
| `error` | `{ message }` | Error occurred |

## Game Flow

1. **Owner creates room:**
   - Owner calls `create_room` with published quiz ID
   - Gets room code to share with players

2. **Players join:**
   - Players call `join_room` with room code
   - All participants see `player_joined` events

3. **Quiz starts:**
   - Owner calls `start_quiz`
   - All receive `quiz_started` event

4. **For each question:**
   - Owner calls `next_question` → all receive `question`
   - Players call `submit_answer` with their choices
   - Owner sees `answer_count` updates
   - Owner calls `show_results` → all receive `question_results`

5. **Quiz ends:**
   - Owner calls `end_quiz` (or `next_question` returns `finished: true`)
   - Results saved to database
   - All receive `quiz_ended` with final leaderboard

## Project Structure

```
src/
├── config/
│   └── database.ts       # TypeORM configuration
├── middleware/
│   └── auth.ts           # JWT authentication middleware
├── migrations/
│   └── *.ts              # Database migrations
├── models/
│   ├── api/              # Request/Response DTOs
│   │   ├── User.ts
│   │   ├── Quiz.ts
│   │   ├── Question.ts
│   │   └── Result.ts
│   └── orm/              # TypeORM entities
│       ├── User.ts
│       ├── Quiz.ts
│       ├── Question.ts
│       └── Result.ts
├── routes/               # Express route handlers
│   ├── auth.ts
│   ├── quiz.ts
│   ├── question.ts
│   └── result.ts
├── services/             # Business logic
│   ├── AuthService.ts
│   ├── QuizService.ts
│   ├── QuestionService.ts
│   └── ResultService.ts
├── websocket/            # Real-time game logic
│   ├── GameRoom.ts       # Game room state management
│   ├── GameManager.ts    # Room creation/lookup
│   └── SocketHandler.ts  # Socket.io event handlers
└── index.ts              # Application entry point
```
