// Response DTOs
export interface ResultResponse {
  userId: string;
  userName: string;
  quizId: string;
  quizTitle: string;
  score: number;
  place: number | null;
  createdAt: Date;
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
