import { useEffect, useMemo, useState } from "react";
import { Users, Play, Copy, Check } from "lucide-react";
import { Socket } from "socket.io-client";
import { t } from "@/app/utils/i18n";

interface Player {
  userId: string;
  userName: string;
  score: number;
}

interface WaitingLobbyProps {
  onNavigate: (page: "home" | "create" | "waiting" | "quiz", data?: any) => void;
  quizData: { roomCode: string; quizTitle: string; quizId?: string };
  socket: Socket | null;
}

export function WaitingLobby({ onNavigate, quizData, socket }: WaitingLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarColors = useMemo(
    () => [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ],
    []
  );

  const getAvatarColor = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash + userId.charCodeAt(i)) % avatarColors.length;
    }
    return avatarColors[hash];
  };

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (payload: any) => {
      if (payload?.players) {
        setPlayers(payload.players);
      }
    };

    const handlePlayerLeft = () => {
      socket.emit("get_room_state", (state: any) => {
        if (state?.players) {
          setPlayers(state.players);
        }
      });
    };

    socket.on("player_joined", handlePlayerJoined);
    socket.on("player_left", handlePlayerLeft);
    socket.on("room_closed", (payload: any) => {
      setError(payload?.reason || "Room closed");
      onNavigate("home");
    });

    socket.emit("get_room_state", (state: any) => {
      if (state?.players) {
        setPlayers(state.players);
      }
    });

    return () => {
      socket.off("player_joined", handlePlayerJoined);
      socket.off("player_left", handlePlayerLeft);
    };
  }, [socket, onNavigate]);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(quizData.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    if (!socket) {
      setError("Socket not connected");
      return;
    }
    socket.emit("start_quiz", (response: any) => {
      if (response?.error) {
        setError(response.error);
        return;
      }
      onNavigate("quiz", {
        mode: "host",
        roomCode: quizData.roomCode,
        quizTitle: quizData.quizTitle,
        quizId: quizData.quizId,
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{quizData.quizTitle}</h1>
          <p className="text-gray-600 mb-6">{t("Waiting for players to join...")}</p>
          {error && <div className="text-red-600 font-semibold mb-4">{error}</div>}

          {/* PIN Display */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-6">
            <p className="text-white text-lg mb-2">{t("Game PIN")}</p>
            <div className="flex items-center justify-center gap-4">
              <p className="text-white text-6xl font-bold tracking-wider">
                {quizData.roomCode}
              </p>
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
              <p className="text-gray-600">{t("Players Joined")}</p>
              <p className="text-3xl font-bold text-gray-800">{players.length}</p>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={players.length === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-12 py-5 rounded-full font-bold text-2xl hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
          >
            <Play className="size-8" />
            {t("Start Game")}
          </button>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {players.map((player, index) => (
            <div
              key={player.userId}
              className="bg-white rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`${getAvatarColor(
                    player.userId
                  )} size-16 rounded-full flex items-center justify-center text-white text-2xl font-bold`}
                >
                  {player.userName[0]?.toUpperCase()}
                </div>
                <p className="font-bold text-gray-800 text-lg">{player.userName}</p>
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
            {t("Share the PIN code with participants so they can join at")}{" "}
            <span className="font-bold">localhost</span>
          </p>
        </div>
      </div>
    </div>
  );
}
