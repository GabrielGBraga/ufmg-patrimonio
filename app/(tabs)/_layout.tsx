import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';


export default function TabLayout() {
  const colorScheme = useColorScheme();

  // If you don't have the Colors constants, you can swap for a fixed color
  const activeColor = Colors?.[colorScheme ?? 'light']?.tint || '#0a7ea4';


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        headerShown: false, // Hides default header since we use ThemedHeader

      }}>

      {/* 1. Listing Tab */}

      <Tabs.Screen
        name="listing"
        options={{
          title: 'Patrimônios',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="list" color={color} />,
        }}
      />

      {/* 2. Manage (Add) Tab */}

      <Tabs.Screen
        name="managePat"
        options={{
          title: 'Novo',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="plus-square" color={color} />,
        }}
      />

      {/* 3. Hide Index from tab bar */}

      <Tabs.Screen
        name="index"
        options={{
          href: null, // This hides the button for this route in the tab bar

        }}
      />
    </Tabs>
  );
}