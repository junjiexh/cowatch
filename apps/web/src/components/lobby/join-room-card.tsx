"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, ArrowRight, Hash } from "lucide-react";
import { getRoomsByRoomCode } from "@/client";

export function JoinRoomCard() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!roomCode.trim() || roomCode.length !== 8) return;

    setIsLoading(true);
    setError(null);

    try {
      // First check if room exists
      const response = await getRoomsByRoomCode({
        path: { roomCode: roomCode.toUpperCase() },
      });

      if (response.data) {
        // Room exists, navigate to it
        router.push(`/room/${roomCode.toUpperCase()}`);
      } else if (response.error) {
        setError(response.error.message || "Room not found");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Join room error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && roomCode.trim() && roomCode.length === 8) {
      handleJoin();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setRoomCode(value);
    if (error) setError(null);
  };

  return (
    <Card className="glass-card hover:bg-white/[0.08] transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "500ms" }}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:border-white/20 group-hover:bg-white/[0.08] transition-all duration-300">
            <Users className="h-8 w-8 text-white/70 group-hover:text-white/90 transition-colors duration-300" />
          </div>
        </div>
        <CardTitle className="text-xl text-white">Join Room</CardTitle>
        <CardDescription className="text-white/50">
          Enter a room code to join a watch party
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
          <Input
            placeholder="ABCD1234"
            value={roomCode}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={`bg-white/5 border-white/10 text-white placeholder:text-white/30 text-center text-lg tracking-[0.2em] font-mono h-14 pl-12 pr-4 focus:border-white/30 focus:ring-white/10 uppercase ${
              error ? "border-red-400/50" : ""
            }`}
            maxLength={8}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}
        <Button
          variant="outline"
          className="w-full border-white/20 hover:bg-white/10 hover:border-white/30 text-white py-6 transition-all duration-300 group/btn"
          style={{
            background: "oklch(1 0 0 / 5%)",
          }}
          size="lg"
          disabled={roomCode.length !== 8 || isLoading}
          onClick={handleJoin}
        >
          {isLoading ? (
            "Joining..."
          ) : (
            <>
              Join Room
              <ArrowRight className="h-5 w-5 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
