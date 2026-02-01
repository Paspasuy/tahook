import { useEffect, useMemo, useState } from "react";
import { UserPage } from "@/app/components/user-page";
import { CreateQuiz } from "@/app/components/create-quiz";
import { WaitingLobby } from "@/app/components/waiting-lobby";
import { QuizPlay } from "@/app/components/quiz-play";
import { WinnersPage } from "@/app/components/winners-page";
import { authApi } from "@/app/api";
import { getSocket, disconnectSocket } from "@/app/api/socket";
import { AuthUser, LeaderboardEntry } from "@/app/api/types";

type Page = "home" | "create" | "waiting" | "quiz" | "winners";

interface AuthState {
  token: string;
  user: AuthUser;
}

interface QuizSession {
  mode: "host" | "player";
  roomCode: string;
  quizTitle: string;
  quizId?: string;
}

interface WinnersData {
  leaderboard: LeaderboardEntry[];
  quizTitle?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [quizData, setQuizData] = useState<QuizSession | null>(null);
  const [winnersData, setWinnersData] = useState<WinnersData | null>(null);
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("tahook_token");
    if (!token) {
      setAuthLoading(false);
      return;
    }

    authApi
      .me(token)
      .then((user) => {
        setAuth({ token, user });
      })
      .catch(() => {
        localStorage.removeItem("tahook_token");
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const socket = useMemo(() => {
    if (!auth) return null;
    return getSocket(auth.token);
  }, [auth]);

  const handleAuth = async (
    mode: "login" | "register",
    name: string,
    password: string
  ) => {
    setAuthError(null);
    try {
      const response =
        mode === "login"
          ? await authApi.login(name, password)
          : await authApi.register(name, password);
      localStorage.setItem("tahook_token", response.token);
      setAuth({ token: response.token, user: response.user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Auth failed";
      setAuthError(message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tahook_token");
    disconnectSocket();
    setAuth(null);
    setCurrentPage("home");
  };

  const handleNavigate = (page: Page, data?: any) => {
    setCurrentPage(page);
    if (page === "winners" && data) {
      setWinnersData(data as WinnersData);
      return;
    }
    if (data) {
      setQuizData(data as QuizSession);
    }
  };

  return (
    <div className="size-full">
      {currentPage === "home" && (
        <UserPage
          onNavigate={handleNavigate}
          auth={auth}
          authLoading={authLoading}
          authError={authError}
          onAuth={handleAuth}
          onLogout={handleLogout}
          socket={socket}
        />
      )}
      {currentPage === "create" && (
        <CreateQuiz onNavigate={handleNavigate} auth={auth} socket={socket} />
      )}
      {currentPage === "waiting" && quizData && (
        <WaitingLobby
          onNavigate={handleNavigate}
          quizData={quizData}
          socket={socket}
        />
      )}
      {currentPage === "quiz" && quizData && (
        <QuizPlay
          onNavigate={handleNavigate}
          session={quizData}
          socket={socket}
        />
      )}
      {currentPage === "winners" && winnersData && (
        <WinnersPage onNavigate={handleNavigate} data={winnersData} />
      )}
    </div>
  );
}
