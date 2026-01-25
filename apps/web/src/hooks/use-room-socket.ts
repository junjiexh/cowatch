"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useWebSocket } from "./use-websocket";
import { getWebSocketUrl } from "@/config/websocket";
import { useAuth } from "@/stores/auth-store";

export interface RoomParticipant {
  id: string;
  username: string;
  avatarUrl?: string;
  isOnline: boolean;
  role: 'host' | 'member' | 'guest';
  hasControlPermission: boolean;
}

export interface RoomMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;  // Unix milliseconds
  isHost?: boolean;
}

export interface VideoState {
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
}

interface UseRoomSocketOptions {
  roomCode: string;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

interface UseRoomSocketReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;

  // Room data
  participants: RoomParticipant[];
  messages: RoomMessage[];
  videoState: VideoState | null;

  // Operations
  sendMessage: (content: string) => void;
  sendVideoControl: (action: 'play' | 'pause' | 'seek', data?: any) => void;
  changeVideo: (videoId: string) => void;
  disconnect: () => void;
}

const MAX_MESSAGES = 100;

export function useRoomSocket(options: UseRoomSocketOptions): UseRoomSocketReturn {
  const { roomCode, enabled = true, onError } = options;
  const { token } = useAuth();

  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [videoState, setVideoState] = useState<VideoState | null>(null);

  // Build WebSocket URL
  const wsUrl = useMemo(() => {
    if (!roomCode || !enabled) return '';
    return getWebSocketUrl(roomCode);
  }, [roomCode, enabled]);

  // Event handlers
  const handleRoomInit = useCallback((payload: any) => {
    if (payload.participants) {
      setParticipants(payload.participants);
    }

    if (payload.recentMessages) {
      const formattedMessages = payload.recentMessages.map((msg: any) => ({
        id: msg.id,
        userId: msg.user.id,
        username: msg.user.username,
        content: msg.content,
        timestamp: msg.timestamp,
        isHost: msg.user.role === 'host',
      }));
      setMessages(formattedMessages);
    }

    if (payload.videoState) {
      setVideoState(payload.videoState);
    }
  }, []);

  const handleUserJoined = useCallback((payload: any) => {
    if (!payload.user) return;

    setParticipants((prev) => {
      const exists = prev.find((p) => p.id === payload.user.id);
      if (exists) return prev;

      return [
        ...prev,
        {
          id: payload.user.id,
          username: payload.user.username,
          avatarUrl: payload.user.avatarUrl,
          isOnline: true,
          role: payload.user.role || 'member',
          hasControlPermission: payload.user.hasControlPermission || false,
        },
      ];
    });
  }, []);

  const handleUserLeft = useCallback((payload: any) => {
    if (!payload.userId) return;

    setParticipants((prev) =>
      prev.filter((p) => p.id !== payload.userId)
    );
  }, []);

  const handleUserStatus = useCallback((payload: any) => {
    if (!payload.userId) return;

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === payload.userId
          ? { ...p, isOnline: payload.isOnline }
          : p
      )
    );
  }, []);

  const handleChatMessage = useCallback((payload: any) => {
    if (!payload.user || !payload.content) return;

    const newMessage: RoomMessage = {
      id: payload.id || `msg-${Date.now()}`,
      userId: payload.user.id,
      username: payload.user.username,
      content: payload.content,
      timestamp: payload.timestamp || Date.now(),
      isHost: payload.user.role === 'host',
    };

    setMessages((prev) => {
      const updated = [...prev, newMessage];
      // Limit to last 100 messages
      return updated.slice(-MAX_MESSAGES);
    });
  }, []);

  const handleVideoState = useCallback((payload: any) => {
    setVideoState({
      currentTime: payload.currentTime ?? 0,
      isPlaying: payload.isPlaying ?? false,
      playbackRate: payload.playbackRate ?? 1.0,
      volume: payload.volume ?? 1.0,
    });
  }, []);

  const handleVideoChanged = useCallback((payload: any) => {
    // Video changed, reset to initial state
    if (payload.video) {
      setVideoState({
        currentTime: 0,
        isPlaying: false,
        playbackRate: 1.0,
        volume: 1.0,
      });
    }
  }, []);

  const handlePermissionChanged = useCallback((payload: any) => {
    if (!payload.userId) return;

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === payload.userId
          ? { ...p, hasControlPermission: payload.hasControlPermission }
          : p
      )
    );
  }, []);

  const handleError = useCallback((payload: any) => {
    const error = new Error(payload.message || 'WebSocket error');
    console.error('WebSocket error:', payload);
    onError?.(error);
  }, [onError]);

  // Message dispatcher
  const handleMessage = useCallback((message: any) => {
    if (!message || !message.type) return;

    switch (message.type) {
      case 'room:init':
        handleRoomInit(message.payload);
        break;
      case 'user:joined':
        handleUserJoined(message.payload);
        break;
      case 'user:left':
        handleUserLeft(message.payload);
        break;
      case 'user:status':
        handleUserStatus(message.payload);
        break;
      case 'chat:message':
        handleChatMessage(message.payload);
        break;
      case 'video:state':
        handleVideoState(message.payload);
        break;
      case 'video:changed':
        handleVideoChanged(message.payload);
        break;
      case 'permission:changed':
        handlePermissionChanged(message.payload);
        break;
      case 'error':
        handleError(message.payload);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }, [
    handleRoomInit,
    handleUserJoined,
    handleUserLeft,
    handleUserStatus,
    handleChatMessage,
    handleVideoState,
    handleVideoChanged,
    handlePermissionChanged,
    handleError,
  ]);

  // WebSocket connection
  const { isConnected, isConnecting, error, send, disconnect } = useWebSocket({
    url: wsUrl,
    token: token ?? undefined,
    onMessage: handleMessage,
    reconnect: true,
  });

  // Operations
  const sendMessage = useCallback((content: string) => {
    send('chat:message', { message: content });
  }, [send]);

  const sendVideoControl = useCallback((action: 'play' | 'pause' | 'seek', data?: any) => {
    switch (action) {
      case 'play':
        send('video:play', {});
        break;
      case 'pause':
        send('video:pause', {});
        break;
      case 'seek':
        if (data && typeof data.currentTime === 'number') {
          send('video:seek', { currentTime: data.currentTime });
        }
        break;
    }
  }, [send]);

  const changeVideo = useCallback((videoId: string) => {
    send('video:change', { videoId });
  }, [send]);

  // Don't connect if not enabled or no roomCode
  useEffect(() => {
    if (!enabled || !roomCode) {
      disconnect();
    }
  }, [enabled, roomCode, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    participants,
    messages,
    videoState,
    sendMessage,
    sendVideoControl,
    changeVideo,
    disconnect,
  };
}
