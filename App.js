// ═══════════════════════════════════════════════════════════════
//  App.js — NestAir Root Entry Point
//  Expo SDK 51 · React Navigation v6 · Bottom Tabs
//  Screens path: components/screens/
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';

// Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Safe area
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Status bar
import { StatusBar } from 'expo-status-bar';

// ── Screens ──────────────────────────────────────────────────
import HomeScreen          from './components/screens/HomeScreen';
import ProjectListScreen   from './components/screens/ProjectListScreen';
import ProjectDetailScreen from './components/screens/ProjectDetailScreen';
import ROICalculatorScreen from './components/screens/ROICalculatorScreen';

// ── Theme ────────────────────────────────────────────────────
import { COLORS } from './constants/theme';

// ═══════════════════════════════════════════════════════════════
//  Navigators
// ═══════════════════════════════════════════════════════════════

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Tab icon helper ───────────────────────────────────────────
function TabIcon({ emoji, label, focused }) {
  return (
    <Text style={[
      styles.tabIcon,
      focused && styles.tabIconFocused,
    ]}>
      {emoji}
    </Text>
  );
}

// ─── Projects stack (List → Detail) ────────────────────────────
function ProjectsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProjectList"   component={ProjectListScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
    </Stack.Navigator>
  );
}

// ─── Bottom Tab Navigator ──────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor:   COLORS.cyan,
        tabBarInactiveTintColor: COLORS.textDim,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Air Quality',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🌬️" label="Air Quality" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsStack}
        options={{
          title: 'Properties',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏗️" label="Properties" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ROITab"
        component={ROICalculatorScreen}
        options={{
          title: 'ROI Calc',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="ROI Calc" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Root App
// ═══════════════════════════════════════════════════════════════
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Styles
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor:  COLORS.border,
    borderTopWidth:  1,
    height:          Platform.OS === 'ios' ? 82 : 64,
    paddingBottom:   Platform.OS === 'ios' ? 22 : 8,
    paddingTop:      8,
  },
  tabIcon: {
    fontSize:   22,
    lineHeight: 28,
    opacity:    0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize:   10,
    fontWeight: '600',
    marginTop:  2,
  },
});