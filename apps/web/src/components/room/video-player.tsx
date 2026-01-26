"use client";

import { useRef, useEffect } from "react";
import { Play, AlertCircle, Film } from "lucide-react";
import { cn } from "@/lib/utils";

type VideoState = "idle" | "loading" | "playing" | "paused" | "error";

interface VideoPlayerProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  poster?: string;
  state?: VideoState;
  errorMessage?: string;
  seekToTime?: number; // 当这个值变化时，视频会 seek 到指定时间
  onPlay?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  className?: string;
}

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  poster,
  state = "idle",
  errorMessage,
  seekToTime,
  onPlay,
  onTimeUpdate,
  onDurationChange,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // 根据 state 变化控制视频播放/暂停
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (state === "playing") {
      video.play().catch((err) => {
        console.error("[VideoPlayer] Play failed:", err);
      });
    } else if (state === "paused") {
      video.pause();
    }
  }, [state, videoUrl]);

  // 处理 seek 操作
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl || seekToTime === undefined) return;

    // 只有当差异超过 0.5 秒时才 seek，避免频繁更新
    if (Math.abs(video.currentTime - seekToTime) > 0.5) {
      video.currentTime = seekToTime;
    }
  }, [seekToTime, videoUrl]);
  const renderContent = () => {
    switch (state) {
      case "loading":
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[oklch(0.05_0_0)]">
            {/* Animated loader with neon glow */}
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
              <div
                className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[oklch(0.75_0.15_195)] rounded-full animate-spin"
                style={{
                  filter: "drop-shadow(0 0 10px oklch(0.75 0.15 195 / 60%))",
                }}
              />
            </div>
            <p className="mt-4 text-white/40 text-sm animate-pulse">加载中...</p>
          </div>
        );

      case "error":
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[oklch(0.05_0_0)]">
            <div className="glass-card rounded-xl p-6 max-w-sm mx-4 text-center">
              <AlertCircle className="h-12 w-12 text-[oklch(0.65_0.2_30)] mx-auto mb-3" />
              <p className="text-white/60 text-sm">{errorMessage || "视频加载失败"}</p>
            </div>
          </div>
        );

      case "idle":
        return (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-[oklch(0.05_0_0)] cursor-pointer group"
            onClick={onPlay}
          >
            {poster || thumbnailUrl ? (
              <img
                src={poster || thumbnailUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
            ) : null}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0_0_0/0.8)] via-transparent to-[oklch(0_0_0/0.4)]" />

            {/* Play button */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br from-[oklch(0.75_0.15_195)] to-[oklch(0.65_0.17_200)]",
                  "neon-glow-subtle hover:neon-glow",
                  "transition-all duration-300 group-hover:scale-110"
                )}
              >
                <Play className="h-8 w-8 text-white ml-1" fill="currentColor" />
              </div>
              <p className="mt-4 text-white/60 text-sm group-hover:text-white/80 transition-colors">
                点击播放视频
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.05_0_0)]">
            {videoUrl ? (
              <video
                ref={videoRef}
                className="w-full h-full"
                src={videoUrl}
                poster={poster}
                controls={false}
                onTimeUpdate={(e) => {
                  const video = e.currentTarget;
                  onTimeUpdate?.(video.currentTime);
                }}
                onDurationChange={(e) => {
                  const video = e.currentTarget;
                  onDurationChange?.(video.duration);
                }}
              />
            ) : (
              <div className="flex flex-col items-center text-white/20">
                <Film className="h-16 w-16 mb-2" />
                <p className="text-sm">暂无视频</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "relative w-full aspect-video rounded-xl overflow-hidden bg-[oklch(0.05_0_0)]",
        "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
        className
      )}
      style={{ animationDelay: "150ms" }}
    >
      {/* Content */}
      {renderContent()}

      {/* Subtle scanline effect overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            oklch(1 0 0 / 0.1) 2px,
            oklch(1 0 0 / 0.1) 4px
          )`,
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[oklch(0.75_0.15_195)]/20 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-[oklch(0.75_0.15_195)]/20 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-[oklch(0.75_0.15_195)]/20 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[oklch(0.75_0.15_195)]/20 rounded-br-xl" />
    </div>
  );
}
