import { AppDataSource } from "../config/database";
import { Quiz } from "../models/orm/Quiz";
import { Question } from "../models/orm/Question";
import {
  CreateQuizRequest,
  UpdateQuizRequest,
  QuizResponse,
  QuizWithQuestionsResponse,
} from "../models/api/Quiz";
import { QuestionResponse } from "../models/api/Question";

export class QuizService {
  private quizRepository = AppDataSource.getRepository(Quiz);
  private questionRepository = AppDataSource.getRepository(Question);

  async createQuiz(
    ownerId: string,
    data: CreateQuizRequest
  ): Promise<QuizResponse> {
    const quiz = this.quizRepository.create({
      title: data.title,
      ownerId,
      isPublished: false,
    });

    await this.quizRepository.save(quiz);

    return this.toQuizResponse(quiz);
  }

  async getQuizById(id: string): Promise<Quiz | null> {
    return this.quizRepository.findOne({
      where: { id },
      relations: ["owner", "questions"],
    });
  }

  async getQuizWithQuestions(id: string): Promise<QuizWithQuestionsResponse | null> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ["owner", "questions"],
    });

    if (!quiz) return null;

    const questions = await this.questionRepository.find({
      where: { quizId: id },
      order: { index: "ASC" },
    });

    return {
      ...this.toQuizResponse(quiz),
      questions: questions.map((q) => this.toQuestionResponse(q)),
    };
  }

  async getQuizzesByOwner(ownerId: string): Promise<QuizResponse[]> {
    const quizzes = await this.quizRepository.find({
      where: { ownerId },
      relations: ["owner"],
      order: { createdAt: "DESC" },
    });

    return Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await this.questionRepository.count({
          where: { quizId: quiz.id },
        });
        return { ...this.toQuizResponse(quiz), questionCount };
      })
    );
  }

  async getPublishedQuizzes(): Promise<QuizResponse[]> {
    const quizzes = await this.quizRepository.find({
      where: { isPublished: true },
      relations: ["owner"],
      order: { createdAt: "DESC" },
    });

    return Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await this.questionRepository.count({
          where: { quizId: quiz.id },
        });
        return { ...this.toQuizResponse(quiz), questionCount };
      })
    );
  }

  async updateQuiz(
    id: string,
    ownerId: string,
    data: UpdateQuizRequest
  ): Promise<QuizResponse | null> {
    const quiz = await this.quizRepository.findOne({
      where: { id, ownerId },
      relations: ["owner"],
    });

    if (!quiz) return null;

    if (data.title !== undefined) {
      quiz.title = data.title;
    }

    await this.quizRepository.save(quiz);

    return this.toQuizResponse(quiz);
  }

  async publishQuiz(id: string, ownerId: string): Promise<QuizResponse | null> {
    const quiz = await this.quizRepository.findOne({
      where: { id, ownerId },
      relations: ["owner"],
    });

    if (!quiz) return null;

    const questionCount = await this.questionRepository.count({
      where: { quizId: id },
    });

    if (questionCount === 0) {
      throw new Error("Cannot publish quiz without questions");
    }

    quiz.isPublished = true;
    await this.quizRepository.save(quiz);

    return this.toQuizResponse(quiz);
  }

  async deleteQuiz(id: string, ownerId: string): Promise<boolean> {
    const result = await this.quizRepository.delete({ id, ownerId });
    return (result.affected ?? 0) > 0;
  }

  private toQuizResponse(quiz: Quiz): QuizResponse {
    return {
      id: quiz.id,
      title: quiz.title,
      ownerId: quiz.ownerId,
      ownerName: quiz.owner?.name,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    };
  }

  private toQuestionResponse(question: Question): QuestionResponse {
    return {
      id: question.id,
      quizId: question.quizId,
      index: question.index,
      text: question.text,
      type: question.type,
      options: question.options,
      timeLimitSeconds: question.timeLimitSeconds,
      points: question.points,
    };
  }
}

export const quizService = new QuizService();
