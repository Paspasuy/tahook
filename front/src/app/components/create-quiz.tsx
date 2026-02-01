import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Play } from "lucide-react";
import { Socket } from "socket.io-client";
import { questionApi, quizApi } from "@/app/api";
import { AuthUser } from "@/app/api/types";
import { t } from "@/app/utils/i18n";

interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswers: number[]; // Changed from correctAnswer: number
  timeLimit: number;
}

interface CreateQuizProps {
  onNavigate: (page: "home" | "create" | "waiting", quizData?: any) => void;
  auth: { token: string; user: AuthUser } | null;
  socket: Socket | null;
}

export function CreateQuiz({ onNavigate, auth, socket }: CreateQuizProps) {
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      question: "",
      answers: ["", "", "", ""],
      correctAnswers: [0],
      timeLimit: 20,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500"];

  const shapes = ["△", "◇", "○", "□"];

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: "",
      answers: ["", "", "", ""],
      correctAnswers: [0],
      timeLimit: 20,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const updateAnswer = (questionId: string, answerIndex: number, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const newAnswers = [...q.answers];
          newAnswers[answerIndex] = value;
          return { ...q, answers: newAnswers };
        }
        return q;
      })
    );
  };

  const toggleCorrectAnswer = (questionId: string, answerIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const isCorrect = q.correctAnswers.includes(answerIndex);
          let newCorrect;
          if (isCorrect) {
            // Don't allow removing the last correct answer
            if (q.correctAnswers.length > 1) {
              newCorrect = q.correctAnswers.filter((idx) => idx !== answerIndex);
            } else {
              newCorrect = q.correctAnswers;
            }
          } else {
            newCorrect = [...q.correctAnswers, answerIndex];
          }
          return { ...q, correctAnswers: newCorrect };
        }
        return q;
      })
    );
  };

  const validateQuiz = (): string | null => {
    if (!quizTitle.trim()) return t("Quiz title is required");
    if (questions.length === 0) return t("At least one question is required");
    for (const question of questions) {
      if (!question.question.trim()) return t("All questions must have text");
      if (question.answers.some((answer) => !answer.trim())) {
        return t("All answers must be filled");
      }
    }
    return null;
  };

  const handleLaunchQuiz = async () => {
    if (!auth || !socket) {
      setError(t("Login required to create a quiz"));
      return;
    }
    const validationError = validateQuiz();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const quiz = await quizApi.createQuiz(auth.token, quizTitle.trim());

      for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        await questionApi.createQuestion(auth.token, {
          quizId: quiz.id,
          index,
          text: question.question.trim(),
          type: question.correctAnswers.length > 1 ? "multichoice" : "singlechoice",
          options: question.answers.map((answer, answerIndex) => ({
            text: answer.trim(),
            isCorrect: question.correctAnswers.includes(answerIndex),
          })),
          timeLimitSeconds: question.timeLimit,
          points: 1000,
        });
      }

      const publishedQuiz = await quizApi.publishQuiz(auth.token, quiz.id);

      const roomCode = await new Promise<string>((resolve, reject) => {
        socket.emit("create_room", { quizId: quiz.id }, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
            return;
          }
          resolve(response.code as string);
        });
      });

      onNavigate("waiting", {
        mode: "host",
        roomCode,
        quizTitle: publishedQuiz.title,
        quizId: quiz.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create quiz";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate("home")}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="size-6" />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder={t("Enter quiz title...")}
                  className="text-3xl font-bold text-gray-800 border-none outline-none w-full"
                />
              </div>
            </div>
            <button
              onClick={handleLaunchQuiz}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="size-6" />
              {saving ? t("Creating...") : t("Launch Quiz")}
            </button>
          </div>
          {error && <div className="mt-4 text-red-600 font-semibold">{error}</div>}
        </div>

        {/* Questions */}
        <div className="space-y-6 mb-8">
          {questions.map((question, qIndex) => (
            <div key={question.id} className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-600 text-white size-12 rounded-full flex items-center justify-center font-bold text-xl">
                    {qIndex + 1}
                  </div>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) =>
                      updateQuestion(question.id, "question", e.target.value)
                    }
                    placeholder={t("Type your question here...")}
                    className="text-2xl font-bold text-gray-800 border-none outline-none flex-1"
                  />
                </div>
                <button
                  onClick={() => removeQuestion(question.id)}
                  disabled={questions.length === 1}
                  className="p-2 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <Trash2 className="size-5 text-red-600" />
                </button>
              </div>

              {/* Time Limit */}
              <div className="mb-6">
                <label className="text-sm text-gray-600 mb-2 block">
                  {t("Time Limit (seconds)")}
                </label>
                <input
                  type="number"
                  value={question.timeLimit}
                  onChange={(e) =>
                    updateQuestion(question.id, "timeLimit", parseInt(e.target.value))
                  }
                  min="5"
                  max="120"
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg outline-none focus:border-purple-500"
                />
              </div>

              {/* Answers Grid */}
              <div className="grid grid-cols-2 gap-4">
                {question.answers.map((answer, aIndex) => (
                  <div
                    key={aIndex}
                    className={`${colors[aIndex]} rounded-2xl p-1 cursor-pointer hover:scale-105 transition-transform ${
                      question.correctAnswers.includes(aIndex) ? "ring-4 ring-yellow-400" : ""
                    }`}
                    onClick={() => toggleCorrectAnswer(question.id, aIndex)}
                  >
                    <div className="bg-white rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`${colors[aIndex]} text-white size-10 rounded-lg flex items-center justify-center text-2xl font-bold`}
                        >
                          {shapes[aIndex]}
                        </div>
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) =>
                            updateAnswer(question.id, aIndex, e.target.value)
                          }
                          placeholder={`${t("Answer")} ${aIndex + 1}`}
                          className="flex-1 text-lg font-bold text-gray-800 border-none outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {question.correctAnswers.includes(aIndex) && (
                        <div className="text-sm font-bold text-green-600">
                          ✓ {t("Correct Answer")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Question Button */}
        <button
          onClick={addQuestion}
          className="w-full bg-white rounded-3xl shadow-2xl p-8 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 text-gray-600 font-bold text-xl"
        >
          <Plus className="size-8" />
          {t("Add Question")}
        </button>
      </div>
    </div>
  );
}
