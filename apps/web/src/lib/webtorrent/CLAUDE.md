# WebTorrent P2P 视频分发模块

## 概述

本模块实现了基于 WebTorrent 的 P2P 视频分发功能，允许房主直接将本地视频文件分享给房间内的观众，无需上传到服务器。

**核心优势：**
- 零服务器存储成本
- 原始视频质量（无重新编码）
- 观众越多，分发效率越高（互相帮助传输）

## 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                         整体流程                                     │
└─────────────────────────────────────────────────────────────────────┘

房主                         服务器                         观众
  │                           │                              │
  │  1. 选择本地视频文件       │                              │
  │  2. 调用 seedFile()       │                              │
  │          │                │                              │
  │          ▼                │                              │
  │  ┌──────────────┐         │                              │
  │  │ WebTorrent   │         │                              │
  │  │ 生成 magnet  │         │                              │
  │  └──────┬───────┘         │                              │
  │         │                 │                              │
  │  3. 通过 WebSocket        │                              │
  │     分享 magnetURI ──────▶│────── 广播 ─────────────────▶│
  │                           │                              │
  │                           │              4. 收到 magnetURI
  │                           │              5. 调用 downloadTorrent()
  │                           │                      │
  │                           │                      ▼
  │                           │              ┌──────────────┐
  │◀══════════════════════════╪══════════════│ WebTorrent   │
  │         P2P 传输          │              │ 下载 + 播放   │
  │══════════════════════════▶│              └──────────────┘
  │                           │                              │
```

## 文件结构

```
src/lib/webtorrent/
├── CLAUDE.md       # 本文档
├── index.ts        # 模块导出入口
├── types.ts        # TypeScript 类型定义
├── config.ts       # 配置（tracker 服务器、播放参数等）
└── client.ts       # WebTorrent 客户端单例管理

src/hooks/
└── use-webtorrent.ts   # React Hook，封装所有 WebTorrent 操作
```

## 核心概念

### 1. WebTorrent 客户端单例 (`client.ts`)

整个应用只维护一个 WebTorrent 实例，通过 `getWebTorrentClient()` 获取。

```typescript
// 获取客户端（会自动初始化）
const client = await getWebTorrentClient();

// 销毁客户端（通常在应用退出时）
await destroyWebTorrentClient();
```

**为什么用单例：**
- WebTorrent 实例占用资源较多
- 多个实例会导致 P2P 连接冲突
- 方便管理所有 torrent 的生命周期

### 2. 状态管理 (`types.ts`)

```typescript
interface TorrentState {
  status: TorrentStatus;      // 当前状态
  progress: number;           // 下载进度 0-1
  downloadSpeed: number;      // 下载速度 bytes/s
  uploadSpeed: number;        // 上传速度 bytes/s
  numPeers: number;           // 连接的节点数
  magnetURI: string | null;   // magnet 链接
  infoHash: string | null;    // torrent 唯一标识
  fileName: string | null;    // 文件名
  fileSize: number;           // 文件大小
  error: Error | null;        // 错误信息
}

type TorrentStatus =
  | "idle"        // 空闲
  | "seeding"     // 做种中（房主）
  | "downloading" // 下载中（观众）
  | "ready"       // 下载完成
  | "error";      // 出错
```

### 3. useWebTorrent Hook

这是组件使用的主要接口：

```typescript
const {
  state,           // TorrentState - 当前状态
  seedFile,        // (file: File) => Promise<SeedResult> - 房主做种
  stopSeeding,     // () => void - 停止做种
  downloadTorrent, // (magnetURI: string) => Promise<void> - 观众下载
  getStreamURL,    // () => string | null - 获取播放 URL（预留）
  destroy,         // () => void - 清理资源
  reset,           // () => void - 重置状态
  getTorrent,      // () => Torrent | null - 获取底层 torrent 对象
} = useWebTorrent();
```

## 使用方法

### 房主做种

```typescript
import { useWebTorrent } from '@/hooks/use-webtorrent';

function HostVideoUpload() {
  const { state, seedFile } = useWebTorrent();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = async (file: File) => {
    // 1. 本地预览
    const localUrl = URL.createObjectURL(file);
    videoRef.current.src = localUrl;

    // 2. 开始做种
    const result = await seedFile(file);

    // 3. 通过 WebSocket 分享给观众
    socket.send({
      type: 'torrent:seed',
      payload: {
        magnetURI: result.magnetURI,
        fileName: result.fileName,
        fileSize: result.fileSize,
      }
    });
  };

  return (
    <div>
      <input type="file" accept="video/*" onChange={e => handleFileSelect(e.target.files[0])} />
      <video ref={videoRef} controls />
      {state.status === 'seeding' && (
        <div>做种中: {state.numPeers} 个连接, 上传 {formatSpeed(state.uploadSpeed)}</div>
      )}
    </div>
  );
}
```

### 观众下载并播放

```typescript
import { useWebTorrent } from '@/hooks/use-webtorrent';

