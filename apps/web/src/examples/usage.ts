/**
 * API 和 WebSocket 客户端使用示例
 */

import { apiClient } from '../lib/api-client';
import { createRoomWebSocket } from '../lib/websocket-client';
import { createClientEvent } from '../types/websocket';

// ============ REST API 使用示例 ============

/**
 * 获取房间列表
 */
export async function getRoomList() {
  const { data, error } = await apiClient.GET('/rooms');

  if (error) {
    console.error('Failed to get rooms:', error);
    return;
  }

  console.log('Rooms:', data);
  return data;
}

/**
 * 创建房间
 */
export async function createRoom(name: string, password?: string) {
  const { data, error } = await apiClient.POST('/rooms', {
    body: {
      name,
      password,
      maxUsers: 20,
    },
  });

  if (error) {
    console.error('Failed to create room:', error);
    return;
  }

  console.log('Created room:', data);
  return data;
}

/**
 * 获取房间详情
 */
export async function getRoomDetails(roomId: string) {
  const { data, error } = await apiClient.GET('/rooms/{roomId}', {
    params: {
      path: { roomId },
    },
  });

  if (error) {
    console.error('Failed to get room:', error);
    return;
  }

  console.log('Room details:', data);
  return data;
}

/**
 * 加入房间
 */
export async function joinRoom(roomId: string, password?: string) {
  const { data, error } = await apiClient.POST('/rooms/{roomId}/join', {
    params: {
      path: { roomId },
    },
    body: {
      password,
    },
  });

  if (error) {
    console.error('Failed to join room:', error);
    return;
  }

  console.log('Joined room:', data);
  return data;
}

/**
 * 解析视频源
 */
export async function parseVideo(url: string) {
  const { data, error } = await apiClient.POST('/videos/parse', {
    body: {
      url,
    },
  });

  if (error) {
    console.error('Failed to parse video:', error);
    return;
  }

  console.log('Parsed video:', data);
  return data;
}

// ============ WebSocket 使用示例 ============

/**
 * 连接房间 WebSocket 并设置事件监听
 */
export function connectToRoom(roomId: string) {
  const ws = createRoomWebSocket(roomId, {
    onOpen: () => {
      console.log('Connected to room:', roomId);
    },
    onClose: () => {
      console.log('Disconnected from room:', roomId);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    autoReconnect: true,
  });

  // 监听用户加入事件
  ws.on('user:joined', (event) => {
    console.log('User joined:', event.payload.user.username);
    console.log('Total users:', event.payload.userCount);
  });

  // 监听用户离开事件
  ws.on('user:left', (event) => {
    console.log('User left:', event.payload.username);
    console.log('Total users:', event.payload.userCount);
  });

  // 监听视频状态更新
  ws.on('video:state', (event) => {
    console.log('Video state updated:', {
      currentTime: event.payload.currentTime,
      isPlaying: event.payload.isPlaying,
      triggeredBy: event.payload.triggeredBy,
    });
  });

  // 监听聊天消息
  ws.on('chat:message', (event) => {
    console.log(
      `${event.payload.user.username}: ${event.payload.message}`
    );
  });

  // 监听视频源变更
  ws.on('video:changed', (event) => {
    console.log('Video changed:', event.payload.video.title);
    console.log('Changed by:', event.payload.changedBy);
  });

  // 监听错误
  ws.on('error', (event) => {
    console.error('Error:', event.payload.message);
  });

  // 连接
  ws.connect();

  return ws;
}

/**
 * 发送视频播放事件
 */
export function playVideo(ws: ReturnType<typeof createRoomWebSocket>) {
  ws.send(
    createClientEvent('video:play', {})
  );
}

/**
 * 发送视频暂停事件
 */
export function pauseVideo(ws: ReturnType<typeof createRoomWebSocket>) {
  ws.send(
    createClientEvent('video:pause', {})
  );
}

/**
 * 发送视频跳转事件
 */
export function seekVideo(
  ws: ReturnType<typeof createRoomWebSocket>,
  currentTime: number
) {
  ws.send(
    createClientEvent('video:seek', { currentTime })
  );
}

/**
 * 发送聊天消息
 */
export function sendChatMessage(
  ws: ReturnType<typeof createRoomWebSocket>,
  message: string
) {
  ws.send(
    createClientEvent('chat:message', { message })
  );
}

/**
 * 发送视频同步事件
 */
export function syncVideoState(
  ws: ReturnType<typeof createRoomWebSocket>,
  state: { currentTime: number; isPlaying: boolean; playbackRate: number }
) {
  ws.send(
    createClientEvent('video:sync', state)
  );
}

// ============ 完整使用流程示例 ============

/**
 * 完整的房间使用流程
 */
export async function fullRoomExample() {
  // 1. 创建房间
  const room = await createRoom('周末观影房', 'secret123');
  if (!room) return;

  // 2. 解析视频源
  const video = await parseVideo('https://www.bilibili.com/video/BV1xx411c7mD');
  if (!video) return;

  // 3. 连接 WebSocket
  const ws = connectToRoom(room.id);

  // 4. 等待连接建立后发送消息
  ws.on('user:joined', (event) => {
    if (event.payload.userCount === 1) {
      // 第一个用户加入，发送欢迎消息
      sendChatMessage(ws, 'Welcome to the room!');
    }
  });

  // 5. 模拟视频播放控制
  setTimeout(() => {
    playVideo(ws);
  }, 2000);

  setTimeout(() => {
    pauseVideo(ws);
  }, 5000);

  // 清理：断开连接
  // ws.disconnect();
}
