import { Trophy, Clock, Users, Plus } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  date: string;
  participants: number;
  score?: number;
  totalQuestions: number;
  rank?: number;
}

interface UserPageProps {
  onNavigate: (page: string) => void;
  userName: string;
}

export function UserPage({ onNavigate, userName }: UserPageProps) {
  const hostedQuizzes: Quiz[] = [
    {
      id: '1',
      title: 'World Geography Challenge',
      date: '2026-01-28',
      participants: 24,
      totalQuestions: 10,
    },
    {
      id: '2',
      title: 'Math Basics Quiz',
      date: '2026-01-25',
      participants: 18,
      totalQuestions: 15,
    },
    {
      id: '3',
      title: 'Science Trivia',
      date: '2026-01-20',
      participants: 32,
      totalQuestions: 12,
    },
  ];

  const playedQuizzes: Quiz[] = [
    {
      id: '4',
      title: 'History Master',
      date: '2026-01-30',
      participants: 45,
      score: 850,
      totalQuestions: 10,
      rank: 3,
    },
    {
      id: '5',
      title: 'Pop Culture 2025',
      date: '2026-01-29',
      participants: 67,
      score: 720,
      totalQuestions: 12,
      rank: 8,
    },
    {
      id: '6',
      title: 'Sports Legends',
      date: '2026-01-27',
      participants: 28,
      score: 940,
      totalQuestions: 10,
      rank: 1,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-gray-600">Ready to create or play some quizzes?</p>
            </div>
            <button
              onClick={() => onNavigate('create')}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg"
            >
              <Plus className="size-6" />
              Create Quiz
            </button>
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
                <p className="text-gray-600 text-sm">Total Wins</p>
                <p className="text-3xl font-bold text-gray-800">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-pink-100 p-4 rounded-full">
                <Clock className="size-8 text-pink-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Quizzes Played</p>
                <p className="text-3xl font-bold text-gray-800">47</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-4 rounded-full">
                <Users className="size-8 text-orange-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Quizzes Hosted</p>
                <p className="text-3xl font-bold text-gray-800">{hostedQuizzes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quizzes Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hosted Quizzes */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Hosted Quizzes</h2>
            <div className="space-y-4">
              {hostedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="border-2 border-gray-200 rounded-2xl p-4 hover:border-purple-400 transition-colors cursor-pointer"
                >
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{quiz.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" />
                      {quiz.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-4" />
                      {quiz.participants} players
                    </span>
                    <span>{quiz.totalQuestions} questions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Played Quizzes */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recently Played</h2>
            <div className="space-y-4">
              {playedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="border-2 border-gray-200 rounded-2xl p-4 hover:border-pink-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{quiz.title}</h3>
                    {quiz.rank && quiz.rank <= 3 && (
                      <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                        <Trophy className="size-4 text-yellow-600" />
                        <span className="text-sm font-bold text-yellow-700">#{quiz.rank}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" />
                      {quiz.date}
                    </span>
                    <span className="font-bold text-purple-600">{quiz.score} pts</span>
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
