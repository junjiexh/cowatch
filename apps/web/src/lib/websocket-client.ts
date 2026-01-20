/**
 * WebSocket 客户端封装
 * 提供类型安全的 WebSocket 通信
 */

import type {
  ClientEvent,
  ServerEvent,
  createClientEvent,
  parseServerEvent,
} from '../types/websocket';

export type MessageHandler<T extends ServerEvent = ServerEvent> = (event: T) => void;

export interface WebSocketClientOptions {
  url: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

/**
 * WebSocket 客户端
 * 提供类型安全的消息发送和接收
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private options: Required<WebSocketClientOptions>;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: WebSocketClientOptions) {
    this.options = {
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
      autoReconnect: true,
      reconnectInterval: 3000,
      ...options,
    };
  }

  /**
   * 连接 WebSocket
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(this.options.url);

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.options.onOpen();
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      this.options.onClose();

      if (this.options.autoReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      this.options.onError(error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerEvent;
        this.handleMessage(message);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    };
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 发送客户端事件
   */
  send(event: ClientEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot send message: not connected');
      return;
    }

    this.ws.send(JSON.stringify(event));
  }

  /**
   * 监听服务端事件
   */
  on<T extends ServerEvent['type']>(
    type: T,
    handler: MessageHandler<Extract<ServerEvent, { type: T }>>
  ): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)!.add(handler as MessageHandler);

    // 返回取消监听的函数
    return () => {
      this.off(type, handler);
    };
  }

  /**
   * 取消监听事件
   */
  off<T extends ServerEvent['type']>(
    type: T,
    handler: MessageHandler<Extract<ServerEvent, { type: T }>>
  ): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler as MessageHandler);
    }
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(type?: string): void {
    if (type) {
      this.handlers.delete(type);
    } else {
      this.handlers.clear();
    }
  }

  private handleMessage(message: ServerEvent): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    console.log(`[WebSocket] Reconnecting in ${this.options.reconnectInterval}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.options.reconnectInterval);
  }

  /**
   * 获取当前连接状态
   */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * 是否已连接
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * 创建房间 WebSocket 客户端
 */
export function createRoomWebSocket(
  roomId: string,
  options?: Omit<WebSocketClientOptions, 'url'>
): WebSocketClient {
  const url = `ws://localhost:8080/ws/rooms/${roomId}`;
  return new WebSocketClient({ url, ...options });
}
