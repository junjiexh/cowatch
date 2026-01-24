"use client";

import { Phone, PhoneOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CallButtonProps {
  isInCall?: boolean;
  participantCount?: number;
  onJoinCall?: () => void;
  onLeaveCall?: () => void;
  className?: string;
}

export function CallButton({
  isInCall = false,
  participantCount = 0,
  onJoinCall,
  onLeaveCall,
  className,
}: CallButtonProps) {
  if (isInCall) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onLeaveCall}
        className={cn(
          "glass border-[oklch(0.75_0.15_195)/30] text-[oklch(0.75_0.15_195)] hover:bg-[oklch(0.75_0.15_195)/10] hover:neon-glow-subtle transition-all duration-300",
          className
        )}
      >
        <PhoneOff className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">通话中</span>
        <span className="flex items-center gap-1 ml-1">
          (<Users className="h-3 w-3" /> {participantCount})
        </span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onJoinCall}
      className={cn(
        "glass hover:bg-[oklch(0.75_0.15_195)/20] hover:border-[oklch(0.75_0.15_195)/50] hover:text-[oklch(0.75_0.15_195)] hover:neon-glow-subtle transition-all duration-300",
        className
      )}
    >
      <Phone className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">发起通话</span>
    </Button>
  );
}