function ViewerVideoPlayer({ magnetURI }: { magnetURI: string }) {
  const { state, downloadTorrent, getTorrent } = useWebTorrent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  // 开始下载
  useEffect(() => {
    if (magnetURI) {
      downloadTorrent(magnetURI);
    }
  }, [magnetURI]);

  // 缓冲足够后开始播放
  useEffect(() => {
    if (state.progress > 0.02 && !isRendered) {  // 2% 缓冲
      const torrent = getTorrent();
      if (torrent && videoRef.current) {
        const videoFile = torrent.files.find(f => f.name.match(/\.(mp4|webm)$/i));
        if (videoFile) {
          // WebTorrent 的 renderTo 方法会处理流式播放
          videoFile.renderTo(videoRef.current);
          setIsRendered(true);
        }
      }
    }
  }, [state.progress, isRendered]);

  return (
    <div>
      <video ref={videoRef} controls />
      {state.status === 'downloading' && (
        <div>
          下载中: {Math.round(state.progress * 100)}%
          速度: {formatSpeed(state.downloadSpeed)}
        </div>
      )}
    </div>
  );
}
```

## 后续开发指南

### Phase 2: 房主做种组件

需要创建 `src/components/room/torrent-seeder.tsx`:

```typescript
// 功能：
// 1. 拖拽上传区域
// 2. 文件选择
// 3. 做种状态显示（连接数、上传速度）
// 4. 本地视频预览
```

### Phase 3: 观众下载组件

需要创建 `src/components/room/torrent-downloader.tsx`:

```typescript
// 功能：
// 1. 显示下载进度条
// 2. 显示速度统计
// 3. 缓冲足够后自动渲染到 video 元素
```

### Phase 4: WebSocket 信令扩展

需要在后端添加以下事件处理：

```go
// api-gateway/internal/websocket/

// 新增事件类型
"torrent:seed"      // 房主通知做种
"torrent:available" // 服务器广播给观众
"torrent:progress"  // 观众报告进度
"torrent:completed" // 观众下载完成
```

前端 `use-room-socket.ts` 需要处理这些新事件。

### Phase 5: 播放同步

利用现有的 WebSocket 同步机制：

```typescript
// 房主控制
video:play   // 播放
video:pause  // 暂停
video:seek   // 跳转

// 观众响应
// - 接收事件后控制本地 video 元素
// - 需要处理缓冲不足的情况（等待缓冲）
```

## 注意事项

### 1. SSR 兼容

WebTorrent 只能在浏览器运行。使用动态 import 避免 SSR 问题：

```typescript
// client.ts 已处理
const WebTorrent = (await import("webtorrent")).default;
```

组件必须标记 `"use client"`。

### 2. 内存管理

- 大文件不会全部加载到内存
- `file.renderTo()` 使用流式播放
- 组件卸载时调用 `destroy()` 清理资源

### 3. NAT 穿透

依赖公共 tracker 服务器帮助 peer 发现。如果连接失败：

1. 检查防火墙设置
2. 考虑自建 tracker 或 TURN 服务器
3. 查看 `config.ts` 中的 tracker 列表

### 4. 视频格式

推荐使用：
- **MP4 (H.264)** - 最佳兼容性
- **WebM (VP8/VP9)** - 开放格式

MKV 需要浏览器支持 Matroska 容器。

### 5. 错误处理

```typescript
// Hook 会自动更新 state.error
// 组件应该处理错误状态
if (state.error) {
  return <div>错误: {state.error.message}</div>;
}
```

常见错误：
- `WebTorrent can only be used in browser` - SSR 环境
- Tracker 连接失败 - 网络问题
- 无法找到 peers - 房主可能已离开

## 调试技巧

```typescript
// 在浏览器控制台查看 WebTorrent 状态
const client = await getWebTorrentClient();
console.log('Torrents:', client.torrents);
console.log('Download speed:', client.downloadSpeed);
console.log('Upload speed:', client.uploadSpeed);
```

## 相关文档

- [WebTorrent 官方文档](https://webtorrent.io/docs)
- [WebTorrent API](https://github.com/webtorrent/webtorrent/blob/master/docs/api.md)
- 项目 WebSocket 规范: `/api-specs/websocket.md`
