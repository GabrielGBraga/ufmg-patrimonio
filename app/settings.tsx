import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, Platform, ActivityIndicator, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedHeader } from '@/components/ui/ThemedHeader';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { User } from '@supabase/supabase-js';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ScrollableAreaView } from '@/components/layout/ScrollableAreaView';

export default function SettingsScreen() {
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states

  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    getUserData();
  }, []);

  async function getUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      setNewName(user.user_metadata?.nome || '');
      setNewEmail(user.email || '');
    }
    setLoading(false);
  }

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente sair da conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/');
        }
      }
    ]);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setUpdating(true);

    try {
      const updates: any = {};
      let emailChanged = false;

      // Check if name changed

      if (newName !== user.user_metadata?.nome) {
        updates.data = { nome: newName };
      }

      // Check if email changed

      if (newEmail !== user.email) {
        updates.email = newEmail;
        emailChanged = true;
      }

      // If nothing changed, just exit edit mode

      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        setUpdating(false);
        return;
      }

      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      if (emailChanged) {
        Alert.alert(
          "Verifique seu Email",
          "Para atualizar seu endereço de email, você precisa clicar no link de confirmação enviado para o novo endereço."
        );
      } else {
        Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      }

      // Update local data

      setUser(data.user);
      setIsEditing(false);

    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", error.message || "Não foi possível atualizar o perfil.");
    } finally {
      setUpdating(false);
    }
  };

  const cancelEdit = () => {
    // Revert changes and exit edit mode

    if (user) {
      setNewName(user.user_metadata?.nome || '');
      setNewEmail(user.email || '');
    }
    setIsEditing(false);
  };

  const editColor = useThemeColor({ light: "", dark: "" }, 'buttonBackground');

  return (
    <ThemedView style={styles.container}>
      {/* 1. KeyboardAvoidingView to push content */}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // Fine tuning for header

      >
        {/* 2. TouchableWithoutFeedback to dismiss keyboard */}

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <ScrollableAreaView>
              <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

              <ThemedHeader title="Configurações" onPressIcon={() => router.back()} variant='back' />

              <ThemedView style={styles.content}>

                <ThemedView style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Minha Conta</ThemedText>
                  {/* Edit Button (pencil) */}

                  {!loading && !isEditing && (
                    <ThemedButton onPress={() => setIsEditing(true)} style={styles.iconButton}>
                      <Ionicons name="pencil" size={20} color={editColor} />
                      <ThemedText style={{ color: editColor, marginLeft: 5 }}>Editar</ThemedText>
                    </ThemedButton>
                  )}
                </ThemedView>

                {loading ? (
                  <ActivityIndicator style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
                ) : (
                  <ThemedView style={styles.infoContainer}>

                    {/* NAME Field */}

                    <ThemedText style={styles.label}>Nome:</ThemedText>
                    {isEditing ? (
                      <ThemedTextInput
                        value={newName}
                        onChangeText={setNewName}
                        placeholder="Seu nome"
                        placeholderTextColor="#999"
                      />
                    ) : (
                      <ThemedText style={styles.value}>{user?.user_metadata?.nome || 'Não disponível'}</ThemedText>
                    )}

                    {/* EMAIL Field */}

                    <ThemedText style={styles.label}>E-mail:</ThemedText>
                    {isEditing ? (
                      <ThemedTextInput
                        value={newEmail}
                        onChangeText={setNewEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="seu@email.com"
                        placeholderTextColor="#999"
                      />
                    ) : (
                      <ThemedText style={styles.value}>{user?.email || 'Não disponível'}</ThemedText>
                    )}

                    {/* ID (Always read-only) */}

                    <ThemedText style={styles.label}>ID do Usuário:</ThemedText>
                    <ThemedText style={[styles.value, { fontSize: 12, opacity: 0.6 }]}>
                      {user?.id}
                    </ThemedText>

                    {/* Edit Action Buttons */}

                    {isEditing && (
                      <ThemedView style={styles.actionButtons}>
                        <ThemedButton
                          onPress={cancelEdit}
                          style={[styles.smallButton, styles.cancelButton]}
                          disabled={updating}
                        >
                          <ThemedText style={{ color: 'white' }}>Cancelar</ThemedText>
                        </ThemedButton>

                        <ThemedButton
                          onPress={handleUpdateProfile}
                          style={[styles.smallButton]}
                          disabled={updating}
                        >
                          {updating ? <ActivityIndicator color="#fff" /> : <ThemedText style={{ color: 'white' }}>Salvar</ThemedText>}
                        </ThemedButton>
                      </ThemedView>
                    )}

                  </ThemedView>
                )}

                <ThemedView style={styles.separator} />

                <ThemedText style={styles.sectionTitle}>Sobre o App</ThemedText>
                <ThemedText style={styles.infoText}>
                  Versão: {appVersion} (MCMEG)
                </ThemedText>

                {!isEditing && (
                  <ThemedButton onPress={handleLogout} style={styles.logoutButton}>
                    <ThemedText style={styles.logoutText}>Sair da Conta</ThemedText>
                  </ThemedButton>
                )}

              </ThemedView>
            </ScrollableAreaView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
  },
  content: {
    marginTop: 20,
    gap: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconButton: {
    backgroundColor: 'rgba(51, 49, 49, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  infoContainer: {
    gap: 5,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: 5,
  },
  value: {
    fontSize: 16,
    marginBottom: 5,
    paddingVertical: 4,
  },
  infoText: {
    marginBottom: 20,
    opacity: 0.7,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    opacity: 0.3,
    marginVertical: 10,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    marginTop: 20,
  },
  logoutText: {
    fontWeight: 'bold',
    color: 'white',
  },
  // Save/Cancel Buttons

  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  smallButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  }
});