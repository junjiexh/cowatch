"use client";

/**
 * TorrentSeeder 组件
 *
 * 房主做种组件：
 * - 支持拖拽上传
 * - 文件选择和验证
 * - 做种状态显示
 * - 本地视频预览
 */

import { useState, useCallback, useRef } from "react";
import { Upload, Film, X, AlertCircle } from "lucide-react";
import { useWebTorrent } from "@/hooks/use-webtorrent";
import { formatBytes, formatSpeed, cn } from "@/lib/utils";
import { SUPPORTED_VIDEO_TYPES, FILE_SIZE_LIMITS } from "@/lib/webtorrent";
import type { SeedResult } from "@/lib/webtorrent";

interface TorrentSeederProps {
  onTorrentReady?: (result: SeedResult) => void;
  onVideoReady?: (videoUrl: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function TorrentSeeder({
  onTorrentReady,
  onVideoReady,
  onError,
  className,
}: TorrentSeederProps) {
  const { state, seedFile, stopSeeding } = useWebTorrent();
  const [isDragging, setIsDragging] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证文件
  const validateFile = useCallback((file: File): string | null => {
    // 检查文件类型
    if (!SUPPORTED_VIDEO_TYPES.includes(file.type) && !file.name.match(/\.(mp4|webm|mkv|ogg)$/i)) {
      return "不支持的视频格式，请上传 MP4, WebM, MKV 或 OGG 格式";
    }

    // 检查文件大小
    if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
      return `文件过大，最大支持 ${formatBytes(FILE_SIZE_LIMITS.MAX_FILE_SIZE)}`;
    }

    return null;
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    // 验证文件
    const error = validateFile(file);
    if (error) {
      onError?.(new Error(error));
      return;
    }

    // 大文件警告
    if (file.size > FILE_SIZE_LIMITS.WARN_FILE_SIZE) {
      console.warn(`文件较大 (${formatBytes(file.size)})，做种可能占用较多带宽`);
    }

    try {
      // 创建本地预览 URL
      const localUrl = URL.createObjectURL(file);
      setLocalVideoUrl(localUrl);
      onVideoReady?.(localUrl);

      // 开始做种
      const result = await seedFile(file);
      onTorrentReady?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
    }
  }, [validateFile, seedFile, onTorrentReady, onVideoReady, onError]);

  // 拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // 点击选择文件
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 停止做种
  const handleStop = useCallback(() => {
    stopSeeding();
    if (localVideoUrl) {
      URL.revokeObjectURL(localVideoUrl);
      setLocalVideoUrl(null);
    }
  }, [stopSeeding, localVideoUrl]);

  // 空闲状态：显示上传区域
  if (state.status === "idle") {
    return (
      <div className={cn("space-y-3", className)}>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer",
            "transition-all duration-300",
            "glass hover:glass-hover",
            isDragging
              ? "border-[oklch(0.75_0.15_195)] bg-[oklch(0.75_0.15_195)]/10 neon-glow-subtle"
              : "border-white/20 hover:border-white/40"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-white/60" />
          <p className="text-white/80 mb-2 font-medium">拖拽视频文件到这里</p>
          <p className="text-white/40 text-sm">或点击选择文件</p>
          <p className="text-white/30 text-xs mt-3">
            支持 MP4, WebM, MKV, OGG 格式
          </p>
          <p className="text-white/30 text-xs">
            最大 {formatBytes(FILE_SIZE_LIMITS.MAX_FILE_SIZE)}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mkv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
      </div>
    );
  }

  // 做种状态：显示状态卡片
  if (state.status === "seeding") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="glass rounded-lg p-4 border border-white/10">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[oklch(0.75_0.15_195)]">
              <Film className="w-5 h-5" />
              <span className="font-medium">正在分享视频</span>
            </div>
            <button
              onClick={handleStop}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="停止分享"
            >
              <X className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          </div>

          {/* 文件信息 */}
          <div className="mb-4 p-3 bg-white/5 rounded border border-white/5">
            <div className="text-sm text-white/80 truncate mb-1">
              {state.fileName}
            </div>
            <div className="text-xs text-white/40">
              {formatBytes(state.fileSize)}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-white/5 rounded border border-white/5">
              <div className="text-white/40 text-xs mb-1">连接数</div>
              <div className="text-white font-mono">{state.numPeers} 人</div>
            </div>
            <div className="p-3 bg-white/5 rounded border border-white/5">
              <div className="text-white/40 text-xs mb-1">上传速度</div>
              <div className="text-green-400 font-mono">
                {formatSpeed(state.uploadSpeed)}
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded border border-white/5">
              <div className="text-white/40 text-xs mb-1">已上传</div>
              <div className="text-white font-mono">
                {formatBytes(state.uploaded)}
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded border border-white/5">
              <div className="text-white/40 text-xs mb-1">InfoHash</div>
              <div className="text-white/60 font-mono text-xs truncate">
                {state.infoHash?.substring(0, 8)}...
              </div>
            </div>
          </div>

          {/* 提示 */}
          {state.numPeers === 0 && (
            <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400 flex items-start gap-2">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                暂无观众连接，请确保已通过 WebSocket 分享 magnet 链接
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 错误状态
  if (state.status === "error" && state.error) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="glass rounded-lg p-4 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-red-400 font-medium mb-1">做种失败</div>
              <div className="text-white/60 text-sm">{state.error.message}</div>
            </div>
          </div>
          <button
            onClick={handleStop}
            className="mt-3 w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition-colors"
          >
            重新选择视频
          </button>
        </div>
      </div>
    );
  }

  return null;
}
