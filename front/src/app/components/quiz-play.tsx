import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Socket } from "socket.io-client";
import { LeaderboardEntry, QuestionForPlayer } from "@/app/api/types";
import { t } from "@/app/utils/i18n";

interface QuizPlayProps {
  onNavigate: (page: "home" | "create" | "waiting" | "quiz" | "winners", data?: any) => void;
  session: { mode: "host" | "player"; roomCode: string; quizTitle: string };
  socket: Socket | null;
}

export function QuizPlay({ onNavigate, session, socket }: QuizPlayProps) {
  const [question, setQuestion] = useState<QuestionForPlayer | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const colors = useMemo(
    () => [
      { bg: "bg-red-500", hover: "hover:bg-red-600" },
      { bg: "bg-blue-500", hover: "hover:bg-blue-600" },
      { bg: "bg-yellow-500", hover: "hover:bg-yellow-600" },
      { bg: "bg-green-500", hover: "hover:bg-green-600" },
    ],
    []
  );

  const shapes = ["△", "◇", "○", "□"];

  useEffect(() => {
    if (!socket) return;

    const handleQuizStarted = (data: any) => {
      setIsStarted(true);
      if (data?.totalQuestions) {
        setTotalQuestions(data.totalQuestions);
      }
    };

    const handleQuestion = (data: any) => {
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber ?? 0);
      setTotalQuestions(data.totalQuestions ?? 0);
      setTimeLeft(data.question?.timeLimitSeconds ?? 0);
      setSelectedAnswers([]);
      setShowResult(false);
      setCorrectAnswers([]);
    };

    const handleResults = (data: any) => {
      setShowResult(true);
      setCorrectAnswers(data?.correctAnswers || []);
      setLeaderboard(data?.leaderboard || []);
    };

    const handleQuizEnded = (data: any) => {
      const finalLeaderboard = data?.leaderboard || leaderboard;
      setLeaderboard(finalLeaderboard);
      onNavigate("winners", {
        leaderboard: finalLeaderboard,
        quizTitle: session.quizTitle,
      });
    };

    socket.on("quiz_started", handleQuizStarted);
    socket.on("question", handleQuestion);
    socket.on("question_results", handleResults);
    socket.on("quiz_ended", handleQuizEnded);

    return () => {
      socket.off("quiz_started", handleQuizStarted);
      socket.off("question", handleQuestion);
      socket.off("question_results", handleResults);
      socket.off("quiz_ended", handleQuizEnded);
    };
  }, [socket, onNavigate, session.quizTitle, leaderboard]);

  useEffect(() => {
    if (!question || showResult || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showResult, question]);

  useEffect(() => {
    if (!socket || session.mode !== "host" || !isStarted) return;
    if (!question) {
      socket.emit("next_question", (response: any) => {
        if (response?.error) {
          setError(response.error);
        }
      });
    }
  }, [socket, session.mode, isStarted, question]);

  const handleAnswerSelect = (answerId: string) => {
    if (!socket || !question || showResult) return;
    if (session.mode === "host") return;

    if (question.type === "multichoice") {
      setSelectedAnswers((prev) =>
        prev.includes(answerId) ? prev.filter((id) => id !== answerId) : [...prev, answerId]
      );
      return;
    }

    setSelectedAnswers([answerId]);
    socket.emit("submit_answer", { answerIds: [answerId] }, (response: any) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  };

  const handleSubmitMulti = () => {
    if (!socket || !question || showResult) return;
    socket.emit("submit_answer", { answerIds: selectedAnswers }, (response: any) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  };

  const handleShowResults = () => {
    if (!socket) return;
    socket.emit("show_results", (response: any) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  };

  const handleNextQuestion = () => {
    if (!socket) return;
    socket.emit("next_question", (response: any) => {
      if (response?.error) {
        setError(response.error);
      }
      if (response?.finished) {
        socket.emit("end_quiz", () => {});
      }
    });
  };

  const handleEndQuiz = () => {
    if (!socket) return;
    socket.emit("end_quiz", (response: any) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  };

  const progressPercent =
    totalQuestions > 0 ? (questionNumber / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-gray-800">
                {question ? `${t("Question")} ${questionNumber} ${t("of")} ${totalQuestions}` : t("Waiting...")}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="size-6 text-gray-600" />
              <div className="text-3xl font-bold text-gray-800">
                {question ? `${timeLeft}s` : "--"}
              </div>
            </div>
          </div>
          <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
        </div>
      </div>

      {/* Question Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8 max-w-4xl w-full">
          <h2 className="text-4xl font-bold text-gray-800 text-center">
            {question?.text || t("Waiting for the next question...")}
          </h2>
        </div>

        {/* Answer Grid */}
        {question && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswers.includes(option.id);
              const isCorrect = correctAnswers.includes(option.id);

              let bgClass = colors[index]?.bg || "bg-gray-500";
              let hoverClass = colors[index]?.hover || "hover:bg-gray-600";

              if (showResult) {
                if (isCorrect) {
                  bgClass = "bg-green-600";
                  hoverClass = "hover:bg-green-600";
                } else if (isSelected) {
                  bgClass = "bg-red-700";
                  hoverClass = "hover:bg-red-700";
                }
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(option.id)}
                  disabled={showResult || session.mode === "host"}
                  className={`${bgClass} ${hoverClass} rounded-3xl p-8 transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed ${
                    isSelected && !showResult ? "ring-8 ring-white" : ""
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-white/20 size-20 rounded-2xl flex items-center justify-center">
                      <span className="text-white text-5xl font-bold">
                        {shapes[index] || "?"}
                      </span>
                    </div>
                    <p className="text-white text-2xl font-bold text-left flex-1">
                      {option.text || `${t("Answer")} ${index + 1}`}
                    </p>
                    {showResult && isCorrect && <div className="text-white text-4xl">✓</div>}
                    {showResult && isSelected && !isCorrect && (
                      <div className="text-white text-4xl">✗</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {question?.type === "multichoice" && session.mode === "player" && !showResult && (
          <button
            onClick={handleSubmitMulti}
            disabled={selectedAnswers.length === 0}
            className="mt-6 bg-white text-purple-700 px-8 py-4 rounded-full font-bold text-lg shadow-lg disabled:opacity-50"
          >
            {t("Submit Answer")}
          </button>
        )}

        {session.mode === "host" && (
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={handleShowResults}
              className="bg-white text-purple-700 px-8 py-4 rounded-full font-bold text-lg shadow-lg"
            >
              {t("Show Results")}
            </button>
            <button
              onClick={handleNextQuestion}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg"
            >
              {t("Next Question")}
            </button>
            <button
              onClick={handleEndQuiz}
              className="bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg"
            >
              {t("End Quiz")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
