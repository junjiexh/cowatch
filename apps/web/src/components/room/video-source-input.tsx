"use client";

import { useState } from "react";
import { Link2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoSourceInputProps {
  onAddVideo?: (url: string) => Promise<void>;
  isProcessing?: boolean;
  className?: string;
}

export function VideoSourceInput({
  onAddVideo,
  isProcessing = false,
  className,
}: VideoSourceInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("请输入视频链接");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError("请输入有效的链接");
      return;
    }

    try {
      await onAddVideo?.(url);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加视频失败");
    }
  };

  const supportedPlatforms = [
    { name: "Bilibili", placeholder: "https://www.bilibili.com/video/..." },
    { name: "YouTube", placeholder: "https://www.youtube.com/watch?v=..." },
    { name: "夸克网盘", placeholder: "夸克网盘分享链接..." },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="粘贴视频链接 (Bilibili/YouTube/夸克)"
            disabled={isProcessing}
            className={cn(
              "w-full h-9 pl-10 pr-4 glass rounded-lg",
              "border border-white/10 text-white/90 placeholder:text-white/30",
              "focus:neon-border focus:outline-none transition-all duration-300",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        </div>
        <Button
          type="submit"
          disabled={isProcessing || !url.trim()}
          className={cn(
            "bg-gradient-to-r from-[oklch(0.75_0.15_195)] to-[oklch(0.65_0.17_200)]",
            "hover:from-[oklch(0.8_0.15_195)] hover:to-[oklch(0.7_0.17_200)]",
            "text-white neon-glow-subtle hover:neon-glow",
            "transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">添加</span>
            </>
          )}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-[oklch(0.65_0.2_30)] flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-white/30">
        <span>支持:</span>
        {supportedPlatforms.map((platform) => (
          <span
            key={platform.name}
            className="px-2 py-0.5 rounded bg-white/5 border border-white/5"
          >
            {platform.name}
          </span>
        ))}
      </div>
    </div>
  );
}
