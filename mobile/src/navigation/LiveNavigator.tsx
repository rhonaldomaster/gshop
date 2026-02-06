import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LiveStreamsScreen from '../screens/live/LiveStreamsScreen';
import LiveStreamScreen from '../screens/live/LiveStreamScreen';
import CreateLiveStreamScreen from '../screens/live/CreateLiveStreamScreen';
import LiveStreamingScreen from '../screens/live/LiveStreamingScreen';
import LiveStreamResultsScreen from '../screens/live/LiveStreamResultsScreen';
import LiveForYouFeedScreen from '../screens/live/LiveForYouFeedScreen';
import NativeBroadcastScreen from '../screens/live/NativeBroadcastScreen';
import GoLiveScreen from '../screens/live/GoLiveScreen';
import OBSSetupScreen from '../screens/live/OBSSetupScreen';
import VodListScreen from '../screens/live/VodListScreen';
import VodPlayerScreen from '../screens/live/VodPlayerScreen';
import LiveCartCheckoutScreen from '../screens/live/LiveCartCheckoutScreen';
import { LiveCartItemData } from '../components/live/LiveCartItem';

export type LiveStackParamList = {
  LiveMain: undefined;
  LiveStream: { streamId: string; fromPiP?: boolean };
  CreateLiveStream: undefined;
  LiveStreaming: { streamId: string; rtmpUrl: string; streamKey: string };
  LiveStreamResults: { streamId: string; stats: any; duration: number };
  LiveForYouFeed: undefined;
  GoLive: { streamId: string; hostType: 'seller' | 'affiliate' };
  NativeBroadcast: { streamId: string; hostType: 'seller' | 'affiliate'; useOBS?: boolean };
  OBSSetup: { streamId: string; hostType: 'seller' | 'affiliate' };
  VodList: undefined;
  VodPlayer: { vodId: string };
  LiveCartCheckout: { items: LiveCartItemData[]; streamId: string; affiliateId?: string };
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
      <Stack.Screen
        name="GoLive"
        component={GoLiveScreen}
      />
      <Stack.Screen
        name="NativeBroadcast"
        component={NativeBroadcastScreen}
      />
      <Stack.Screen
        name="OBSSetup"
        component={OBSSetupScreen}
      />
      <Stack.Screen
        name="VodList"
        component={VodListScreen}
      />
      <Stack.Screen
        name="VodPlayer"
        component={VodPlayerScreen}
      />
      <Stack.Screen
        name="LiveCartCheckout"
        component={LiveCartCheckoutScreen}
        options={{
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
