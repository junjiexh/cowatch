"use client";

import { Copy, Check, Settings, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CallButton } from "./call-button";
import { VideoSourceInput } from "./video-source-input";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface RoomHeaderProps {
  roomName?: string;
  roomCode: string;
  isInCall?: boolean;
  participantCount?: number;
  isHost?: boolean;
  hasPermission?: boolean;
  onJoinCall?: () => void;
  onLeaveCall?: () => void;
  onAddVideo?: (url: string) => Promise<void>;
  isAddingVideo?: boolean;
  onSettings?: () => void;
  onShare?: () => void;
  className?: string;
}

export function RoomHeader({
  roomName = "观影房间",
  roomCode,
  isInCall = false,
  participantCount = 0,
  isHost = false,
  hasPermission = false,
  onJoinCall,
  onLeaveCall,
  onAddVideo,
  isAddingVideo = false,
  onSettings,
  onShare,
  className,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "glass-card rounded-xl p-4 sm:p-6",
        "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
        "style={{ animationDelay: '100ms' }}",
        className
      )}
      style={{ animationDelay: "100ms" }}
    >
      {/* Room Info Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Room Name & Code */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white/90 neon-text">
              {roomName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/40 text-sm">房间代码:</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[oklch(0.75_0.15_195)/30] transition-all duration-300 group"
              >
                <code className="font-mono text-sm text-[oklch(0.75_0.15_195)] tracking-wider">
                  {roomCode}
                </code>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[oklch(0.7_0.2_30)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-white/40 group-hover:text-white/60 transition-colors" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <CallButton
            isInCall={isInCall}
            participantCount={participantCount}
            onJoinCall={onJoinCall}
            onLeaveCall={onLeaveCall}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onShare}
            className="glass hover:bg-white/10 transition-all duration-300 text-white/60 hover:text-white"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {isHost && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onSettings}
              className="glass hover:bg-white/10 transition-all duration-300 text-white/60 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Video Source Input - Only visible to host/privileged users */}
      {(isHost || hasPermission) && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <VideoSourceInput onAddVideo={onAddVideo} isProcessing={isAddingVideo} />
        </div>
      )}
    </div>
  );
}
