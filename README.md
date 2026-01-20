# Cowatch - 视频流共享平台

一个支持多人实时同步观看视频的 Watch Party 平台。

## 项目结构

```
cowatch/
├── apps/
│   ├── web/                    # Next.js 前端应用
│   ├── api-gateway/            # Go - 主API网关服务
│   └── media-service/          # Go - 视频源解析服务
├── api-specs/                  # API 规范（OpenAPI + WebSocket）
├── docker/                     # Docker 配置
└── pnpm-workspace.yaml         # pnpm monorepo 配置
```

## 功能特性

- 房间管理：创建和加入房间
- 实时通话：WebRTC 音视频通话
- 视频同步：多人同步观看视频
- 进度同步：实时同步播放进度
- 多视频源：支持夸克网盘、Bilibili 等平台

## 技术栈

- **前端**: Next.js + TypeScript
- **后端**: Go (Gin框架)
- **API规范**: OpenAPI 3.0 + WebSocket 协议
- **实时通信**: WebSocket (状态同步) + WebRTC (P2P音视频)
- **数据库**: PostgreSQL + Redis

## API 架构

- **REST API**: 用于 CRUD 操作（房间管理、用户管理等）
- **WebSocket**: 用于实时状态同步（视频进度、聊天消息等）
- **WebRTC**: 用于点对点音视频通话

详细 API 规范请查看 [api-specs/](./api-specs/)

## 快速开始

### 前端开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 后端开发

```bash
# API Gateway
cd apps/api-gateway
go mod download
go run cmd/api/main.go

# Media Service
cd apps/media-service
go mod download
go run cmd/media/main.go
```

### Docker 开发环境

```bash
docker-compose -f docker/docker-compose.yml up
```

## 开发

详细开发文档请查看 [CLAUDE.md](./CLAUDE.md)
