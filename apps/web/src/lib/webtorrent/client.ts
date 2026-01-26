/**
 * WebTorrent 客户端单例
 *
 * 确保整个应用只有一个 WebTorrent 实例，避免资源浪费和冲突
 */

import type WebTorrent from "webtorrent";
import { WEBTORRENT_CONFIG } from "./config";

// WebTorrent 实例（延迟初始化）
let clientInstance: WebTorrent.Instance | null = null;
let initPromise: Promise<WebTorrent.Instance> | null = null;

/**
 * 获取 WebTorrent 客户端实例（单例模式）
 *
 * 使用动态 import 确保只在客户端运行
 */
export async function getWebTorrentClient(): Promise<WebTorrent.Instance> {
  // 已有实例，直接返回
  if (clientInstance) {
    return clientInstance;
  }

  // 正在初始化，等待完成
  if (initPromise) {
    return initPromise;
  }

  // 开始初始化
  initPromise = initializeClient();
  return initPromise;
}

async function initializeClient(): Promise<WebTorrent.Instance> {
  // 确保在浏览器环境运行
  if (typeof window === "undefined") {
    throw new Error("WebTorrent can only be used in browser environment");
  }

  try {
    // 动态 import WebTorrent（避免 SSR 问题）
    const WebTorrent = (await import("webtorrent")).default;

    clientInstance = new WebTorrent(WEBTORRENT_CONFIG);

    // 监听错误事件
    clientInstance.on("error", (err: string | Error) => {
      console.error("[WebTorrent] Client error:", err);
    });

    console.log("[WebTorrent] Client initialized successfully");
    return clientInstance;
  } catch (error) {
    console.error("[WebTorrent] Failed to initialize client:", error);
    initPromise = null;
    throw error;
  }
}

/**
 * 销毁 WebTorrent 客户端
 *
 * 清理所有 torrent 并释放资源
 */
export function destroyWebTorrentClient(): Promise<void> {
  return new Promise((resolve) => {
    if (!clientInstance) {
      resolve();
      return;
    }

    clientInstance.destroy((err) => {
      if (err) {
        console.error("[WebTorrent] Error destroying client:", err);
      } else {
        console.log("[WebTorrent] Client destroyed");
      }

      clientInstance = null;
      initPromise = null;
      resolve();
    });
  });
}

/**
 * 检查客户端是否已初始化
 */
export function isClientInitialized(): boolean {
  return clientInstance !== null;
}

/**
 * 获取当前活跃的 torrent 数量
 */
export function getActiveTorrentsCount(): number {
  return clientInstance?.torrents.length ?? 0;
}
