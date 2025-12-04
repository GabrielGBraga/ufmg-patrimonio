import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors'; // Supondo que você tenha esse arquivo padrão do Expo

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  // Se você não tiver o arquivo de constantes Colors, pode trocar 
  // Colors[colorScheme ?? 'light'].tint por uma cor fixa como '#2f95dc'
  const activeColor = Colors?.[colorScheme ?? 'light']?.tint || '#0a7ea4';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        headerShown: false, // Oculta o cabeçalho padrão das abas (já que você usa o seu ThemedHeader)
      }}>
      
      {/* 1. Aba de Listagem */}
      <Tabs.Screen
        name="listing"
        options={{
          title: 'Patrimônios',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="list" color={color} />,
        }}
      />

      {/* 2. Aba de Gerenciar (Adicionar) */}
      <Tabs.Screen
        name="managePat"
        options={{
          title: 'Novo',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="plus-square" color={color} />,
        }}
      />

      {/* 3. Ocultar o Index da barra de abas */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Isso faz com que não apareça botão para esta rota na barra de baixo
        }}
      />
    </Tabs>
  );
}