"use client";

/**
 * TorrentStatus 组件
 *
 * 显示 WebTorrent P2P 连接状态的小型指示器
 */

import { Users, ArrowDown, ArrowUp, Circle } from "lucide-react";
import { formatSpeed, cn } from "@/lib/utils";
import type { TorrentState } from "@/lib/webtorrent";

interface TorrentStatusProps {
  state: TorrentState;
  className?: string;
}

export function TorrentStatus({ state, className }: TorrentStatusProps) {
  // 不显示空闲或错误状态
  if (state.status === "idle" || state.status === "error") {
    return null;
  }

  const isSeeding = state.status === "seeding";
  const isDownloading = state.status === "downloading";
  const isReady = state.status === "ready";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 glass rounded-lg border border-white/10",
        "text-xs",
        className
      )}
    >
      {/* 状态指示器 */}
      <div className="flex items-center gap-1.5">
        <Circle
          className={cn(
            "w-2 h-2 fill-current",
            isSeeding && "text-green-400 animate-pulse",
            isDownloading && "text-blue-400 animate-pulse",
            isReady && "text-green-400"
          )}
        />
        <span className="text-white/60">
          {isSeeding && "做种中"}
          {isDownloading && "下载中"}
          {isReady && "已完成"}
        </span>
      </div>

      {/* 连接数 */}
      <div className="flex items-center gap-1">
        <Users className="w-3 h-3 text-white/40" />
        <span className="text-white/80 font-mono">{state.numPeers}</span>
      </div>

      {/* 下载速度（观众） */}
      {(isDownloading || isReady) && state.downloadSpeed > 0 && (
        <div className="flex items-center gap-1">
          <ArrowDown className="w-3 h-3 text-blue-400" />
          <span className="text-blue-400 font-mono">
            {formatSpeed(state.downloadSpeed)}
          </span>
        </div>
      )}

      {/* 上传速度 */}
      {state.uploadSpeed > 0 && (
        <div className="flex items-center gap-1">
          <ArrowUp className="w-3 h-3 text-green-400" />
          <span className="text-green-400 font-mono">
            {formatSpeed(state.uploadSpeed)}
          </span>
        </div>
      )}

      {/* 进度（下载中） */}
      {isDownloading && (
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-[oklch(0.75_0.15_195)] transition-all duration-300"
              style={{ width: `${state.progress * 100}%` }}
            />
          </div>
          <span className="text-white/60 font-mono min-w-[3ch] text-right">
            {Math.round(state.progress * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
