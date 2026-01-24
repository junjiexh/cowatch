"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface WSMessage<T = any> {
  type: string;
  payload: T;
  timestamp: number;
}

export interface UseWebSocketOptions {
  url: string;
  token?: string;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (data: any) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  send: (type: string, payload: any) => void;
  disconnect: () => void;
  reconnect: () => void;
}

const DEFAULT_RECONNECT_INTERVAL = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    token,
    onOpen,
    onClose,
    onError,
    onMessage,
    reconnect = true,
    reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
    maxReconnectAttempts = 10,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intentionalDisconnectRef = useRef(false);

  // Build WebSocket URL with token
  const wsUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;

  // Send message
  const send = useCallback((type: string, payload: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    const message: WSMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    try {
      wsRef.current.send(JSON.stringify(message));
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err instanceof Error ? err : new Error("Failed to send message"));
    }
  }, []);

  // Manual disconnect
  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Connect or reconnect
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);
    intentionalDisconnectRef.current = false;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptRef.current = 0; // Reset reconnect counter on success
        onOpen?.();
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        onClose?.(event);

        // Auto-reconnect if not intentional disconnect
        if (!intentionalDisconnectRef.current && reconnect && reconnectAttemptRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttemptRef.current),
            MAX_RECONNECT_DELAY
          );

          reconnectAttemptRef.current += 1;

          console.log(
            `WebSocket disconnected. Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current}/${maxReconnectAttempts})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptRef.current >= maxReconnectAttempts) {
          setError(new Error("Max reconnect attempts reached"));
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        const error = new Error("WebSocket connection error");
        setError(error);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setError(err instanceof Error ? err : new Error("Failed to create WebSocket"));
      setIsConnecting(false);
    }
  }, [wsUrl, onOpen, onClose, onError, onMessage, reconnect, reconnectInterval, maxReconnectAttempts]);

  // Auto-connect on mount and token change
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    send,
    disconnect,
    reconnect: connect,
  };
}
