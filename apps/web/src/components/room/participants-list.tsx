"use client";

import { Crown, UserPlus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface Participant {
  id: string;
  username: string;
  avatarUrl?: string;
  isOnline: boolean;
  role: 'host' | 'member' | 'guest';
  hasControlPermission: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId?: string;
  isHost?: boolean;
  onManagePermission?: (userId: string) => void;
  onInviteFriend?: () => void;
  className?: string;
}

export function ParticipantsList({
  participants,
  currentUserId,
  isHost = false,
  onManagePermission,
  onInviteFriend,
  className,
}: ParticipantsListProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "glass-card rounded-xl p-4",
        "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
        className
      )}
      style={{ animationDelay: "300ms" }}
    >
      {/* Collapsible Header - Desktop Only */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex items-center justify-between w-full mb-3 text-sm text-white/60 hover:text-white/80 transition-colors"
      >
        <span>参与者 ({participants.length})</span>
        <span className={cn("text-xs transition-transform duration-200", isCollapsed && "rotate-180")}>▼</span>
      </button>

      {/* Static Header - Mobile Only */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/70">参与者</h3>
        <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
          {participants.filter((p) => p.isOnline).length} / {participants.length}
        </span>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {/* Participants List */}
          <div className="space-y-1">
            {participants.map((participant) => {
              const isCurrentUser = participant.id === currentUserId;
              return (
                <div
                  key={participant.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg",
                    "transition-all duration-200",
                    isCurrentUser
                      ? "bg-[oklch(0.75_0.15_195)]/10 border border-[oklch(0.75_0.15_195)]/20"
                      : "hover:bg-white/5"
                  )}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        participant.role === 'host'
                          ? "bg-gradient-to-br from-[oklch(0.75_0.15_195)] to-[oklch(0.7_0.2_320)]"
                          : isCurrentUser
                            ? "bg-gradient-to-br from-[oklch(0.7_0.15_200)] to-[oklch(0.6_0.17_220)]"
                            : "bg-white/10"
                      )}
                    >
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                    {/* Online Status */}
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[oklch(0.08_0.01_280)]",
                        participant.isOnline
                          ? "bg-[oklch(0.7_0.2_150)] shadow-[0_0_8px_oklch(0.7_0.2_150/0.6)]"
                          : "bg-white/20"
                      )}
                    />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {participant.role === 'host' && (
                        <Crown className="h-3 w-3 text-[oklch(0.8_0.15_60)] flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-sm truncate",
                          isCurrentUser ? "text-[oklch(0.75_0.15_195)]" : "text-white/80"
                        )}
                      >
                        {participant.username}
                        {isCurrentUser && (
                          <span className="text-white/40 text-xs ml-1">(你)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {participant.isOnline ? (
                        <span className="text-xs text-[oklch(0.7_0.2_150)]">在线</span>
                      ) : (
                        <span className="text-xs text-white/30">离线</span>
                      )}
                      {participant.hasControlPermission && !participant.role === 'host' && (
                        <span className="flex items-center gap-0.5 text-xs text-[oklch(0.75_0.15_195)]">
                          <Shield className="h-2.5 w-2.5" />
                          可控制
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Permission Button - Only visible to host */}
                  {isHost && !participant.role === 'host' && onManagePermission && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onManagePermission(participant.id)}
                      className={cn(
                        "h-7 w-7 transition-all duration-200",
                        participant.hasControlPermission
                          ? "text-[oklch(0.75_0.15_195)] bg-[oklch(0.75_0.15_195)]/10"
                          : "text-white/30 hover:text-white/60"
                      )}
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Invite Button */}
          {onInviteFriend && (
            <Button
              variant="outline"
              size="sm"
              onClick={onInviteFriend}
              className={cn(
                "w-full mt-4 glass",
                "hover:bg-[oklch(0.75_0.15_195)]/10 hover:border-[oklch(0.75_0.15_195)]/30",
                "hover:text-[oklch(0.75_0.15_195)] hover:neon-glow-subtle",
                "transition-all duration-300"
              )}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              邀请好友
            </Button>
          )}
        </>
      )}
    </div>
  );
}
