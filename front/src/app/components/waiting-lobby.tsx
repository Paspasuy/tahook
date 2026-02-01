import { useState, useEffect } from 'react';
import { Users, Play, Copy, Check } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  avatar: string;
}

interface WaitingLobbyProps {
  onNavigate: (page: string) => void;
  quizData: any;
}

export function WaitingLobby({ onNavigate, quizData }: WaitingLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);

  const avatarColors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
  ];

  const mockNames = [
    'Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery',
    'Quinn', 'Parker', 'Reese', 'Cameron', 'Blake', 'Drew', 'Skyler', 'Dakota'
  ];

  useEffect(() => {
    // Simulate players joining
    const interval = setInterval(() => {
      if (players.length < 12) {
        const newPlayer: Player = {
          id: Date.now().toString(),
          name: mockNames[players.length % mockNames.length],
          avatar: avatarColors[players.length % avatarColors.length],
        };
        setPlayers((prev) => [...prev, newPlayer]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [players.length]);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(quizData.pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{quizData.title}</h1>
          <p className="text-gray-600 mb-6">Waiting for players to join...</p>
          
          {/* PIN Display */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-6">
            <p className="text-white text-lg mb-2">Game PIN</p>
            <div className="flex items-center justify-center gap-4">
              <p className="text-white text-6xl font-bold tracking-wider">{quizData.pin}</p>
              <button
                onClick={handleCopyPin}
                className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                {copied ? (
                  <Check className="size-8 text-white" />
                ) : (
                  <Copy className="size-8 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Player Count */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Users className="size-8 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-gray-600">Players Joined</p>
              <p className="text-3xl font-bold text-gray-800">{players.length}</p>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={() => onNavigate('quiz')}
            disabled={players.length === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-12 py-5 rounded-full font-bold text-2xl hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
          >
            <Play className="size-8" />
            Start Game
          </button>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="bg-white rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`${player.avatar} size-16 rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
                  {player.name[0]}
                </div>
                <p className="font-bold text-gray-800 text-lg">{player.name}</p>
              </div>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 8 - players.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="bg-white/30 border-4 border-dashed border-white rounded-2xl p-6 flex items-center justify-center"
            >
              <div className="size-16 rounded-full bg-white/50 flex items-center justify-center">
                <Users className="size-8 text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
          <p className="text-white text-lg">
            Share the PIN code with participants so they can join at{' '}
            <span className="font-bold">kahoot.it</span>
          </p>
        </div>
      </div>
    </div>
  );
}
