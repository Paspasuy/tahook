import { Server, Socket } from "socket.io";
import { gameManager } from "./GameManager";
import { authService } from "../services/AuthService";
import { quizService } from "../services/QuizService";
import { resultService, PlayerScore } from "../services/ResultService";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

// Socket events:
// Client -> Server:
//   - create_room: { quizId: string } -> { code: string } or { error: string }
//   - join_room: { code: string } -> { success: boolean, quizTitle?: string } or { error: string }
//   - start_quiz: {} -> broadcasts quiz_started
//   - next_question: {} -> broadcasts question
//   - submit_answer: { answerIds: string[] } -> { accepted: boolean }
//   - show_results: {} -> broadcasts question_results
//   - end_quiz: {} -> broadcasts quiz_ended, saves results
//
// Server -> Client:
//   - player_joined: { userId: string, userName: string, playerCount: number }
//   - player_left: { userId: string, userName: string, playerCount: number }
//   - quiz_started: {}
//   - question: { question: QuestionForPlayerResponse, questionNumber: number, totalQuestions: number }
//   - answer_count: { answered: number, total: number }
//   - question_results: { correctAnswers: string[], playerResults: [...], leaderboard: [...] }
//   - quiz_ended: { leaderboard: [...] }
//   - error: { message: string }

