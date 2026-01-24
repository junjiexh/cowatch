"use client";

import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

interface VideoControlsProps {
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  isMuted?: boolean;
  isFullscreen?: boolean;
  canControl?: boolean;
  onPlayPause?: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onMuteToggle?: () => void;
  onFullscreenToggle?: () => void;
  className?: string;
}

export function VideoControls({
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  volume = 100,
  isMuted = false,
  isFullscreen = false,
  canControl = true,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  className,
}: VideoControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewTime, setPreviewTime] = useState(currentTime);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) {
      setPreviewTime(currentTime);
    }
  }, [currentTime, isDragging]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canControl || !onSeek) return;

    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * duration);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canControl || !onSeek) return;

    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setPreviewTime(percentage * duration);
  };

  const progressPercentage = duration > 0 ? (previewTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "glass-card rounded-xl p-4",
        "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
        className
      )}
      style={{ animationDelay: "200ms" }}
    >
      {/* Progress Bar */}
      <div
        ref={progressRef}
        className={cn(
          "relative h-2 bg-white/5 rounded-full mb-4 cursor-pointer group",
          canControl || "pointer-events-none"
        )}
        onClick={handleProgressClick}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={isDragging ? handleProgressDrag : undefined}
      >
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-100"
          style={{
            width: `${progressPercentage}%`,
            background: `linear-gradient(90deg, oklch(0.75 0.15 195), oklch(0.65 0.17 200))`,
            boxShadow: isDragging
              ? "0 0 20px oklch(0.75 0.15 195 / 60%), 0 0 40px oklch(0.75 0.15 195 / 30%)"
              : "none",
          }}
        />

        {/* Progress handle */}
        {canControl && (
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              isDragging && "opacity-100 scale-125"
            )}
            style={{
              left: `calc(${progressPercentage}% - 8px)`,
              boxShadow: "0 0 10px oklch(0.75 0.15 195 / 50%)",
            }}
          />
        )}

        {/* Hover preview */}
        <div className="absolute inset-0 rounded-full bg-[oklch(0.75_0.15_195)]/0 group-hover:bg-[oklch(0.75_0.15_195)]/10 transition-colors" />
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Play/Pause and Skip */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSkipBack}
            disabled={!canControl}
            className="glass hover:bg-white/10 hover:neon-glow-subtle transition-all duration-300 text-white/60 hover:text-white disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            disabled={!canControl}
            className={cn(
              "glass hover:bg-white/10 hover:neon-glow-subtle transition-all duration-300 text-white/80 hover:text-white",
              "h-10 w-10 disabled:opacity-50"
            )}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSkipForward}
            disabled={!canControl}
            className="glass hover:bg-white/10 hover:neon-glow-subtle transition-all duration-300 text-white/60 hover:text-white disabled:opacity-50"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* Time Display */}
          <div className="text-sm text-white/60 font-mono hidden sm:block">
            {formatTime(previewTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Right: Volume and Fullscreen */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMuteToggle}
            disabled={!canControl}
            className="glass hover:bg-white/10 hover:neon-glow-subtle transition-all duration-300 text-white/60 hover:text-white disabled:opacity-50"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onFullscreenToggle}
            className="glass hover:bg-white/10 hover:neon-glow-subtle transition-all duration-300 text-white/60 hover:text-white"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Time Display */}
      <div className="text-sm text-white/60 font-mono sm:hidden mt-2 text-center">
        {formatTime(previewTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}
