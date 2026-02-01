import { Question, QuestionType } from "../models/orm/Question";
import { QuestionForPlayerResponse } from "../models/api/Question";
import { questionService } from "../services/QuestionService";

export interface Player {
  userId: string;
  userName: string;
  socketId: string;
  score: number;
  currentAnswer: string[] | null;
  answerTime: number | null;
}

export interface GameRoomState {
  code: string;
  quizId: string;
  quizTitle: string;
  ownerId: string;
  ownerSocketId: string | null;
  players: Map<string, Player>;
  questions: Question[];
  currentQuestionIndex: number;
  isStarted: boolean;
  isFinished: boolean;
  questionStartTime: number | null;
}

export class GameRoom {
  public state: GameRoomState;
  private scores: Map<string, number> = new Map(); // userId -> score

  constructor(
    code: string,
    quizId: string,
    quizTitle: string,
    ownerId: string,
    questions: Question[]
  ) {
    this.state = {
      code,
      quizId,
      quizTitle,
      ownerId,
      ownerSocketId: null,
      players: new Map(),
      questions: questions.sort((a, b) => a.index - b.index),
      currentQuestionIndex: -1,
      isStarted: false,
      isFinished: false,
      questionStartTime: null,
    };
  }

  setOwnerSocket(socketId: string): void {
    this.state.ownerSocketId = socketId;
  }

  addPlayer(userId: string, userName: string, socketId: string): Player {
    const player: Player = {
      userId,
      userName,
      socketId,
      score: this.scores.get(userId) || 0,
      currentAnswer: null,
      answerTime: null,
    };
    this.state.players.set(socketId, player);
    if (!this.scores.has(userId)) {
      this.scores.set(userId, 0);
    }
    return player;
  }

  removePlayer(socketId: string): Player | undefined {
    const player = this.state.players.get(socketId);
    this.state.players.delete(socketId);
    return player;
  }

  getPlayer(socketId: string): Player | undefined {
    return this.state.players.get(socketId);
  }

  getPlayerByUserId(userId: string): Player | undefined {
    for (const player of this.state.players.values()) {
      if (player.userId === userId) {
        return player;
      }
    }
    return undefined;
  }

  getPlayerList(): { userId: string; userName: string; score: number }[] {
    return Array.from(this.state.players.values()).map((p) => ({
      userId: p.userId,
      userName: p.userName,
      score: p.score,
    }));
  }

  startQuiz(): boolean {
    if (this.state.isStarted || this.state.questions.length === 0) {
      return false;
    }
    this.state.isStarted = true;
    return true;
  }

  getCurrentQuestion(): Question | null {
    if (
      this.state.currentQuestionIndex < 0 ||
      this.state.currentQuestionIndex >= this.state.questions.length
    ) {
      return null;
    }
    return this.state.questions[this.state.currentQuestionIndex];
  }

  getCurrentQuestionForPlayer(): QuestionForPlayerResponse | null {
    const question = this.getCurrentQuestion();
    if (!question) return null;
    return questionService.toQuestionForPlayer(question);
  }

  nextQuestion(): Question | null {
    this.state.currentQuestionIndex++;

    // Reset all player answers for new question
    for (const player of this.state.players.values()) {
      player.currentAnswer = null;
      player.answerTime = null;
    }

    if (this.state.currentQuestionIndex >= this.state.questions.length) {
      this.state.isFinished = true;
      return null;
    }

    this.state.questionStartTime = Date.now();
    return this.state.questions[this.state.currentQuestionIndex];
  }

  submitAnswer(socketId: string, answerIds: string[]): boolean {
    const player = this.state.players.get(socketId);
    if (!player || player.currentAnswer !== null) {
      return false; // Player not found or already answered
    }

    const question = this.getCurrentQuestion();
    if (!question || !this.state.questionStartTime) {
      return false;
    }

    const answerTime = Date.now() - this.state.questionStartTime;
    player.currentAnswer = answerIds;
    player.answerTime = answerTime;

    // Calculate score immediately on submission
    const correctOptionIds = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);

    let isCorrect = false;
    if (question.type === QuestionType.SINGLE_CHOICE) {
      isCorrect =
        answerIds.length === 1 && correctOptionIds.includes(answerIds[0]);
    } else {
      const selectedSet = new Set(answerIds);
      const correctSet = new Set(correctOptionIds);
      isCorrect =
        selectedSet.size === correctSet.size &&
        [...selectedSet].every((id) => correctSet.has(id));
    }

    if (isCorrect) {
      const timeLimitMs = question.timeLimitSeconds * 1000;
      const speedBonus = Math.max(0, 1 - answerTime / timeLimitMs);
      const baseScore = question.points * 0.5;
      const bonusScore = question.points * 0.5 * speedBonus;
      const pointsToAdd = Math.round(baseScore + bonusScore);

      player.score += pointsToAdd;
      this.scores.set(player.userId, player.score);
    }

    return true;
  }

  calculateScores(): void {
    // Logic moved to submitAnswer for immediate updates
  }

  getQuestionResults(): {
    correctAnswers: string[];
    playerResults: {
      userId: string;
      userName: string;
      answered: boolean;
      correct: boolean;
      score: number;
    }[];
  } | null {
    const question = this.getCurrentQuestion();
    if (!question) return null;

    const correctOptionIds = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);

    const playerResults = Array.from(this.state.players.values()).map(
      (player) => {
        const question = this.getCurrentQuestion();
        const correctOptionIds = question?.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.id) || [];

        let correct = false;
        if (player.currentAnswer) {
          if (question?.type === QuestionType.SINGLE_CHOICE) {
            correct =
              player.currentAnswer.length === 1 &&
              correctOptionIds.includes(player.currentAnswer[0]);
          } else {
            const selectedSet = new Set(player.currentAnswer);
            const correctSet = new Set(correctOptionIds);
            correct =
              selectedSet.size === correctSet.size &&
              [...selectedSet].every((id) => correctSet.has(id));
          }
        }

        return {
          userId: player.userId,
          userName: player.userName,
          answered: player.currentAnswer !== null,
          correct,
          score: player.score,
        };
      }
    );

    return {
      correctAnswers: correctOptionIds,
      playerResults,
    };
  }

  getLeaderboard(): { userId: string; userName: string; score: number; place: number }[] {
    const sorted = Array.from(this.state.players.values())
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        userId: p.userId,
        userName: p.userName,
        score: p.score,
        place: index + 1,
      }));

    return sorted;
  }

  getFinalResults(): { odId: string; userName: string; score: number }[] {
    return Array.from(this.scores.entries()).map(([userId, score]) => {
      // Find player name from current players if available, otherwise "Unknown"
      let userName = "Unknown";
      for (const p of this.state.players.values()) {
        if (p.userId === userId) {
          userName = p.userName;
          break;
        }
      }
      return {
        odId: userId,
        userName,
        score,
      };
    });
  }

  hasAllPlayersAnswered(): boolean {
    for (const player of this.state.players.values()) {
      if (player.currentAnswer === null) {
        return false;
      }
    }
    return true;
  }

  getPlayerCount(): number {
    return this.state.players.size;
  }

  getAnsweredCount(): number {
    let count = 0;
    for (const player of this.state.players.values()) {
      if (player.currentAnswer !== null) {
        count++;
      }
    }
    return count;
  }
}
