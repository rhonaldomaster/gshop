import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LiveStreamsScreen from '../screens/live/LiveStreamsScreen';
import LiveStreamScreen from '../screens/live/LiveStreamScreen';
import CreateLiveStreamScreen from '../screens/live/CreateLiveStreamScreen';
import LiveStreamingScreen from '../screens/live/LiveStreamingScreen';
import LiveStreamResultsScreen from '../screens/live/LiveStreamResultsScreen';
import LiveForYouFeedScreen from '../screens/live/LiveForYouFeedScreen';

export type LiveStackParamList = {
  LiveMain: undefined;
  LiveStream: { streamId: string };
  CreateLiveStream: undefined;
  LiveStreaming: { streamId: string; rtmpUrl: string; streamKey: string };
  LiveStreamResults: { streamId: string; stats: any; duration: number };
  LiveForYouFeed: undefined;
};

const Stack = createNativeStackNavigator<LiveStackParamList>();

export default function LiveNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LiveMain" component={LiveStreamsScreen} />
      <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
      <Stack.Screen
        name="CreateLiveStream"
        component={CreateLiveStreamScreen}
      />
      <Stack.Screen
        name="LiveStreaming"
        component={LiveStreamingScreen}
      />
      <Stack.Screen
        name="LiveStreamResults"
        component={LiveStreamResultsScreen}
      />
      <Stack.Screen
        name="LiveForYouFeed"
        component={LiveForYouFeedScreen}
      />
    </Stack.Navigator>
  );
}
