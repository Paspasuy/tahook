import { AppDataSource } from "../config/database";
import { Result } from "../models/orm/Result";
import { User } from "../models/orm/User";
import { Quiz } from "../models/orm/Quiz";
import {
  ResultResponse,
  LeaderboardEntry,
  QuizLeaderboardResponse,
} from "../models/api/Result";

export interface PlayerScore {
  odId: string;  // userId from game room
  userName: string;
  score: number;
}

export class ResultService {
  private resultRepository = AppDataSource.getRepository(Result);
  private userRepository = AppDataSource.getRepository(User);
  private quizRepository = AppDataSource.getRepository(Quiz);

  // Save results after quiz completion
  async saveResults(
    quizId: string,
    playerScores: PlayerScore[]
  ): Promise<void> {
    // Sort by score descending
    const sortedScores = [...playerScores].sort((a, b) => b.score - a.score);

    // Assign places
    const resultsToSave: Partial<Result>[] = sortedScores.map(
      (player, index) => ({
        userId: player.odId,
        quizId,
        score: player.score,
        place: index + 1,
      })
    );

    // Use upsert to handle re-taking quizzes
    for (const result of resultsToSave) {
      await this.resultRepository.upsert(result, ["userId", "quizId"]);
    }
  }

  async getResultsByQuiz(quizId: string): Promise<QuizLeaderboardResponse | null> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) return null;

    const results = await this.resultRepository.find({
      where: { quizId },
      relations: ["user"],
      order: { place: "ASC" },
    });

    const entries: LeaderboardEntry[] = results.map((r) => ({
      userId: r.userId,
      userName: r.user?.name || "Unknown",
      score: r.score,
      place: r.place ?? 0,
    }));

    return {
      quizId,
      quizTitle: quiz.title,
      entries,
    };
  }

  async getResultsByUser(userId: string): Promise<ResultResponse[]> {
    const results = await this.resultRepository.find({
      where: { userId },
      relations: ["user", "quiz"],
      order: { createdAt: "DESC" },
    });

    return results.map((r) => this.toResultResponse(r));
  }

  async getResult(
    userId: string,
    quizId: string
  ): Promise<ResultResponse | null> {
    const result = await this.resultRepository.findOne({
      where: { userId, quizId },
      relations: ["user", "quiz"],
    });

    if (!result) return null;
    return this.toResultResponse(result);
  }

  private toResultResponse(result: Result): ResultResponse {
    return {
      userId: result.userId,
      userName: result.user?.name || "Unknown",
      quizId: result.quizId,
      quizTitle: result.quiz?.title || "Unknown",
      score: result.score,
      place: result.place,
      createdAt: result.createdAt,
    };
  }
}

export const resultService = new ResultService();
