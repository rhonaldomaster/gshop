import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LiveStreamsScreen from '../screens/live/LiveStreamsScreen';
import LiveStreamScreen from '../screens/live/LiveStreamScreen';
import CreateLiveStreamScreen from '../screens/live/CreateLiveStreamScreen';
import LiveStreamingScreen from '../screens/live/LiveStreamingScreen';
import LiveStreamResultsScreen from '../screens/live/LiveStreamResultsScreen';

export type LiveStackParamList = {
  LiveMain: undefined;
  LiveStream: { streamId: string };
  CreateLiveStream: undefined;
  LiveStreaming: { streamId: string; rtmpUrl: string; streamKey: string };
  LiveStreamResults: { streamId: string; stats: any; duration: number };
};

const Stack = createStackNavigator<LiveStackParamList>();

export default function LiveNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="LiveMain" component={LiveStreamsScreen} />
      <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
      <Stack.Screen
        name="CreateLiveStream"
        component={CreateLiveStreamScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="LiveStreaming"
        component={LiveStreamingScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="LiveStreamResults"
        component={LiveStreamResultsScreen}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
