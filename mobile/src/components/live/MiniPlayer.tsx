/**
 * Mini Player Component
 *
 * A floating, draggable mini player for Picture-in-Picture mode.
 * Allows users to continue watching a live stream while navigating the app.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { usePiP } from '../../contexts/PiPContext';
import { useNavigation, CommonActions } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MINI_PLAYER_WIDTH = 160;
const MINI_PLAYER_HEIGHT = 90;
const EDGE_PADDING = 16;
const BOTTOM_TAB_HEIGHT = 80;

interface MiniPlayerProps {
  onExpand?: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onExpand }) => {
  const { t } = useTranslation('translation');
  const { isActive, streamData, exitPiP, returnToFullscreen, socketRef } = usePiP();
  const navigation = useNavigation();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // Animated position for dragging
  const pan = useRef(new Animated.ValueXY({
    x: SCREEN_WIDTH - MINI_PLAYER_WIDTH - EDGE_PADDING,
    y: SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - BOTTOM_TAB_HEIGHT - EDGE_PADDING - 50,
  })).current;

  // Snap to nearest edge on release
  const snapToEdge = (gestureX: number, gestureY: number) => {
    const currentX = gestureX;
    const currentY = gestureY;

    // Determine which horizontal edge is closer
    const snapX = currentX < SCREEN_WIDTH / 2
      ? EDGE_PADDING
      : SCREEN_WIDTH - MINI_PLAYER_WIDTH - EDGE_PADDING;

    // Constrain Y within screen bounds
    const minY = EDGE_PADDING + 50;
    const maxY = SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - BOTTOM_TAB_HEIGHT - EDGE_PADDING;
    const snapY = Math.max(minY, Math.min(currentY, maxY));

    Animated.spring(pan, {
      toValue: { x: snapX, y: snapY },
      useNativeDriver: false,
      friction: 7,
      tension: 40,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        snapToEdge(currentX, currentY);
      },
    })
  ).current;

  // Listen for viewer count updates and stream status via socket
  useEffect(() => {
    if (socketRef.current && streamData) {
      const socket = socketRef.current;

      socket.on('viewerCountUpdate', (data: { count: number }) => {
        // Update handled in context
      });

      socket.on('streamStatusUpdate', (data: { status: string }) => {
        if (data.status === 'ended') {
          Toast.show({
            type: 'info',
            text1: t('live.streamEnded'),
            text2: t('live.streamEndedMessage'),
            visibilityTime: 4000,
          });
          exitPiP();
        }
      });

      return () => {
        socket.off('viewerCountUpdate');
        socket.off('streamStatusUpdate');
      };
    }
  }, [socketRef, streamData, exitPiP, t]);

  // Handle playback status updates
  const handlePlaybackStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsBuffering(status.isBuffering);
    }
  };

  // Expand to fullscreen
  const handleExpand = () => {
    const streamId = returnToFullscreen();
    if (streamId) {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Live',
          params: {
            screen: 'LiveStream',
            params: { streamId, fromPiP: true },
          },
        })
      );
    }
  };

  // Toggle play/pause
  const togglePlayback = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  // Don't render if not active
  if (!isActive || !streamData) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Video */}
      <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: streamData.hlsUrl }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={true}
          isMuted={false}
          onPlaybackStatusUpdate={handlePlaybackStatus}
        />

        {/* Buffering indicator */}
        {isBuffering && (
          <View style={styles.bufferingOverlay}>
            <MaterialIcons name="hourglass-empty" size={20} color="white" />
          </View>
        )}

        {/* Live badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Controls overlay */}
        <View style={styles.controlsOverlay}>
          {/* Expand button */}
          <TouchableOpacity
            style={styles.expandButton}
            onPress={handleExpand}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="fullscreen" size={20} color="white" />
          </TouchableOpacity>

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={exitPiP}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info bar */}
      <TouchableOpacity style={styles.infoBar} onPress={handleExpand} activeOpacity={0.8}>
        <Text style={styles.titleText} numberOfLines={1}>
          {streamData.title}
        </Text>
        <View style={styles.viewerInfo}>
          <MaterialIcons name="visibility" size={10} color="#9ca3af" />
          <Text style={styles.viewerText}>{formatViewerCount(streamData.viewerCount)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const formatViewerCount = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: MINI_PLAYER_WIDTH,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  videoWrapper: {
    width: MINI_PLAYER_WIDTH,
    height: MINI_PLAYER_HEIGHT,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4,
  },
  liveText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    padding: 4,
  },
  expandButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
    marginRight: 4,
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  infoBar: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#1f2937',
  },
  titleText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  viewerText: {
    color: '#9ca3af',
    fontSize: 9,
    marginLeft: 3,
  },
});

export default MiniPlayer;
