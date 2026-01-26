/**
 * WebTorrent 配置
 */

// 公共 WebTorrent Tracker 服务器
// 这些服务器帮助 peers 发现彼此
export const TRACKER_URLS = [
  // WebTorrent 官方 tracker
  "wss://tracker.openwebtorrent.com",
  // 其他公共 WebSocket tracker
  "wss://tracker.btorrent.xyz",
  "wss://tracker.fastcast.nz",
  "wss://tracker.webtorrent.dev",
];

// WebTorrent 客户端配置
export const WEBTORRENT_CONFIG = {
  // Tracker 配置
  tracker: {
    announce: TRACKER_URLS,
  },
  // 最大连接数
  maxConns: 55,
};

// 播放配置
export const PLAYBACK_CONFIG = {
  // 开始播放的最小缓冲百分比
  MIN_BUFFER_PERCENT: 0.02, // 2%
  // 开始播放的最小缓冲字节数
  MIN_BUFFER_BYTES: 5 * 1024 * 1024, // 5MB
  // 状态更新间隔 (ms)
  UPDATE_INTERVAL: 1000,
};

// 支持的视频格式
export const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/x-matroska", // mkv
];

// 文件大小限制
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024 * 1024, // 10GB
  WARN_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2GB - 显示警告
};
