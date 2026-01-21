"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Crown, Plus, Sparkles, Copy, Check } from "lucide-react";
import { postRooms } from "@/client";
import type { Room } from "@/client/types.gen";

export function CreateRoomCard() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!roomName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await postRooms({
        body: {
          name: roomName.trim(),
        },
      });

      if (response.data) {
        setCreatedRoom(response.data);
      } else if (response.error) {
        setError(response.error.message || "Failed to create room");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Create room error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (createdRoom?.code) {
      await navigator.clipboard.writeText(createdRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEnterRoom = () => {
    if (createdRoom?.code) {
      router.push(`/room/${createdRoom.code}`);
    }
  };

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setRoomName("");
      setCreatedRoom(null);
      setError(null);
      setCopied(false);
    }
  };

  return (
    <Card className="glass-card hover:bg-white/[0.08] transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: "400ms" }}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 relative">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[oklch(0.75_0.15_195_/_20%)] to-[oklch(0.75_0.15_195_/_5%)] border border-[oklch(0.75_0.15_195_/_30%)] group-hover:neon-glow-subtle transition-all duration-500">
            <Crown className="h-8 w-8 text-[oklch(0.75_0.15_195)]" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-[oklch(0.75_0.15_195)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardTitle className="text-xl text-white">Create Room</CardTitle>
        <CardDescription className="text-white/50">
          Start a watch party as the host
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogTrigger asChild>
            <Button
              className="w-full font-semibold text-base py-6 transition-all duration-300 neon-glow-subtle hover:neon-glow"
              style={{
                background: "linear-gradient(135deg, oklch(0.75 0.15 195), oklch(0.65 0.18 200))",
                color: "oklch(0.1 0 0)",
              }}
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10 sm:max-w-md">
            {!createdRoom ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">Create New Room</DialogTitle>
                  <DialogDescription className="text-white/50">
                    Give your watch party a name and invite your friends
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-name" className="text-white/80">
                      Room Name
                    </Label>
                    <Input
                      id="room-name"
                      placeholder="Movie Night with Friends"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[oklch(0.75_0.15_195_/_50%)] focus:ring-[oklch(0.75_0.15_195_/_20%)] h-12"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}
                  <Button
                    onClick={handleCreate}
                    disabled={!roomName.trim() || isLoading}
                    className="w-full font-semibold py-6 transition-all duration-300"
                    style={{
                      background: roomName.trim()
                        ? "linear-gradient(135deg, oklch(0.75 0.15 195), oklch(0.65 0.18 200))"
                        : "oklch(0.3 0 0)",
                      color: roomName.trim() ? "oklch(0.1 0 0)" : "oklch(0.5 0 0)",
                    }}
                  >
                    {isLoading ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">Room Created!</DialogTitle>
                  <DialogDescription className="text-white/50">
                    Share the room code with your friends
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Room Code</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-center">
                        <span className="text-2xl font-mono tracking-[0.3em] text-white">
                          {createdRoom.code}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-auto aspect-square border-white/20 hover:bg-white/10"
                        onClick={handleCopyCode}
                      >
                        {copied ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <Copy className="h-5 w-5 text-white/70" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-md p-3">
                    <p className="text-sm text-white/60">
                      Room: <span className="text-white/90">{createdRoom.name}</span>
                    </p>
                  </div>
                  <Button
                    onClick={handleEnterRoom}
                    className="w-full font-semibold py-6 transition-all duration-300"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.75 0.15 195), oklch(0.65 0.18 200))",
                      color: "oklch(0.1 0 0)",
                    }}
                  >
                    Enter Room
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
