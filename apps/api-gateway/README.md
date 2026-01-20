# API Gateway

主 API 网关服务，负责：

- 用户认证和管理
- 房间创建和管理
- WebSocket 实时同步（视频进度、播放状态）
- WebRTC 信令服务（通话功能）
- 数据库交互

## 目录结构

```
api-gateway/
├── cmd/api/              # 入口文件
├── internal/             # 私有代码
│   ├── handlers/        # HTTP 处理器
│   ├── websocket/       # WebSocket 连接管理
│   ├── webrtc/          # WebRTC 信令
│   ├── models/          # 数据模型
│   ├── middleware/      # 中间件
│   └── database/        # 数据库连接
└── pkg/                 # 可导出的包
```

## 运行

```bash
cd apps/api-gateway
go mod download
go run cmd/api/main.go
```
