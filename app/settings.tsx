import { StyleSheet, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedHeader } from '@/components/ui/ThemedHeader';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';

export default function SettingsScreen() {

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente sair da conta?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Sair", 
        style: "destructive", 
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/'); // Volta para o login (index da raiz)
        }
      }
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      {/* StatusBar ajustada para iOS Modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      
      {/* Header com função de fechar o modal */}
      <ThemedHeader title="Configurações" onPressIcon={() => router.back()} variant='back'/>

      <ThemedView style={styles.content}>
        <ThemedText style={styles.sectionTitle}>Conta</ThemedText>
        
        <ThemedText style={styles.infoText}>
          Versão do App: 1.0.0 (MCMEG)
        </ThemedText>
 
        <ThemedButton onPress={handleLogout} style={styles.logoutButton}>
          <ThemedText style={styles.logoutText}>Sair da Conta</ThemedText>
        </ThemedButton>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
    marginTop: 20,
    gap: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    marginBottom: 20,
    opacity: 0.7,
  },
  logoutButton: {
    backgroundColor: '#dc3545', // Vermelho para logout
    marginTop: 20,
  },
  logoutText: {
    fontWeight: 'bold',
    color: 'white',
  }
});