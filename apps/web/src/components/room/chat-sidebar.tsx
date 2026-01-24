"use client";

import { Crown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { ParticipantsList, type Participant } from "./participants-list";

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;  // Unix milliseconds timestamp
  isHost?: boolean;
}

interface ChatSidebarProps {
  messages: ChatMessage[];
  participants: Participant[];
  currentUserId?: string;
  isHost?: boolean;
  onSendMessage?: (content: string) => void;
  onManagePermission?: (userId: string) => void;
  onInviteFriend?: () => void;
  className?: string;
}

export function ChatSidebar({
  messages,
  participants,
  currentUserId,
  isHost = false,
  onSendMessage,
  onManagePermission,
  onInviteFriend,
  className,
}: ChatSidebarProps) {
  const [input, setInput] = useState("");
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !onSendMessage) return;

    onSendMessage(input.trim());
    setInput("");
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
        className
      )}
      style={{ animationDelay: "250ms" }}
    >
      {/* Tab Switcher - Mobile Only */}
      <div className="flex md:hidden gap-2">
        <button
          onClick={() => setShowParticipants(false)}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg glass text-sm font-medium transition-all duration-200",
            !showParticipants
              ? "bg-[oklch(0.75_0.15_195)]/20 text-[oklch(0.75_0.15_195)] border-[oklch(0.75_0.15_195)]/30"
              : "text-white/60 hover:text-white/80"
          )}
        >
          聊天
        </button>
        <button
          onClick={() => setShowParticipants(true)}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg glass text-sm font-medium transition-all duration-200",
            showParticipants
              ? "bg-[oklch(0.75_0.15_195)]/20 text-[oklch(0.75_0.15_195)] border-[oklch(0.75_0.15_195)]/30"
              : "text-white/60 hover:text-white/80"
          )}
        >
          参与者 ({participants.length})
        </button>
      </div>

      {/* Participants - Desktop always visible, Mobile controlled by tab */}
      <div className={cn("hidden md:block", showParticipants && "block md:block")}>
        <ParticipantsList
          participants={participants}
          currentUserId={currentUserId}
          isHost={isHost}
          onManagePermission={onManagePermission}
          onInviteFriend={onInviteFriend}
        />
      </div>

      {/* Chat - Desktop always visible, Mobile controlled by tab */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-0",
          !showParticipants ? "block md:block" : "hidden md:block"
        )}
      >
        <div className="glass-card rounded-xl p-4 flex flex-col h-full max-h-[500px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0 mb-3 pr-1 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/30 text-sm">
                暂无消息，开始聊天吧~
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.userId === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col gap-1",
                      isCurrentUser && "items-end"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        isCurrentUser ? "text-white/40" : "text-white/50"
                      )}
                    >
                      {message.isHost && (
                        <Crown className="h-3 w-3 text-[oklch(0.8_0.15_60)]" />
                      )}
                      <span className="font-medium">{message.username}</span>
                      <span>{formatTime(message.timestamp)}</span>
                    </div>
                    <div
                      className={cn(
                        "max-w-[85%] px-3 py-2 rounded-lg text-sm break-words",
                        isCurrentUser
                          ? "bg-[oklch(0.75_0.15_195)]/15 border border-[oklch(0.75_0.15_195)]/30 text-white/90"
                          : "glass text-white/80"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-white/5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入消息..."
              className={cn(
                "flex-1 px-3 py-2 glass rounded-lg text-sm",
                "border border-white/10 text-white/90 placeholder:text-white/30",
                "focus:neon-border focus:outline-none transition-all duration-300"
              )}
            />
            <Button
              type="submit"
              disabled={!input.trim()}
              size="icon-sm"
              className={cn(
                "bg-gradient-to-r from-[oklch(0.75_0.15_195)] to-[oklch(0.65_0.17_200)]",
                "hover:from-[oklch(0.8_0.15_195)] hover:to-[oklch(0.7_0.17_200)]",
                "text-white neon-glow-subtle hover:neon-glow",
                "transition-all duration-300",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
