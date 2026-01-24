"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BackgroundEffects } from "@/components/lobby/background-effects";
import { Navbar } from "@/components/layout/navbar";
import { RoomHeader } from "@/components/room/room-header";
import { VideoPlayer } from "@/components/room/video-player";
import { VideoControls } from "@/components/room/video-controls";
import { ChatSidebar } from "@/components/room/chat-sidebar";
import { useAuth } from "@/stores/auth-store";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { getRoomsByRoomCode, postVideosParse } from "@/client";
import type { Room } from "@/client/types.gen";

export default function RoomPage() {
  const params = useParams();
  const roomCode = (params.code as string)?.toUpperCase() || "";
  const { user, isAuthenticated } = useAuth();

  // Room data from REST API
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  // Room state from WebSocket
  const {
    participants,
    messages,
    videoState: wsVideoState,
    sendMessage,
    sendVideoControl,
    changeVideo,
    isConnected,
    isConnecting,
  } = useRoomSocket({
    roomId: room?.id || '',
    enabled: !!room && isAuthenticated,
  });

  // UI state
  const [isInCall, setIsInCall] = useState(false);
  const [callParticipantCount] = useState(2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  // Derived state from REST API
  const isHost = room?.currentUserRole === 'host';
  const hasControlPermission = room?.currentUserHasControl || false;

  // Load room information from REST API
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadRoom = async () => {
      setIsLoadingRoom(true);
      setRoomError(null);

      const { data, error } = await getRoomsByRoomCode({
        path: { roomCode },
      });

      if (data) {
        setRoom(data);
      } else if (error) {
        setRoomError(error.message || '房间不存在');
      }

      setIsLoadingRoom(false);
    };

    loadRoom();
  }, [roomCode, isAuthenticated]);

  const handleJoinCall = () => {
    setIsInCall(true);
    // TODO: Implement actual call joining logic
  };

  const handleLeaveCall = () => {
    setIsInCall(false);
    // TODO: Implement actual call leaving logic
  };

  const handlePlayPause = () => {
    if (!hasControlPermission || !wsVideoState) return;

    const action = wsVideoState.isPlaying ? 'pause' : 'play';
    sendVideoControl(action);
  };

  const handleSkipBack = () => {
    if (!hasControlPermission || !wsVideoState) return;

    const newTime = Math.max(0, wsVideoState.currentTime - 10);
    sendVideoControl('seek', { currentTime: newTime });
  };

  const handleSkipForward = () => {
    if (!hasControlPermission || !wsVideoState || !room?.currentVideo?.duration) return;

    const newTime = Math.min(room.currentVideo.duration, wsVideoState.currentTime + 10);
    sendVideoControl('seek', { currentTime: newTime });
  };

  const handleSeek = (time: number) => {
    if (!hasControlPermission) return;

    sendVideoControl('seek', { currentTime: time });
  };

  const handleVolumeChange = (vol: number) => {
    // Volume is local-only for now
    // Could be synced via WebSocket in the future
  };

  const handleMuteToggle = () => {
    // Mute is local-only for now
  };

  const handleFullscreenToggle = () => {
    setIsFullscreen((prev) => !prev);
    // TODO: Implement actual fullscreen
  };

  const handleAddVideo = async (url: string) => {
    if (!hasControlPermission) return;

    setIsAddingVideo(true);

    try {
      const { data, error } = await postVideosParse({
        body: { url },
      });

      if (data) {
        changeVideo(data.id);
      } else {
        console.error('Video parse failed:', error);
      }
    } catch (err) {
      console.error('Add video failed:', err);
    } finally {
      setIsAddingVideo(false);
    }
  };

  const handleSendMessage = (content: string) => {
    if (!user) return;
    sendMessage(content);
  };

  const handleManagePermission = (userId: string) => {
    // TODO: Implement permission management
    console.log("Manage permission for user:", userId);
  };

  const handleInviteFriend = () => {
    // TODO: Implement invite functionality
    const shareUrl = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(shareUrl);
    alert("房间链接已复制到剪贴板！");
  };

  // Loading states
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">请先登录以加入房间</p>
      </div>
    );
  }

  if (isLoadingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">加载房间信息中...</p>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/80 mb-2">加载房间失败</p>
          <p className="text-white/40">{roomError || '房间不存在'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BackgroundEffects />
      <Navbar />

      {/* WebSocket connection status */}
      {!isConnected && (
        <div className="fixed top-20 right-4 z-50 bg-yellow-500/20 border border-yellow-500/50 px-4 py-2 rounded-lg">
          <p className="text-yellow-200 text-sm">
            {isConnecting ? '正在连接...' : '连接已断开，正在重连...'}
          </p>
        </div>
      )}

      <main className="relative pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1800px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            {/* Left Column: Video Area */}
            <div className="flex flex-col gap-4">
              {/* Room Header */}
              <RoomHeader
                roomName={room.name}
                roomCode={roomCode}
                isInCall={isInCall}
                participantCount={participants.filter(p => p.isOnline).length}
                isHost={isHost}
                hasControlPermission={hasControlPermission}
                onJoinCall={handleJoinCall}
                onLeaveCall={handleLeaveCall}
                onAddVideo={handleAddVideo}
                isAddingVideo={isAddingVideo}
                onShare={handleInviteFriend}
                onSettings={() => console.log("Settings")}
              />

              {/* Video Player */}
              <VideoPlayer
                state={wsVideoState?.isPlaying ? "playing" : "paused"}
                onPlay={handlePlayPause}
              />

              {/* Video Controls */}
              <VideoControls
                isPlaying={wsVideoState?.isPlaying || false}
                currentTime={wsVideoState?.currentTime || 0}
                duration={room.currentVideo?.duration || 0}
                volume={(wsVideoState?.volume || 1) * 100}
                isMuted={(wsVideoState?.volume || 0) === 0}
                canControl={hasControlPermission}
                onPlayPause={handlePlayPause}
                onSkipBack={handleSkipBack}
                onSkipForward={handleSkipForward}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
                onFullscreenToggle={handleFullscreenToggle}
              />
            </div>

            {/* Right Column: Chat Sidebar */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <ChatSidebar
                messages={messages}
                participants={participants}
                currentUserId={user?.id}
                isHost={isHost}
                onSendMessage={handleSendMessage}
                onManagePermission={isHost ? handleManagePermission : undefined}
                onInviteFriend={handleInviteFriend}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: oklch(0.15 0 0 / 20%);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: oklch(0.75 0.15 195 / 30%);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: oklch(0.75 0.15 195 / 50%);
        }
      `}</style>
    </div>
  );
}
