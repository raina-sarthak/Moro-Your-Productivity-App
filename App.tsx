import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import TasksScreen from './src/screens/Tasks/TasksScreen';
import TimerScreen from './src/screens/Timer/TimerScreen';
import TrackerScreen from './src/screens/Tracker/TrackerScreen';
import { Ionicons } from '@expo/vector-icons';
import SplashScreen from './src/components/SplashScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  if (isSplashVisible) {
    return <SplashScreen onFinish={() => setIsSplashVisible(false)} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#1a1a1a',
            borderTopColor: '#333',
          },
        }}
      >
        <Tab.Screen 
          name="Tasks" 
          component={TasksScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Timer" 
          component={TimerScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="timer" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Tracker" 
          component={TrackerScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
