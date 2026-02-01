import { Trophy, Medal, Home } from "lucide-react";
import { motion } from "motion/react";
import { LeaderboardEntry } from "@/app/api/types";
import { t } from "@/app/utils/i18n";

interface WinnersPageProps {
  onNavigate: (page: "home" | "create") => void;
  data: { leaderboard: LeaderboardEntry[]; quizTitle?: string };
}

export function WinnersPage({ onNavigate, data }: WinnersPageProps) {
  const players = [...data.leaderboard].sort((a, b) => {
    if (a.place && b.place) return a.place - b.place;
    return b.score - a.score;
  });

  const podiumColors = [
    'bg-gradient-to-b from-yellow-400 to-yellow-600',
    'bg-gradient-to-b from-gray-300 to-gray-500',
    'bg-gradient-to-b from-orange-400 to-orange-600',
  ];

  const podiumHeights = ['h-64', 'h-48', 'h-56'];

  const medals = [
    { icon: '🥇', color: 'text-yellow-500' },
    { icon: '🥈', color: 'text-gray-400' },
    { icon: '🥉', color: 'text-orange-500' },
  ];

  // podiumOrder maps visual positions [Left (2nd), Center (1st), Right (3rd)] 
  // to the index in the sorted players array.
  const podiumOrder = [
    { playerIndex: 1, position: 1, label: "2" }, // Left: 2nd place (index 1)
    { playerIndex: 0, position: 0, label: "1" }, // Center: 1st place (index 0)
    { playerIndex: 2, position: 2, label: "3" }, // Right: 3rd place (index 2)
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="inline-block mb-4"
          >
            <Trophy className="size-24 text-yellow-300 drop-shadow-lg" />
          </motion.div>
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {t("Game Results!")}
          </h1>
          <p className="text-2xl text-white/90">
            {data.quizTitle ? `${t("Quiz")}: ${data.quizTitle}` : t("Amazing performance everyone!")}
          </p>
        </div>


        {/* Podium */}
        <div className="mb-12">
          <div className="flex items-end justify-center gap-4 max-w-4xl mx-auto">
            {podiumOrder.map(({ playerIndex, position, label }) => {
              const player = players[playerIndex];
              if (!player) return <div key={position} className="flex-1" />; // Empty space if fewer than 3 players
              
              return (
                <motion.div
                  key={player.userId}
                  initial={{ y: 200, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: position * 0.2, type: 'spring', bounce: 0.4 }}
                  className="flex-1 flex flex-col items-center"
                >
                  <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4 w-full">
                    <div className="text-6xl mb-2 text-center">{medals[playerIndex].icon}</div>
                    <p className="text-2xl font-bold text-gray-800 text-center mb-2">
                      {player.userName}
                    </p>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">{player.score}</p>
                      <p className="text-sm text-gray-600">{t("points")}</p>
                    </div>
                  </div>
                  <div className={`${podiumColors[playerIndex]} ${podiumHeights[playerIndex]} w-full rounded-t-2xl flex items-center justify-center shadow-xl`}>
                    <span className="text-white text-6xl font-bold">{label}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Medal className="size-8 text-purple-600" />
            {t("Full Leaderboard")}
          </h2>
          <div className="space-y-3">
            {players.map((player, index) => (
              <motion.div
                key={player.userId}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-2xl ${
                  index < 3 ? 'bg-gradient-to-r from-purple-50 to-pink-50' : 'bg-gray-50'
                }`}
              >
                <div className={`size-12 rounded-full flex items-center justify-center font-bold text-xl ${
                  index < 3 ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white' : 'bg-gray-300 text-gray-700'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-gray-800">{player.userName}</p>
                  <p className="text-sm text-gray-600">{t("Place")} #{player.place}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">{player.score}</p>
                  <p className="text-sm text-gray-600">{t("points")}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 bg-white text-gray-800 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg"
          >
            <Home className="size-6" />
            {t("Back to Home")}
          </button>
          <button
            onClick={() => onNavigate('create')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg"
          >
            {t("Create New Quiz")}
          </button>
        </div>
      </div>
    </div>
  );
}
