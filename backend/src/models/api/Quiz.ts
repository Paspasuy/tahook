import { QuestionResponse } from "./Question";

// Request DTOs
export interface CreateQuizRequest {
  title: string;
}

export interface UpdateQuizRequest {
  title?: string;
}

// Response DTOs
export interface QuizResponse {
  id: string;
  title: string;
  ownerId: string;
  ownerName?: string;
  isPublished: boolean;
  questionCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizWithQuestionsResponse extends QuizResponse {
  questions: QuestionResponse[];
}
