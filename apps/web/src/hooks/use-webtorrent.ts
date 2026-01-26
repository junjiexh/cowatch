"use client";

/**
 * WebTorrent Hook
 *
 * 提供 P2P 视频分发的核心功能：
 * - 房主：做种本地视频文件
 * - 观众：下载并流式播放视频
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type WebTorrent from "webtorrent";
import type { Torrent } from "webtorrent";
import {
  getWebTorrentClient,
  destroyWebTorrentClient,
  PLAYBACK_CONFIG,
  type TorrentState,
  type UseWebTorrentReturn,
  type SeedResult,
  initialTorrentState,
} from "@/lib/webtorrent";

export function useWebTorrent(): UseWebTorrentReturn {
  const [state, setState] = useState<TorrentState>(initialTorrentState);

  // refs
  const clientRef = useRef<WebTorrent.Instance | null>(null);
  const torrentRef = useRef<Torrent | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamUrlRef = useRef<string | null>(null);

  // 更新状态的辅助函数
  const updateState = useCallback((updates: Partial<TorrentState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 启动状态更新定时器
  const startUpdateInterval = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(() => {
      const torrent = torrentRef.current;
      if (!torrent) return;

      updateState({
        progress: torrent.progress,
        downloadSpeed: torrent.downloadSpeed,
        uploadSpeed: torrent.uploadSpeed,
        downloaded: torrent.downloaded,
        uploaded: torrent.uploaded,
        numPeers: torrent.numPeers,
      });
    }, PLAYBACK_CONFIG.UPDATE_INTERVAL);
  }, [updateState]);

  // 停止状态更新定时器
  const stopUpdateInterval = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  // ============ 房主方法：做种文件 ============
  const seedFile = useCallback(
    async (file: File): Promise<SeedResult> => {
      try {
        updateState({
          status: "seeding",
          error: null,
          fileName: file.name,
          fileSize: file.size,
        });

        // 获取 WebTorrent 客户端
        const client = await getWebTorrentClient();
        clientRef.current = client;

        // 开始做种
        return new Promise((resolve, reject) => {
          client.seed(file, (torrent: Torrent) => {
            torrentRef.current = torrent;

            const result: SeedResult = {
              magnetURI: torrent.magnetURI,
              infoHash: torrent.infoHash,
              fileName: file.name,
              fileSize: file.size,
            };

            updateState({
              magnetURI: torrent.magnetURI,
              infoHash: torrent.infoHash,
              progress: 1, // 做种者已有完整文件
            });

            // 启动状态更新
            startUpdateInterval();

            // 监听事件
            torrent.on("upload", () => {
              // upload 事件在每次上传数据时触发
              // 状态会通过定时器更新
            });

            torrent.on("error", (err: string | Error) => {
              console.error("[WebTorrent] Torrent error:", err);
              const error = typeof err === "string" ? new Error(err) : err;
              updateState({ error });
            });

            console.log("[WebTorrent] Seeding started:", torrent.infoHash);
            resolve(result);
          });
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        updateState({ status: "error", error: err });
        throw err;
      }
    },
    [updateState, startUpdateInterval]
  );

  // ============ 房主方法：停止做种 ============
  const stopSeeding = useCallback(() => {
    stopUpdateInterval();

    if (torrentRef.current && clientRef.current) {
      clientRef.current.remove(torrentRef.current);
      torrentRef.current = null;
    }

    updateState({
      status: "idle",
      progress: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      numPeers: 0,
    });

    console.log("[WebTorrent] Stopped seeding");
  }, [updateState, stopUpdateInterval]);

  // ============ 观众方法：下载 torrent ============
  const downloadTorrent = useCallback(
    async (magnetURI: string): Promise<void> => {
      try {
        updateState({
          status: "downloading",
          error: null,
          magnetURI,
          progress: 0,
        });

        // 获取 WebTorrent 客户端
        const client = await getWebTorrentClient();
        clientRef.current = client;

        // 添加 torrent（WebTorrent 会自动处理重复）
        client.add(magnetURI, (torrent: Torrent) => {
          torrentRef.current = torrent;

          // 获取视频文件信息
          const videoFile = torrent.files.find((file) =>
            file.name.match(/\.(mp4|webm|mkv|ogg)$/i)
          );

          updateState({
            infoHash: torrent.infoHash,
            fileName: videoFile?.name || torrent.files[0]?.name || "unknown",
            fileSize: torrent.length,
          });

          // 启动状态更新
          startUpdateInterval();

          // 监听下载进度
          torrent.on("download", () => {
            // 进度会通过定时器更新
          });

          // 监听下载完成
          torrent.on("done", () => {
            updateState({ status: "ready", progress: 1 });
            console.log("[WebTorrent] Download complete");
          });

          // 监听错误
          torrent.on("error", (err: string | Error) => {
            console.error("[WebTorrent] Torrent error:", err);
            const error = typeof err === "string" ? new Error(err) : err;
            updateState({ status: "error", error });
          });

          console.log("[WebTorrent] Download started:", torrent.infoHash);
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        updateState({ status: "error", error: err });
        throw err;
      }
    },
    [updateState, startUpdateInterval]
  );

  // ============ 观众方法：获取流式播放 URL ============
  const getStreamURL = useCallback((): string | null => {
    const torrent = torrentRef.current;
    if (!torrent || torrent.files.length === 0) {
      return null;
    }

    // 如果已经生成过 URL，直接返回
    if (streamUrlRef.current) {
      return streamUrlRef.current;
    }

    // 找到视频文件
    const videoFile =
      torrent.files.find((file) =>
        file.name.match(/\.(mp4|webm|mkv|ogg)$/i)
      ) || torrent.files[0];

    if (!videoFile) {
      return null;
    }

    // 检查是否有足够的缓冲来开始播放
    const bufferedBytes = torrent.downloaded;
    const minBufferBytes = Math.min(
      PLAYBACK_CONFIG.MIN_BUFFER_BYTES,
      torrent.length * PLAYBACK_CONFIG.MIN_BUFFER_PERCENT
    );

    if (bufferedBytes < minBufferBytes && torrent.progress < 1) {
      // 缓冲不足
      return null;
    }

    // 创建 Blob URL 用于播放
    // 注意：这里使用 getBlobURL 方法（如果可用）或创建 stream
    try {
      // WebTorrent 的 file.getBlobURL 会在文件下载完成后返回 Blob URL
      // 对于流式播放，我们需要使用 renderTo 或 createReadStream
      // 这里先返回 null，在组件中使用 renderTo 方法
      return null;
    } catch {
      return null;
    }
  }, []);

  // ============ 通用方法：销毁 ============
  const destroy = useCallback(() => {
    stopUpdateInterval();

    // 清理 stream URL
    if (streamUrlRef.current) {
      URL.revokeObjectURL(streamUrlRef.current);
      streamUrlRef.current = null;
    }

    // 移除 torrent
    if (torrentRef.current && clientRef.current) {
      clientRef.current.remove(torrentRef.current);
      torrentRef.current = null;
    }

    setState(initialTorrentState);
    console.log("[WebTorrent] Hook destroyed");
  }, [stopUpdateInterval]);

  // ============ 通用方法：重置 ============
  const reset = useCallback(() => {
    destroy();
  }, [destroy]);

  // ============ 获取 torrent 引用（供组件使用）============
  // 这个方法允许组件直接访问 torrent 对象来使用 renderTo
  const getTorrent = useCallback((): Torrent | null => {
    return torrentRef.current;
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopUpdateInterval();
      // 注意：不销毁 client，因为可能被其他组件使用
    };
  }, [stopUpdateInterval]);

  return {
    state,
    seedFile,
    stopSeeding,
    downloadTorrent,
    getStreamURL,
    destroy,
    reset,
    // 额外导出 getTorrent 方法供高级用法
    getTorrent,
  } as UseWebTorrentReturn & { getTorrent: () => Torrent | null };
}

export default useWebTorrent;
