import { AppDataSource } from "../config/database";
import { Question, QuestionOption } from "../models/orm/Question";
import { Quiz } from "../models/orm/Quiz";
import {
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionResponse,
  QuestionForPlayerResponse,
} from "../models/api/Question";
import { v4 as uuidv4 } from "uuid";

export class QuestionService {
  private questionRepository = AppDataSource.getRepository(Question);
  private quizRepository = AppDataSource.getRepository(Quiz);

  async createQuestion(
    data: CreateQuestionRequest,
    ownerId: string
  ): Promise<QuestionResponse> {
    // Verify quiz ownership
    const quiz = await this.quizRepository.findOne({
      where: { id: data.quizId, ownerId },
    });

    if (!quiz) {
      throw new Error("Quiz not found or you don't have permission");
    }

    if (quiz.isPublished) {
      throw new Error("Cannot add questions to a published quiz");
    }

    // Ensure options have IDs
    const options: QuestionOption[] = data.options.map((opt) => ({
      ...opt,
      id: opt.id || uuidv4(),
    }));

    const question = this.questionRepository.create({
      quizId: data.quizId,
      index: data.index,
      text: data.text,
      type: data.type,
      options,
      timeLimitSeconds: data.timeLimitSeconds ?? 30,
      points: data.points ?? 1000,
    });

    await this.questionRepository.save(question);

    return this.toQuestionResponse(question);
  }

  async getQuestionsByQuiz(quizId: string): Promise<QuestionResponse[]> {
    const questions = await this.questionRepository.find({
      where: { quizId },
      order: { index: "ASC" },
    });

    return questions.map((q) => this.toQuestionResponse(q));
  }

  async getQuestionById(id: string): Promise<QuestionResponse | null> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) return null;
    return this.toQuestionResponse(question);
  }

  async updateQuestion(
    id: string,
    data: UpdateQuestionRequest,
    ownerId: string
  ): Promise<QuestionResponse | null> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ["quiz"],
    });

    if (!question) return null;

    if (question.quiz.ownerId !== ownerId) {
      throw new Error("You don't have permission to edit this question");
    }

    if (question.quiz.isPublished) {
      throw new Error("Cannot edit questions in a published quiz");
    }

    if (data.index !== undefined) question.index = data.index;
    if (data.text !== undefined) question.text = data.text;
    if (data.type !== undefined) question.type = data.type;
    if (data.options !== undefined) {
      question.options = data.options.map((opt) => ({
        ...opt,
        id: opt.id || uuidv4(),
      }));
    }
    if (data.timeLimitSeconds !== undefined)
      question.timeLimitSeconds = data.timeLimitSeconds;
    if (data.points !== undefined) question.points = data.points;

    await this.questionRepository.save(question);

    return this.toQuestionResponse(question);
  }

  async deleteQuestion(id: string, ownerId: string): Promise<boolean> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ["quiz"],
    });

    if (!question) return false;

    if (question.quiz.ownerId !== ownerId) {
      throw new Error("You don't have permission to delete this question");
    }

    if (question.quiz.isPublished) {
      throw new Error("Cannot delete questions from a published quiz");
    }

    const result = await this.questionRepository.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async reorderQuestions(
    quizId: string,
    questionIds: string[],
    ownerId: string
  ): Promise<void> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, ownerId },
    });

    if (!quiz) {
      throw new Error("Quiz not found or you don't have permission");
    }

    if (quiz.isPublished) {
      throw new Error("Cannot reorder questions in a published quiz");
    }

    for (let i = 0; i < questionIds.length; i++) {
      await this.questionRepository.update(
        { id: questionIds[i], quizId },
        { index: i }
      );
    }
  }

  // Helper to get questions for players (without correct answers)
  toQuestionForPlayer(question: Question): QuestionForPlayerResponse {
    return {
      id: question.id,
      index: question.index,
      text: question.text,
      type: question.type,
      options: question.options.map((opt) => ({ id: opt.id, text: opt.text })),
      timeLimitSeconds: question.timeLimitSeconds,
      points: question.points,
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

export const questionService = new QuestionService();
