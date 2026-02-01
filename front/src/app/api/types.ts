export interface AuthUser {
  id: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface QuizResponse {
  id: string;
  title: string;
  ownerId: string;
  ownerName?: string;
  isPublished: boolean;
  questionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id?: string;
  text: string;
  isCorrect: boolean;
}

export type QuestionType = "singlechoice" | "multichoice";

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

export interface QuestionForPlayer {
  id: string;
  index: number;
  text: string;
  type: QuestionType;
  options: { id: string; text: string }[];
  timeLimitSeconds: number;
  points: number;
}

export interface ResultResponse {
  userId: string;
  userName: string;
  quizId: string;
  quizTitle: string;
  score: number;
  place: number | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  place: number;
}

export interface QuizLeaderboardResponse {
  quizId: string;
  quizTitle: string;
  entries: LeaderboardEntry[];
}
