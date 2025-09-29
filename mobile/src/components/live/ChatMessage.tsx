import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatMessageProps {
  message: {
    id: string;
    username: string;
    message: string;
    sentAt: string;
    user?: any;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUsernameColor = (username: string) => {
    // Generate a consistent color based on username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      '#ef4444', // red
      '#f97316', // orange
      '#eab308', // yellow
      '#22c55e', // green
      '#06b6d4', // cyan
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  const isSystemMessage = message.username === 'System';

  return (
    <View style={[styles.container, isSystemMessage && styles.systemContainer]}>
      {!isSystemMessage && (
        <View style={styles.messageHeader}>
          <View style={styles.usernameBadge}>
            <Text style={[styles.username, { color: getUsernameColor(message.username) }]}>
              {message.username}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {formatTime(message.sentAt)}
          </Text>
        </View>
      )}
      <Text style={[styles.messageText, isSystemMessage && styles.systemText]}>
        {message.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  systemContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    alignSelf: 'center',
    maxWidth: '80%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  usernameBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginRight: 8,
  },
  username: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  systemText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});