/**
 * WebTorrent P2P 视频分发模块
 */

// 类型导出
export * from "./types";

// 配置导出
export * from "./config";

// 客户端导出
export {
  getWebTorrentClient,
  destroyWebTorrentClient,
  isClientInitialized,
  getActiveTorrentsCount,
} from "./client";
