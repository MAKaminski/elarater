import { Tabs } from 'expo-router';
import { Lantern } from '@/components/primitives';
import { color } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: color.wallLift, borderTopColor: color.brass, borderTopWidth: 1 },
        tabBarActiveTintColor: color.officeLight,
        tabBarInactiveTintColor: color.wallTextDim,
        sceneStyle: { backgroundColor: color.wall },
      }}
    >
      {/* Tab bar icons are the Lantern, filled vs. 40% opacity. docs/04-design-system.md */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Nearby',
          tabBarIcon: ({ focused }) => (
            <Lantern size={20} tone={focused ? 'officeLight' : 'wallTextDim'} opacity={focused ? 1 : 0.4} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Lantern size={20} tone={focused ? 'officeLight' : 'wallTextDim'} opacity={focused ? 1 : 0.4} />
          ),
        }}
      />
    </Tabs>
  );
}