export function setupSocketHandlers(io: Server): void {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = authService.verifyToken(token);
      socket.userId = decoded.userId;
      socket.userName = decoded.name;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userName} (${socket.id})`);

    // Create a new game room
    socket.on("create_room", async (data: { quizId: string }, callback) => {
      try {
        const quiz = await quizService.getQuizById(data.quizId);
        if (!quiz) {
          callback({ error: "Quiz not found" });
          return;
        }

        if (quiz.ownerId !== socket.userId) {
          callback({ error: "You don't own this quiz" });
          return;
        }

        if (!quiz.isPublished) {
          callback({ error: "Quiz must be published first" });
          return;
        }

        const room = gameManager.createRoom(
          quiz.id,
          quiz.title,
          socket.userId!,
          quiz.questions
        );
        room.setOwnerSocket(socket.id);
        gameManager.joinRoom(room.state.code, socket.id);
        socket.join(room.state.code);

        callback({ code: room.state.code });
        console.log(`Room created: ${room.state.code} for quiz: ${quiz.title}`);
      } catch (error) {
        callback({ error: "Failed to create room" });
      }
    });

    // Join an existing room
    socket.on("join_room", (data: { code: string }, callback) => {
      try {
        const room = gameManager.getRoom(data.code);
        if (!room) {
          callback({ error: "Room not found" });
          return;
        }

        if (room.state.isStarted) {
          callback({ error: "Quiz has already started" });
          return;
        }

        // Check if user is already in the room
        const existingPlayer = room.getPlayerByUserId(socket.userId!);
        if (existingPlayer) {
          callback({ error: "You are already in this room" });
          return;
        }

        // Don't allow owner to join as player
        if (room.state.ownerId === socket.userId) {
          callback({ error: "Quiz owner cannot join as player" });
          return;
        }

        room.addPlayer(socket.userId!, socket.userName!, socket.id);
        gameManager.joinRoom(data.code, socket.id);
        socket.join(data.code.toUpperCase());

        // Notify all in room
        io.to(data.code.toUpperCase()).emit("player_joined", {
          userId: socket.userId,
          userName: socket.userName,
          playerCount: room.getPlayerCount(),
          players: room.getPlayerList(),
        });

        callback({
          success: true,
          quizTitle: room.state.quizTitle,
          players: room.getPlayerList(),
        });
        console.log(`${socket.userName} joined room ${data.code}`);
      } catch (error) {
        callback({ error: "Failed to join room" });
      }
    });

    // Start the quiz (owner only)
    socket.on("start_quiz", (callback) => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (!room) {
        callback?.({ error: "Not in a room" });
        return;
      }

      if (room.state.ownerId !== socket.userId) {
        callback?.({ error: "Only the owner can start the quiz" });
        return;
      }

      if (room.getPlayerCount() === 0) {
        callback?.({ error: "No players have joined" });
        return;
      }

      const started = room.startQuiz();
      if (!started) {
        callback?.({ error: "Quiz has already started or has no questions" });
        return;
      }

      io.to(room.state.code).emit("quiz_started", {
        totalQuestions: room.state.questions.length,
      });

      callback?.({ success: true });
      console.log(`Quiz started in room ${room.state.code}`);
    });

    // Next question (owner only)
    socket.on("next_question", (callback) => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (!room) {
        callback?.({ error: "Not in a room" });
        return;
      }

      if (room.state.ownerId !== socket.userId) {
        callback?.({ error: "Only the owner can advance questions" });
        return;
      }

      if (!room.state.isStarted) {
        callback?.({ error: "Quiz has not started" });
        return;
      }

      const question = room.nextQuestion();
      if (!question) {
        // Quiz finished
        callback?.({ finished: true });
        return;
      }

      const questionForPlayer = room.getCurrentQuestionForPlayer();
      io.to(room.state.code).emit("question", {
        question: questionForPlayer,
        questionNumber: room.state.currentQuestionIndex + 1,
        totalQuestions: room.state.questions.length,
      });

      callback?.({ success: true, questionNumber: room.state.currentQuestionIndex + 1 });
      console.log(
        `Question ${room.state.currentQuestionIndex + 1} sent in room ${room.state.code}`
      );
    });

    // Submit answer (player)
    socket.on("submit_answer", (data: { answerIds: string[] }, callback) => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (!room) {
        callback?.({ error: "Not in a room" });
        return;
      }

      if (room.state.ownerId === socket.userId) {
        callback?.({ error: "Owner cannot submit answers" });
        return;
      }

      const accepted = room.submitAnswer(socket.id, data.answerIds);
      callback?.({ accepted });

      if (accepted) {
        // Notify owner about answer count
        if (room.state.ownerSocketId) {
          io.to(room.state.ownerSocketId).emit("answer_count", {
            answered: room.getAnsweredCount(),
            total: room.getPlayerCount(),
          });
        }

        console.log(
          `${socket.userName} submitted answer in room ${room.state.code}`
        );
      }
    });

    // Show results for current question (owner only)
    socket.on("show_results", async (callback) => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (!room) {
        callback?.({ error: "Not in a room" });
        return;
      }

      if (room.state.ownerId !== socket.userId) {
        callback?.({ error: "Only the owner can show results" });
        return;
      }

      // Calculate scores (now handles immediate updates, but we keep the call for safety)
      // room.calculateScores(); // logic moved to submit_answer

      const results = room.getQuestionResults();
      const leaderboard = room.getLeaderboard();

      // Save intermediate results to database
      try {
        const playerScores: PlayerScore[] = room.getFinalResults();
        await resultService.saveResults(room.state.quizId, playerScores);
      } catch (error) {
        console.error("Failed to save intermediate results:", error);
      }

      io.to(room.state.code).emit("question_results", {
        ...results,
        leaderboard,
      });

      callback?.({ success: true });
      console.log(`Results shown in room ${room.state.code}`);
    });

    // End quiz and save results (owner only)
    socket.on("end_quiz", async (callback) => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (!room) {
        callback?.({ error: "Not in a room" });
        return;
      }

      if (room.state.ownerId !== socket.userId) {
        callback?.({ error: "Only the owner can end the quiz" });
        return;
      }

      const leaderboard = room.getLeaderboard();

      // Save results to database
      try {
        const playerScores: PlayerScore[] = room.getFinalResults();
        await resultService.saveResults(room.state.quizId, playerScores);
        console.log(`Results saved for quiz ${room.state.quizId}`);
      } catch (error) {
        console.error("Failed to save results:", error);
      }

      io.to(room.state.code).emit("quiz_ended", {
        leaderboard,
        quizId: room.state.quizId,
      });

      // Clean up
      gameManager.deleteRoom(room.state.code);

      callback?.({ success: true, leaderboard });
      console.log(`Quiz ended in room ${room.state.code}`);
    });

    // Get current room state (for reconnection)
    socket.on("get_room_state", (callback) => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (!room) {
        callback?.({ error: "Not in a room" });
        return;
      }

      callback?.({
        code: room.state.code,
        quizTitle: room.state.quizTitle,
        isStarted: room.state.isStarted,
        isFinished: room.state.isFinished,
        currentQuestionIndex: room.state.currentQuestionIndex,
        totalQuestions: room.state.questions.length,
        players: room.getPlayerList(),
        isOwner: room.state.ownerId === socket.userId,
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const room = gameManager.getRoomBySocketId(socket.id);
      if (room) {
        const player = room.removePlayer(socket.id);
        if (player) {
          io.to(room.state.code).emit("player_left", {
            userId: player.userId,
            userName: player.userName,
            playerCount: room.getPlayerCount(),
          });
          console.log(`${socket.userName} left room ${room.state.code}`);
        }

        // If owner disconnects and quiz hasn't started, delete room
        if (room.state.ownerId === socket.userId && !room.state.isStarted) {
          io.to(room.state.code).emit("room_closed", {
            reason: "Owner disconnected",
          });
          gameManager.deleteRoom(room.state.code);
          console.log(`Room ${room.state.code} closed (owner left)`);
        }
      }

      gameManager.leaveRoom(socket.id);
      console.log(`User disconnected: ${socket.userName} (${socket.id})`);
    });
  });
}
