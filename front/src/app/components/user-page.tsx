import { useEffect, useMemo, useState } from "react";
import { Trophy, Clock, Users, Plus } from "lucide-react";
import { Socket } from "socket.io-client";
import { quizApi, resultApi } from "@/app/api";
import { AuthUser, QuizResponse, ResultResponse } from "@/app/api/types";
import { t } from "@/app/utils/i18n";

interface UserPageProps {
  onNavigate: (page: "home" | "create" | "waiting" | "quiz" | "winners", data?: any) => void;
  auth: { token: string; user: AuthUser } | null;
  authLoading: boolean;
  authError: string | null;
  onAuth: (mode: "login" | "register", name: string, password: string) => void;
  onLogout: () => void;
  socket: Socket | null;
}

export function UserPage({
  onNavigate,
  auth,
  authLoading,
  authError,
  onAuth,
  onLogout,
  socket,
}: UserPageProps) {
  const [hostedQuizzes, setHostedQuizzes] = useState<QuizResponse[]>([]);
  const [playedQuizzes, setPlayedQuizzes] = useState<ResultResponse[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!auth) {
      setHostedQuizzes([]);
      setPlayedQuizzes([]);
      return;
    }
    setDataLoading(true);
    setDataError(null);
    Promise.all([quizApi.getMyQuizzes(auth.token), resultApi.getMyResults(auth.token)])
      .then(([quizzes, results]) => {
        setHostedQuizzes(quizzes);
        setPlayedQuizzes(results);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Failed to load data";
        setDataError(message);
      })
      .finally(() => setDataLoading(false));
  }, [auth]);

  const totalWins = useMemo(
    () => playedQuizzes.filter((quiz) => quiz.place === 1).length,
    [playedQuizzes]
  );

  const handleJoin = () => {
    if (!socket) {
      setJoinError("Login required to join a room");
      return;
    }
    if (!pin.trim()) {
      setJoinError("Enter a game PIN");
      return;
    }
    setJoining(true);
    setJoinError(null);
    socket.emit("join_room", { code: pin.trim() }, (response: any) => {
      setJoining(false);
      if (response?.error) {
        setJoinError(response.error);
        return;
      }
      onNavigate("quiz", {
        mode: "player",
        roomCode: pin.trim().toUpperCase(),
        quizTitle: response.quizTitle || "Quiz",
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  {auth ? `${t("Welcome back")}, ${auth.user.name}!` : t("Welcome to Tahook!")}
                  <span className="ml-2">👋</span>
                </h1>
                <p className="text-gray-600">
                  {auth
                    ? t("Ready to create or play some quizzes?")
                    : t("Login or register to get started.")}
                </p>
              </div>
              <button
                onClick={() => onNavigate("create")}
                disabled={!auth}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="size-6" />
                {t("Create Quiz")}
              </button>
            </div>

            {!auth && (
              <div className="bg-gray-50 rounded-2xl p-6 flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("Username")}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-purple-500"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("Password")}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => onAuth("login", name, password)}
                  disabled={authLoading || !name || !password}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
                >
                  {t("Login")}
                </button>
                <button
                  onClick={() => onAuth("register", name, password)}
                  disabled={authLoading || !name || !password}
                  className="bg-pink-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
                >
                  {t("Register")}
                </button>
                {authError && (
                  <div className="text-red-600 font-semibold">{authError}</div>
                )}
              </div>
            )}

            {auth && (
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder={t("Enter Game PIN")}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
                  >
                    {t("Join Game")}
                  </button>
                </div>
                <button
                  onClick={onLogout}
                  className="text-gray-600 font-semibold hover:text-gray-900"
                >
                  {t("Logout")}
                </button>
                {joinError && (
                  <div className="text-red-600 font-semibold">{joinError}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-full">
                <Trophy className="size-8 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t("Total Wins")}</p>
                <p className="text-3xl font-bold text-gray-800">{totalWins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-pink-100 p-4 rounded-full">
                <Clock className="size-8 text-pink-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t("Quizzes Played")}</p>
                <p className="text-3xl font-bold text-gray-800">
                  {playedQuizzes.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-4 rounded-full">
                <Users className="size-8 text-orange-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t("Quizzes Hosted")}</p>
                <p className="text-3xl font-bold text-gray-800">{hostedQuizzes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quizzes Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hosted Quizzes */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("Your Hosted Quizzes")}</h2>
            <div className="space-y-4">
              {dataLoading && <div className="text-gray-600">{t("Loading...")}</div>}
              {dataError && <div className="text-red-600">{dataError}</div>}
              {!dataLoading && hostedQuizzes.length === 0 && (
                <div className="text-gray-600">{t("No hosted quizzes yet.")}</div>
              )}
              {hostedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="border-2 border-gray-200 rounded-2xl p-4 hover:border-purple-400 transition-colors cursor-pointer"
                >
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{quiz.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" />
                      {new Date(quiz.createdAt).toISOString().slice(0, 10)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-4" />
                      {quiz.isPublished ? t("Published") : t("Draft")}
                    </span>
                    <span>{quiz.questionCount ?? 0} {t("questions")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Played Quizzes */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("Recently Played")}</h2>
            <div className="space-y-4">
              {dataLoading && <div className="text-gray-600">{t("Loading...")}</div>}
              {!dataLoading && playedQuizzes.length === 0 && (
                <div className="text-gray-600">{t("No results yet.")}</div>
              )}
              {playedQuizzes.map((quiz) => (
                <div
                  key={`${quiz.quizId}-${quiz.userId}`}
                  className="border-2 border-gray-200 rounded-2xl p-4 hover:border-pink-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{quiz.quizTitle}</h3>
                    {quiz.place && quiz.place <= 3 && (
                      <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                        <Trophy className="size-4 text-yellow-600" />
                        <span className="text-sm font-bold text-yellow-700">
                          #{quiz.place}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" />
                      {new Date(quiz.createdAt).toISOString().slice(0, 10)}
                    </span>
                    <span className="font-bold text-purple-600">{quiz.score} {t("pts")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
