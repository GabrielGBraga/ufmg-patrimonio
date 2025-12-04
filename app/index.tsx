import { StyleSheet, Alert, AppState, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from 'react';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { ThemedView } from '@/components/ui/ThemedView';
import { supabase } from '../utils/supabase';

AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh()
    } else {
        supabase.auth.stopAutoRefresh()
    }
})

export default function Index() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false)

    // Reset variables when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            setEmail('');
            setPassword('');
            setShowPassword(false);
            return () => {
                // Cleanup if needed
            };
        }, [])
    );

    const signInWithEmail = async () => {
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            })
            if (error) return Alert.alert('Email ou senha incorretos.')
            else Alert.alert('Logado com sucesso!')
        } catch (error) {
            Alert.alert('Erro durante o login.')
            console.error("Logging error: ", error);
        }
        setLoading(false)
        router.push('/(tabs)')
    }

    const navigateToSignUp = () => {
        router.push({
            pathname: '/cadastro',
            params: {
                email: email,
                password: password
            }
        });
    };

    return (
        <SafeAreaView style={styles.safeView}>
            {/* 1. KeyboardAvoidingView empurra o conteúdo para cima */}
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                {/* 2. TouchableWithoutFeedback fecha o teclado ao clicar fora */}
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ThemedView style={styles.container}>
                        <ThemedText type="title">Entrar</ThemedText>
                        <ThemedTextInput
                            style={styles.textInput}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <ThemedTextInput
                            style={styles.textInput}
                            placeholder="Senha"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            iconName={showPassword ? "eye-off" : "eye"}
                            onIconPress={() => setShowPassword(!showPassword)}
                        />
                        <ThemedButton style={styles.button} onPress={() => signInWithEmail()}>
                            <ThemedText style={styles.text}>Entrar</ThemedText>
                        </ThemedButton>
                        <ThemedButton style={styles.button} onPress={navigateToSignUp}>
                            <ThemedText style={styles.text}>Cadastrar</ThemedText>
                        </ThemedButton>
                    </ThemedView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeView: {
        flex: 1
    },
    keyboardAvoidingView: {
        flex: 1
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        width: '90%',
        marginVertical: 15,
        fontSize: 16,
    },
    button: {
        width: '90%',
        marginVertical: 15,
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
    },
    text: {
        fontSize: 20,
        fontWeight: '800',
    },
});