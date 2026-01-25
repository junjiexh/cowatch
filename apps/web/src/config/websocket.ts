export const getWebSocketUrl = (roomCode: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
  return `${baseUrl}/ws/rooms/${roomCode}`;
};
