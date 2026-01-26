/**
 * WebTorrent P2P 视频分发 - 类型定义
 */

import type { Torrent, TorrentFile } from "webtorrent";

// ============ Torrent 状态 ============

export type TorrentStatus =
  | "idle" // 空闲，未开始
  | "seeding" // 做种中（房主）
  | "downloading" // 下载中（观众）
  | "ready" // 下载完成，可播放
  | "error"; // 出错

export interface TorrentState {
  status: TorrentStatus;
  progress: number; // 下载进度 0-1
  downloadSpeed: number; // 下载速度 bytes/s
  uploadSpeed: number; // 上传速度 bytes/s
  downloaded: number; // 已下载字节数
  uploaded: number; // 已上传字节数
  numPeers: number; // 连接的节点数
  magnetURI: string | null; // magnet 链接
  infoHash: string | null; // torrent 标识
  fileName: string | null; // 文件名
  fileSize: number; // 文件大小
  error: Error | null; // 错误信息
}

export const initialTorrentState: TorrentState = {
  status: "idle",
  progress: 0,
  downloadSpeed: 0,
  uploadSpeed: 0,
  downloaded: 0,
  uploaded: 0,
  numPeers: 0,
  magnetURI: null,
  infoHash: null,
  fileName: null,
  fileSize: 0,
  error: null,
};

// ============ Hook 返回类型 ============

export interface UseWebTorrentReturn {
  state: TorrentState;

  // 房主方法
  seedFile: (file: File) => Promise<SeedResult>;
  stopSeeding: () => void;

  // 观众方法
  downloadTorrent: (magnetURI: string) => Promise<void>;
  getStreamURL: () => string | null;

  // 通用方法
  destroy: () => void;
  reset: () => void;
}

export interface SeedResult {
  magnetURI: string;
  infoHash: string;
  fileName: string;
  fileSize: number;
}

// ============ WebSocket 事件 Payload ============

export interface TorrentSeedPayload {
  magnetURI: string;
  infoHash: string;
  fileName: string;
  fileSize: number;
}

export interface TorrentAvailablePayload {
  magnetURI: string;
  infoHash: string;
  fileName: string;
  fileSize: number;
  seederCount: number;
}

export interface TorrentProgressPayload {
  infoHash: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
}

export interface TorrentCompletedPayload {
  infoHash: string;
}

// ============ 辅助类型 ============

export interface TorrentInfo {
  magnetURI: string;
  infoHash: string;
  fileName: string;
  fileSize: number;
}

// Re-export webtorrent types for convenience
export type { Torrent, TorrentFile };
