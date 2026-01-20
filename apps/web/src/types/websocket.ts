/**
 * WebSocket 事件类型定义
 * 基于 api-specs/websocket.md 生成
 */

import type { components } from './api';

type User = components['schemas']['User'];
type VideoSource = components['schemas']['VideoSource'];

// WebSocket 消息基础类型
export interface WSMessage<TPayload = unknown, TType extends string = string> {
  type: TType;
  payload: TPayload;
  timestamp: number;
}

// ============ 客户端发送事件 ============

// 视频播放控制
export type VideoPlayEvent = WSMessage<Record<string, never>, 'video:play'>;
export type VideoPauseEvent = WSMessage<Record<string, never>, 'video:pause'>;

export type VideoSeekEvent = WSMessage<
  {
    currentTime: number;
  },
  'video:seek'
>;

export type VideoSyncEvent = WSMessage<
  {
    currentTime: number;
    isPlaying: boolean;
    playbackRate: number;
  },
  'video:sync'
>;

// 聊天消息
export type ChatMessageEvent = WSMessage<
  {
    message: string;
  },
  'chat:message'
>;

// 切换视频源
export type VideoChangeEvent = WSMessage<
  {
    videoId: string;
  },
  'video:change'
>;

// 客户端发送事件联合类型
export type ClientEvent =
  | VideoPlayEvent
  | VideoPauseEvent
  | VideoSeekEvent
  | VideoSyncEvent
  | ChatMessageEvent
  | VideoChangeEvent;

// ============ 服务端推送事件 ============

// 用户加入
export type UserJoinedEvent = WSMessage<
  {
    user: User;
    userCount: number;
  },
  'user:joined'
>;

// 用户离开
export type UserLeftEvent = WSMessage<
  {
    userId: string;
    username: string;
    userCount: number;
  },
  'user:left'
>;

// 视频状态同步
export type VideoStateEvent = WSMessage<
  {
    currentTime: number;
    isPlaying: boolean;
    playbackRate: number;
    triggeredBy: string;
  },
  'video:state'
>;

// 聊天消息广播
export type ChatMessageBroadcastEvent = WSMessage<
  {
    user: User;
    message: string;
    timestamp: number;
  },
  'chat:message'
>;

// 视频源变更
export type VideoChangedEvent = WSMessage<
  {
    video: VideoSource;
    changedBy: string;
  },
  'video:changed'
>;

// 错误消息
export type ErrorEvent = WSMessage<
  {
    code: string;
    message: string;
  },
  'error'
>;

// 服务端推送事件联合类型
export type ServerEvent =
  | UserJoinedEvent
  | UserLeftEvent
  | VideoStateEvent
  | ChatMessageBroadcastEvent
  | VideoChangedEvent
  | ErrorEvent;

// ============ 类型守卫 ============

export function isUserJoinedEvent(event: ServerEvent): event is UserJoinedEvent {
  return event.type === 'user:joined';
}

export function isUserLeftEvent(event: ServerEvent): event is UserLeftEvent {
  return event.type === 'user:left';
}

export function isVideoStateEvent(event: ServerEvent): event is VideoStateEvent {
  return event.type === 'video:state';
}

export function isChatMessageEvent(event: ServerEvent): event is ChatMessageBroadcastEvent {
  return event.type === 'chat:message';
}

export function isVideoChangedEvent(event: ServerEvent): event is VideoChangedEvent {
  return event.type === 'video:changed';
}

export function isErrorEvent(event: ServerEvent): event is ErrorEvent {
  return event.type === 'error';
}

// ============ 辅助函数 ============

/**
 * 创建客户端事件
 */
export function createClientEvent<T extends ClientEvent['type']>(
  type: T,
  payload: Extract<ClientEvent, { type: T }>['payload']
): Extract<ClientEvent, { type: T }> {
  return {
    type,
    payload,
    timestamp: Date.now(),
  } as Extract<ClientEvent, { type: T }>;
}

/**
 * 解析服务端事件
 */
export function parseServerEvent(data: string): ServerEvent {
  return JSON.parse(data) as ServerEvent;
}
