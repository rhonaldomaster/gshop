/**
 * Picture-in-Picture (PiP) Context
 *
 * Manages global PiP state for live stream mini player.
 * Allows users to continue watching a live stream in a floating
 * mini player while navigating other parts of the app.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';

export interface PiPStreamData {
  id: string;
  title: string;
  hlsUrl: string;
  hostType: 'seller' | 'affiliate';
  hostName: string;
  viewerCount: number;
}

interface PiPContextType {
  isActive: boolean;
  streamData: PiPStreamData | null;
  socketRef: React.MutableRefObject<Socket | null>;
  enterPiP: (data: PiPStreamData, socket: Socket | null) => void;
  exitPiP: () => void;
  updateViewerCount: (count: number) => void;
  returnToFullscreen: () => string | null;
}

const PiPContext = createContext<PiPContextType | undefined>(undefined);

interface PiPProviderProps {
  children: React.ReactNode;
}

export function PiPProvider({ children }: PiPProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [streamData, setStreamData] = useState<PiPStreamData | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const enterPiP = useCallback((data: PiPStreamData, socket: Socket | null) => {
    console.log('[PiPContext] Entering PiP mode for stream:', data.id);
    setStreamData(data);
    socketRef.current = socket;
    setIsActive(true);
  }, []);

  const exitPiP = useCallback(() => {
    console.log('[PiPContext] Exiting PiP mode');
    if (socketRef.current) {
      socketRef.current.emit('leaveStream', { streamId: streamData?.id });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setStreamData(null);
    setIsActive(false);
  }, [streamData?.id]);

  const updateViewerCount = useCallback((count: number) => {
    setStreamData(prev => prev ? { ...prev, viewerCount: count } : null);
  }, []);

  const returnToFullscreen = useCallback(() => {
    if (!streamData) return null;
    const streamId = streamData.id;
    setIsActive(false);
    return streamId;
  }, [streamData]);

  return (
    <PiPContext.Provider
      value={{
        isActive,
        streamData,
        socketRef,
        enterPiP,
        exitPiP,
        updateViewerCount,
        returnToFullscreen,
      }}
    >
      {children}
    </PiPContext.Provider>
  );
}

export function usePiP(): PiPContextType {
  const context = useContext(PiPContext);
  if (!context) {
    throw new Error('usePiP must be used within a PiPProvider');
  }
  return context;
}

export default PiPContext;
