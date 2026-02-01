import { apiRequest } from "./client";
import {
  AuthResponse,
  QuizResponse,
  QuestionResponse,
  ResultResponse,
  QuizLeaderboardResponse,
  QuestionOption,
  QuestionType,
} from "./types";

export const authApi = {
  register: (name: string, password: string) =>
    apiRequest<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: { name, password },
    }),
  login: (name: string, password: string) =>
    apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { name, password },
    }),
  me: (token: string) =>
    apiRequest<{ id: string; name: string; createdAt: string }>("/api/auth/me", {
      token,
    }),
};

export const quizApi = {
  createQuiz: (token: string, title: string) =>
    apiRequest<QuizResponse>("/api/quizzes", {
      method: "POST",
      body: { title },
      token,
    }),
  publishQuiz: (token: string, quizId: string) =>
    apiRequest<QuizResponse>(`/api/quizzes/${quizId}/publish`, {
      method: "POST",
      token,
    }),
  getMyQuizzes: (token: string) =>
    apiRequest<QuizResponse[]>("/api/quizzes/my", { token }),
};

export const questionApi = {
  createQuestion: (
    token: string,
    data: {
      quizId: string;
      index: number;
      text: string;
      type: QuestionType;
      options: QuestionOption[];
      timeLimitSeconds: number;
      points?: number;
    }
  ) =>
    apiRequest<QuestionResponse>("/api/questions", {
      method: "POST",
      body: data,
      token,
    }),
};

export const resultApi = {
  getMyResults: (token: string) =>
    apiRequest<ResultResponse[]>("/api/results/my", { token }),
  getQuizLeaderboard: (quizId: string) =>
    apiRequest<QuizLeaderboardResponse>(`/api/results/quiz/${quizId}`),
};
