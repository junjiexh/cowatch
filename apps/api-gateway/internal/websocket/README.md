# WebSocket 模块

提供 WebSocket 连接管理和实时事件处理。

## 文件说明

- **types.go** - WebSocket 事件类型定义（基于 `api-specs/websocket.md` 生成）
- **handler.go** - WebSocket 连接处理和消息分发

## 使用示例

### 1. 启动 WebSocket Hub

```go
package main

import (
    "github.com/yourusername/cowatch/api-gateway/internal/websocket"
)

func main() {
    // 创建 WebSocket hub
    hub := websocket.NewHub()

    // 在单独的 goroutine 中运行
    go hub.Run()

    // ... 其他初始化代码
}
```

### 2. 处理 WebSocket 连接

```go
import (
    "github.com/gin-gonic/gin"
    "github.com/gorilla/websocket"
    "github.com/yourusername/cowatch/api-gateway/internal/websocket"
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true // 生产环境需要适当的 CORS 检查
    },
}

func handleWebSocket(c *gin.Context, hub *websocket.Hub) {
    roomID := c.Param("roomId")

    // 升级 HTTP 连接为 WebSocket
    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        return
    }

    // 创建客户端
    client := &websocket.Client{
        ID:       generateClientID(),
        RoomID:   roomID,
        UserID:   getUserID(c), // 从认证中获取
        Username: getUsername(c),
        Conn:     conn,
        Send:     make(chan *websocket.WSMessage, 256),
        Hub:      hub,
    }

    // 注册客户端
    hub.register <- client

    // 启动读写循环
    go client.WritePump()
    go client.ReadPump()
}
```

### 3. 发送事件到客户端

```go
// 发送用户加入事件
event := websocket.NewUserJoinedEvent(
    websocket.User{
        ID:       "user-123",
        Username: "张三",
    },
    5, // 用户数量
)

hub.broadcast <- &websocket.BroadcastMessage{
    RoomID:  "room-123",
    Message: event,
}

// 发送视频状态更新
stateEvent := websocket.NewVideoStateEvent(
    123.45,  // currentTime
    true,    // isPlaying
    1.0,     // playbackRate
    "user-456", // triggeredBy
)

hub.broadcast <- &websocket.BroadcastMessage{
    RoomID:  "room-123",
    Message: stateEvent,
}
```

### 4. 处理客户端消息

客户端消息会自动由 `handler.go` 中的 `handleMessage` 方法处理。

该方法会：
1. 检查权限（对于控制类事件）
2. 根据事件类型分发到相应的处理函数
3. 广播更新到房间内的其他客户端

## 事件类型

### 客户端发送事件

- `video:play` - 播放视频
- `video:pause` - 暂停视频
- `video:seek` - 跳转进度
- `video:sync` - 同步视频状态
- `chat:message` - 发送聊天消息
- `video:change` - 切换视频源

### 服务端推送事件

- `user:joined` - 用户加入
- `user:left` - 用户离开
- `video:state` - 视频状态更新
- `chat:message` - 聊天消息广播
- `video:changed` - 视频源已变更
- `error` - 错误消息

## 权限控制

以下事件需要特殊权限（房主或被授权用户）：
- `video:play`
- `video:pause`
- `video:seek`
- `video:change`

权限检查由 `RequiresPermission()` 函数和 `hasControlPermission()` 方法实现。

## 注意事项

1. **并发安全** - Hub 使用 channel 和 mutex 确保并发安全
2. **自动清理** - 断开连接时自动清理客户端和通知其他用户
3. **错误处理** - 消息解析错误会发送错误事件给客户端
4. **权限验证** - 控制类事件需要通过权限检查

## TODO

- [ ] 实现完整的权限系统（`hasControlPermission` 方法）
- [ ] 从数据库获取视频详情（`handleVideoChange` 方法）
- [ ] 添加消息限流保护
- [ ] 添加 ping/pong 心跳检测
- [ ] 添加重连逻辑优化
