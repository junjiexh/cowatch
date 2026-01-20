"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Play, ChevronRight, Loader2 } from "lucide-react";
import { getUsersMeRecentRooms } from "@/client";
import type { RecentRoom as RecentRoomType } from "@/client/types.gen";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function RecentRooms() {
  const router = useRouter();
  const [recentRooms, setRecentRooms] = useState<RecentRoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    const fetchRecentRooms = async () => {
      try {
        const response = await getUsersMeRecentRooms({
          query: { limit: 5 },
        });

        if (response.data) {
          setRecentRooms(response.data);
        } else if (response.error) {
          // If 401, user is not logged in
          if (response.error.code === "UNAUTHORIZED") {
            setIsLoggedIn(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch recent rooms:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentRooms();
  }, []);

  const handleRoomClick = (roomCode: string) => {
    router.push(`/room/${roomCode}`);
  };

  // Don't show section if loading, not logged in, or no rooms
  if (isLoading) {
    return (
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "600ms" }}>
            <CardContent className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 text-white/50 animate-spin" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!isLoggedIn || recentRooms.length === 0) {
    return null;
  }

  return (
    <section className="px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "600ms" }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-white/70 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Rooms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRooms.map((recentRoom) => (
              <button
                key={recentRoom.room.id}
                onClick={() => handleRoomClick(recentRoom.room.code)}
                className="w-full p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-white/5 group-hover:bg-[oklch(0.75_0.15_195_/_15%)] border border-white/5 group-hover:border-[oklch(0.75_0.15_195_/_30%)] transition-all duration-300">
                    <Play className="h-4 w-4 text-white/40 group-hover:text-[oklch(0.75_0.15_195)] transition-colors duration-300" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/90 font-medium">
                      Room #{recentRoom.room.code}
                      <span className="text-white/40 font-normal ml-2">
                        {recentRoom.room.name}
                      </span>
                    </p>
                    {recentRoom.lastWatchedVideoTitle && (
                      <p className="text-sm text-white/40 mt-0.5">
                        Last watched: {recentRoom.lastWatchedVideoTitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/30">
                    {formatRelativeTime(recentRoom.lastVisited)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-300" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
