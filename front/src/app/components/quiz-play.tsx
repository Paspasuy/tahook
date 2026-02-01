import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface QuizPlayProps {
  onNavigate: (page: string) => void;
  quizData: any;
}

export function QuizPlay({ onNavigate, quizData }: QuizPlayProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quizData.questions[0].timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const colors = [
    { bg: 'bg-red-500', hover: 'hover:bg-red-600' },
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-600' },
    { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
    { bg: 'bg-green-500', hover: 'hover:bg-green-600' },
  ];

  const shapes = ['△', '◇', '○', '□'];

  const question = quizData.questions[currentQuestion];

  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleAnswer(selectedAnswer);
    }
  }, [timeLeft, showResult]);

  const handleAnswer = (answerIndex: number | null) => {
    setShowResult(true);
    const isCorrect = answerIndex === question.correctAnswer;
    setAnswers([...answers, isCorrect]);

    setTimeout(() => {
      if (currentQuestion < quizData.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(quizData.questions[currentQuestion + 1].timeLimit);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        onNavigate('winners');
      }
    }, 3000);
  };

  const progressPercent = ((currentQuestion + 1) / quizData.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-gray-800">
                Question {currentQuestion + 1} of {quizData.questions.length}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="size-6 text-gray-600" />
              <div className="text-3xl font-bold text-gray-800">{timeLeft}s</div>
            </div>
          </div>
          <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8 max-w-4xl w-full">
          <h2 className="text-4xl font-bold text-gray-800 text-center">
            {question.question || 'Sample Question: What is the capital of France?'}
          </h2>
        </div>

        {/* Answer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">
          {question.answers.map((answer: string, index: number) => {
            const isCorrect = index === question.correctAnswer;
            const isSelected = selectedAnswer === index;
            
            let bgClass = colors[index].bg;
            let hoverClass = colors[index].hover;
            
            if (showResult) {
              if (isCorrect) {
                bgClass = 'bg-green-600';
                hoverClass = 'hover:bg-green-600';
              } else if (isSelected) {
                bgClass = 'bg-red-700';
                hoverClass = 'hover:bg-red-700';
              }
            }

            return (
              <button
                key={index}
                onClick={() => {
                  if (!showResult) {
                    setSelectedAnswer(index);
                    handleAnswer(index);
                  }
                }}
                disabled={showResult}
                className={`${bgClass} ${hoverClass} rounded-3xl p-8 transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed ${
                  isSelected && !showResult ? 'ring-8 ring-white' : ''
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="bg-white/20 size-20 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-5xl font-bold">{shapes[index]}</span>
                  </div>
                  <p className="text-white text-2xl font-bold text-left flex-1">
                    {answer || `Answer ${index + 1}`}
                  </p>
                  {showResult && isCorrect && (
                    <div className="text-white text-4xl">✓</div>
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <div className="text-white text-4xl">✗</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <p className="text-2xl font-bold text-center">
              {selectedAnswer === question.correctAnswer ? (
                <span className="text-green-600">Correct! 🎉</span>
              ) : (
                <span className="text-red-600">Incorrect 😔</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
