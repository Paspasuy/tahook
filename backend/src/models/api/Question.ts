import { QuestionType, QuestionOption } from "../orm/Question";

// Request DTOs
export interface CreateQuestionRequest {
  quizId: string;
  index: number;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  timeLimitSeconds?: number;
  points?: number;
}

export interface UpdateQuestionRequest {
  index?: number;
  text?: string;
  type?: QuestionType;
  options?: QuestionOption[];
  timeLimitSeconds?: number;
  points?: number;
}

// Response DTOs
export interface QuestionResponse {
  id: string;
  quizId: string;
  index: number;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  timeLimitSeconds: number;
  points: number;
}

// For players (without correct answers)
export interface QuestionForPlayerResponse {
  id: string;
  index: number;
  text: string;
  type: QuestionType;
  options: { id: string; text: string }[];
  timeLimitSeconds: number;
  points: number;
}
