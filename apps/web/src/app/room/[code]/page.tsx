"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { BackgroundEffects } from "@/components/lobby/background-effects";
import { Navbar } from "@/components/layout/navbar";
import { RoomHeader } from "@/components/room/room-header";
import { VideoPlayer } from "@/components/room/video-player";
import { VideoControls } from "@/components/room/video-controls";
import { ChatSidebar } from "@/components/room/chat-sidebar";
import { TorrentSeeder } from "@/components/room/torrent-seeder";
import { TorrentStatus } from "@/components/room/torrent-status";
import { useAuth } from "@/stores/auth-store";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { useWebTorrent } from "@/hooks/use-webtorrent";
import { getRoomsByRoomCode, postVideosParse } from "@/client";
import type { Room } from "@/client/types.gen";
import type { SeedResult } from "@/lib/webtorrent";

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
    roomCode: roomCode,
    enabled: !!room && isAuthenticated,
  });

  // UI state
  const [isInCall, setIsInCall] = useState(false);
  const [callParticipantCount] = useState(2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  // WebTorrent state
  const torrentHook = useWebTorrent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [localSeekTime, setLocalSeekTime] = useState<number | undefined>(undefined);

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
    // 如果是本地视频
    if (localVideoUrl) {
      // 标记为已开始播放
      if (!hasStartedPlaying) {
        setHasStartedPlaying(true);
      }
      // 切换本地播放状态
      setLocalIsPlaying((prev) => !prev);
    }

    // 如果有控制权限且 WebSocket 已连接，同时通过 WebSocket 同步状态
    if (hasControlPermission && wsVideoState) {
      const action = wsVideoState.isPlaying ? 'pause' : 'play';
      sendVideoControl(action);
    }
  };

  const handleSkipBack = () => {
    if (localVideoUrl) {
      // 本地视频控制
      const newTime = Math.max(0, localCurrentTime - 10);
      setLocalSeekTime(newTime);
      return;
    }

    if (!hasControlPermission || !wsVideoState) return;

    const newTime = Math.max(0, wsVideoState.currentTime - 10);
    sendVideoControl('seek', { currentTime: newTime });
  };

  const handleSkipForward = () => {
    if (localVideoUrl) {
      // 本地视频控制
      const newTime = Math.min(localDuration, localCurrentTime + 10);
      setLocalSeekTime(newTime);
      return;
    }

    if (!hasControlPermission || !wsVideoState || !room?.currentVideo?.duration) return;

    const newTime = Math.min(room.currentVideo.duration, wsVideoState.currentTime + 10);
    sendVideoControl('seek', { currentTime: newTime });
  };

  const handleSeek = (time: number) => {
    if (localVideoUrl) {
      // 本地视频控制
      setLocalSeekTime(time);
      return;
    }

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

  // WebTorrent handlers
  const handleTorrentReady = (result: SeedResult) => {
    console.log("[Room] Torrent ready:", result);
    // TODO: Send magnet URI via WebSocket to all participants
    // sendMessage({
    //   type: 'torrent:seed',
    //   payload: {
    //     magnetURI: result.magnetURI,
    //     fileName: result.fileName,
    //     fileSize: result.fileSize,
    //   }
    // });
  };

  const handleVideoReady = (videoUrl: string) => {
    console.log("[Room] Local video ready:", videoUrl);
    setLocalVideoUrl(videoUrl);
    setHasStartedPlaying(false); // 重置播放状态，显示播放按钮
    setLocalIsPlaying(false); // 重置本地播放状态
    setLocalCurrentTime(0); // 重置当前时间
    setLocalDuration(0); // 重置时长
    setLocalSeekTime(undefined); // 重置 seek 状态
  };

  const handleTorrentError = (error: Error) => {
    console.error("[Room] Torrent error:", error);
    alert(`做种失败: ${error.message}`);
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
                hasPermission={hasControlPermission}
                onJoinCall={handleJoinCall}
                onLeaveCall={handleLeaveCall}
                onAddVideo={handleAddVideo}
                isAddingVideo={isAddingVideo}
                onShare={handleInviteFriend}
                onSettings={() => console.log("Settings")}
              />

              {/* WebTorrent Seeder (房主专用) */}
              {isHost && (
                <TorrentSeeder
                  onTorrentReady={handleTorrentReady}
                  onVideoReady={handleVideoReady}
                  onError={handleTorrentError}
                />
              )}

              {/* P2P 状态指示器 */}
              {(torrentHook.state.status === "seeding" ||
                torrentHook.state.status === "downloading" ||
                torrentHook.state.status === "ready") && (
                <TorrentStatus state={torrentHook.state} />
              )}

              {/* Video Player */}
              <VideoPlayer
                videoUrl={localVideoUrl || undefined}
                state={
                  localVideoUrl
                    ? !hasStartedPlaying
                      ? "idle"
                      : localIsPlaying
                      ? "playing"
                      : "paused"
                    : wsVideoState?.isPlaying
                    ? "playing"
                    : "paused"
                }
                seekToTime={localVideoUrl ? localSeekTime : undefined}
                onPlay={handlePlayPause}
                onTimeUpdate={(time) => setLocalCurrentTime(time)}
                onDurationChange={(duration) => setLocalDuration(duration)}
              />

              {/* Video Controls */}
              <VideoControls
                isPlaying={localVideoUrl ? localIsPlaying : (wsVideoState?.isPlaying || false)}
                currentTime={localVideoUrl ? localCurrentTime : (wsVideoState?.currentTime || 0)}
                duration={localVideoUrl ? localDuration : (room.currentVideo?.duration || 0)}
                volume={(wsVideoState?.volume || 1) * 100}
                isMuted={(wsVideoState?.volume || 0) === 0}
                canControl={localVideoUrl ? true : hasControlPermission}
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
