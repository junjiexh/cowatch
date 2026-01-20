# Web 应用

视频流共享平台的前端应用

## 目录结构

```
web/
├── src/
│   ├── types/              # 类型定义
│   │   ├── api.d.ts       # REST API 类型（自动生成）
│   │   └── websocket.ts   # WebSocket 事件类型
│   ├── lib/               # 客户端库
│   │   ├── api-client.ts  # REST API 客户端
│   │   └── websocket-client.ts # WebSocket 客户端
│   └── examples/          # 使用示例
│       └── usage.ts       # API 和 WebSocket 使用示例
└── package.json
```

## 类型生成

项目使用 [openapi-typescript](https://github.com/drwpow/openapi-typescript) 从 OpenAPI 规范自动生成 TypeScript 类型定义。

### 重新生成 API 类型

```bash
pnpm run generate:api
```

这会从 `api-specs/openapi.yaml` 生成 `src/types/api.d.ts`。

## REST API 使用

使用类型安全的 API 客户端：

```typescript
import { apiClient } from './lib/api-client';

// 获取房间列表
const { data, error } = await apiClient.GET('/rooms');

// 创建房间
const { data: room } = await apiClient.POST('/rooms', {
  body: {
    name: '周末观影房',
    password: 'secret123',
    maxUsers: 20,
  },
});

// 获取房间详情
const { data: roomDetail } = await apiClient.GET('/rooms/{roomId}', {
  params: {
    path: { roomId: 'room-123' },
  },
});
```

所有 API 调用都是完全类型安全的，TypeScript 会自动推断请求和响应类型。

## WebSocket 使用

使用类型安全的 WebSocket 客户端：

```typescript
import { createRoomWebSocket } from './lib/websocket-client';
import { createClientEvent } from './types/websocket';

// 创建房间 WebSocket 连接
const ws = createRoomWebSocket('room-123', {
  onOpen: () => console.log('Connected'),
  onClose: () => console.log('Disconnected'),
  autoReconnect: true,
});

// 监听事件
ws.on('user:joined', (event) => {
  console.log('User joined:', event.payload.user.username);
});

ws.on('video:state', (event) => {
  console.log('Video state:', event.payload);
});

ws.on('chat:message', (event) => {
  console.log(`${event.payload.user.username}: ${event.payload.message}`);
});

// 连接
ws.connect();

// 发送事件
ws.send(createClientEvent('video:play', {}));
ws.send(createClientEvent('chat:message', { message: 'Hello!' }));
```

## 完整示例

查看 `src/examples/usage.ts` 获取完整的使用示例，包括：

- REST API 调用示例
- WebSocket 连接和事件处理
- 完整的房间使用流程

## 开发

```bash
# 安装依赖
pnpm install

# 重新生成 API 类型
pnpm run generate:api

# 开发服务器（需要配置）
pnpm run dev
```

## API 规范

所有 API 类型都基于 `api-specs/openapi.yaml` 生成。

如果 API 规范发生变更，运行 `pnpm run generate:api` 重新生成类型定义。
