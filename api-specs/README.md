# API 规范说明

本目录包含 Cowatch 项目的完整 API 规范。

## 文件说明

- **openapi.yaml** - REST API 规范（OpenAPI 3.0）
- **websocket.md** - WebSocket 实时通信协议

## 使用方式

### 1. 查看 API 文档

在线查看（推荐使用 Swagger UI）：

```bash
# 安装 swagger-ui-watcher
pnpm install -g swagger-ui-watcher

# 启动文档服务器
swagger-ui-watcher api-specs/openapi.yaml
```

访问 http://localhost:8080 查看交互式 API 文档。

### 2. 生成 Go 服务端代码

使用 [oapi-codegen](https://github.com/deepmap/oapi-codegen) 生成 Go 代码：

```bash
# 安装工具
go install github.com/deepmap/oapi-codegen/v2/cmd/oapi-codegen@latest

# 生成 Go 类型和 Gin handler 接口
oapi-codegen -package api -generate types,gin api-specs/openapi.yaml > apps/api-gateway/internal/api/types.go
```

### 3. 生成 TypeScript 客户端

使用 [openapi-typescript](https://github.com/drwpow/openapi-typescript) 生成 TypeScript 类型：

```bash
# 安装工具
pnpm add -D openapi-typescript

# 生成类型定义
npx openapi-typescript api-specs/openapi.yaml -o apps/web/types/api.d.ts
```

然后使用 [openapi-fetch](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch) 创建类型安全的客户端：

```typescript
import createClient from 'openapi-fetch';
import type { paths } from './types/api';

const client = createClient<paths>({ baseUrl: 'http://localhost:8080/api/v1' });

// 完全类型安全的 API 调用
const { data, error } = await client.GET('/rooms/{roomId}', {
  params: { path: { roomId: 'room-123' } }
});
```

## WebSocket 客户端示例

```typescript
// 连接 WebSocket
const ws = new WebSocket('ws://localhost:8080/ws/rooms/room-123');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'user:joined':
      console.log('用户加入:', message.payload.user);
      break;
    case 'video:state':
      console.log('视频状态更新:', message.payload);
      break;
    // ...
  }
};

// 发送消息
ws.send(JSON.stringify({
  type: 'chat:message',
  payload: { message: 'Hello!' },
  timestamp: Date.now()
}));
```

## 开发流程

1. **修改 API 规范** - 先更新 `openapi.yaml` 或 `websocket.md`
2. **生成代码** - 运行上述命令生成 Go 和 TypeScript 代码
3. **实现逻辑** - 在生成的接口基础上实现业务逻辑
4. **保持同步** - API 变更时重新生成代码，确保前后端类型一致

这种方式确保了前后端的 API 契约始终同步。
