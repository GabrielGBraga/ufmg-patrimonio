import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ManagePatScreenContent from '@/components/ManagePatScreenContent';

export default function ManagePatModal() {
  return (
    <>
      {/* Ajusta a status bar para ficar bonita no estilo modal do iOS */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <ManagePatScreenContent />
    </>
  );
}