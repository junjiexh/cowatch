# WebSocket 事件规范

## 连接

```
WebSocket URL: ws://localhost:8080/ws/rooms/{roomCode}
```

## 客户端发送事件

### 1. 视频播放控制

```typescript
// 播放
{
  "type": "video:play",
  "payload": {},
  "timestamp": 1234567890
}

// 暂停
{
  "type": "video:pause",
  "payload": {},
  "timestamp": 1234567890
}

// 跳转进度
{
  "type": "video:seek",
  "payload": {
    "currentTime": 123.45
  },
  "timestamp": 1234567890
}

// 同步状态（定期发送）
{
  "type": "video:sync",
  "payload": {
    "currentTime": 123.45,
    "isPlaying": true,
    "playbackRate": 1.0
  },
  "timestamp": 1234567890
}
```

### 2. 聊天消息

```typescript
{
  "type": "chat:message",
  "payload": {
    "message": "Hello!"
  },
  "timestamp": 1234567890
}
```

### 3. 切换视频源

```typescript
{
  "type": "video:change",
  "payload": {
    "videoId": "video-123"
  },
  "timestamp": 1234567890
}
```

## 服务端推送事件

### 1. 房间初始化

连接建立后立即推送，包含房间的完整初始状态。

```typescript
{
  "type": "room:init",
  "payload": {
    "participants": [
      {
        "id": "user-123",
        "username": "张三",
        "avatarUrl": "https://...",
        "isOnline": true,
        "role": "host",
        "hasControlPermission": true
      }
    ],
    "recentMessages": [
      {
        "id": "msg-1",
        "user": {
          "id": "user-123",
          "username": "张三"
        },
        "content": "欢迎！",
        "timestamp": 1234567890
      }
    ],
    "videoState": {
      "currentTime": 123.45,
      "isPlaying": true,
      "playbackRate": 1.0,
      "volume": 1.0
    }
  },
  "timestamp": 1234567890
}
```

### 2. 用户加入/离开

```typescript
// 用户加入
{
  "type": "user:joined",
  "payload": {
    "user": {
      "id": "user-123",
      "username": "张三",
      "avatarUrl": "https://..."
    },
    "userCount": 6
  },
  "timestamp": 1234567890
}

// 用户离开
{
  "type": "user:left",
  "payload": {
    "userId": "user-123",
    "username": "张三",
    "userCount": 5
  },
  "timestamp": 1234567890
}
```

### 3. 用户状态变更

用户在线/离线状态变化时推送。

```typescript
{
  "type": "user:status",
  "payload": {
    "userId": "user-123",
    "isOnline": true
  },
  "timestamp": 1234567890
}
```

### 4. 视频状态同步

```typescript
// 广播视频状态（房主/授权用户操作后）
{
  "type": "video:state",
  "payload": {
    "currentTime": 123.45,
    "isPlaying": true,
    "playbackRate": 1.0,
    "triggeredBy": "user-123"
  },
  "timestamp": 1234567890
}
```

### 5. 聊天消息广播

```typescript
{
  "type": "chat:message",
  "payload": {
    "user": {
      "id": "user-123",
      "username": "张三"
    },
    "message": "Hello!",
    "timestamp": 1234567890
  }
}
```

### 6. 视频源变更

```typescript
{
  "type": "video:changed",
  "payload": {
    "video": {
      "id": "video-123",
      "type": "bilibili",
      "url": "https://...",
      "title": "新电影",
      "streamUrl": "https://..."
    },
    "changedBy": "user-123"
  },
  "timestamp": 1234567890
}
```

### 7. 权限变更通知

房主授予或撤销用户控制权限时推送。

```typescript
{
  "type": "permission:changed",
  "payload": {
    "userId": "user-456",
    "hasControlPermission": true,
    "changedBy": "user-123"
  },
  "timestamp": 1234567890
}
```

### 8. 错误消息

```typescript
{
  "type": "error",
  "payload": {
    "code": "UNAUTHORIZED",
    "message": "你没有权限执行此操作"
  },
  "timestamp": 1234567890
}
```

## 权限控制

只有房主或被授权的用户可以发送以下事件：
- `video:play`
- `video:pause`
- `video:seek`
- `video:change`

普通用户只能：
- 发送聊天消息 (`chat:message`)
- 接收所有广播消息

## TypeScript 类型定义

```typescript
// WebSocket 消息基础类型
export interface WSMessage<T = any> {
  type: string;
  payload: T;
  timestamp: number;
}

// 客户端发送事件类型
export type ClientEvent =
  | WSMessage<{}, 'video:play'>
  | WSMessage<{}, 'video:pause'>
  | WSMessage<{ currentTime: number }, 'video:seek'>
  | WSMessage<{ currentTime: number; isPlaying: boolean; playbackRate: number }, 'video:sync'>
  | WSMessage<{ message: string }, 'chat:message'>
  | WSMessage<{ videoId: string }, 'video:change'>;

// 服务端推送事件类型
export type ServerEvent =
  | WSMessage<{ participants: RoomParticipant[]; recentMessages: Message[]; videoState: VideoState }, 'room:init'>
  | WSMessage<{ user: User; userCount: number }, 'user:joined'>
  | WSMessage<{ userId: string; username: string; userCount: number }, 'user:left'>
  | WSMessage<{ userId: string; isOnline: boolean }, 'user:status'>
  | WSMessage<{ currentTime: number; isPlaying: boolean; playbackRate: number; triggeredBy: string }, 'video:state'>
  | WSMessage<{ user: User; message: string; timestamp: number }, 'chat:message'>
  | WSMessage<{ video: VideoSource; changedBy: string }, 'video:changed'>
  | WSMessage<{ userId: string; hasControlPermission: boolean; changedBy: string }, 'permission:changed'>
  | WSMessage<{ code: string; message: string }, 'error'>;
```
