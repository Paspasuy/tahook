import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Play } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  timeLimit: number;
}

interface CreateQuizProps {
  onNavigate: (page: string, quizData?: any) => void;
}

export function CreateQuiz({ onNavigate }: CreateQuizProps) {
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      question: '',
      answers: ['', '', '', ''],
      correctAnswer: 0,
      timeLimit: 20,
    },
  ]);

  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-yellow-500',
    'bg-green-500',
  ];

  const shapes = [
    '△',
    '◇',
    '○',
    '□',
  ];

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: '',
      answers: ['', '', '', ''],
      correctAnswer: 0,
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
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
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

  const handleLaunchQuiz = () => {
    const quizData = {
      title: quizTitle || 'Untitled Quiz',
      questions,
      pin: Math.floor(100000 + Math.random() * 900000).toString(),
    };
    onNavigate('waiting', quizData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('home')}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="size-6" />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Enter quiz title..."
                  className="text-3xl font-bold text-gray-800 border-none outline-none w-full"
                />
              </div>
            </div>
            <button
              onClick={handleLaunchQuiz}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg"
            >
              <Play className="size-6" />
              Launch Quiz
            </button>
          </div>
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
                      updateQuestion(question.id, 'question', e.target.value)
                    }
                    placeholder="Type your question here..."
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
                <label className="text-sm text-gray-600 mb-2 block">Time Limit (seconds)</label>
                <input
                  type="number"
                  value={question.timeLimit}
                  onChange={(e) =>
                    updateQuestion(question.id, 'timeLimit', parseInt(e.target.value))
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
                      question.correctAnswer === aIndex ? 'ring-4 ring-yellow-400' : ''
                    }`}
                    onClick={() => updateQuestion(question.id, 'correctAnswer', aIndex)}
                  >
                    <div className="bg-white rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`${colors[aIndex]} text-white size-10 rounded-lg flex items-center justify-center text-2xl font-bold`}>
                          {shapes[aIndex]}
                        </div>
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) =>
                            updateAnswer(question.id, aIndex, e.target.value)
                          }
                          placeholder={`Answer ${aIndex + 1}`}
                          className="flex-1 text-lg font-bold text-gray-800 border-none outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {question.correctAnswer === aIndex && (
                        <div className="text-sm font-bold text-green-600">✓ Correct Answer</div>
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
          Add Question
        </button>
      </div>
    </div>
  );
}
