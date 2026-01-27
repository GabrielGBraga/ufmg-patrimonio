import { StyleSheet, Alert, AppState, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, TextInput } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { ThemedView } from '@/components/ui/ThemedView';
import { supabase } from '../utils/supabase';
import { checkServerStatus } from '@/hooks/checkConnection';

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
    const [connection, setConnection] = useState(true);
    const passwordRef = useRef<TextInput>(null);

    useEffect(() => {
        const checkConnection = async () => {
            const isConnected = await checkServerStatus();
            setConnection(isConnected);
        };

        checkConnection();
    }, [])

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
            if (error) return Alert.alert('Email ou senha incorretos.', error.message)
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

    return !connection ? (
        <ThemedView style={styles.safeView}>
            <ThemedView style={styles.container}>
                <ThemedText type="title">Erro de conexão</ThemedText>
                <ThemedText style={{ textAlign: 'center', marginHorizontal: 20, marginTop: 10 }}>
                    Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.
                </ThemedText>

                <ThemedButton
                    style={styles.button}
                    onPress={async () => {
                        setLoading(true);
                        const isConnected = await checkServerStatus();
                        setConnection(isConnected);
                        setLoading(false);
                        if (!isConnected) {
                            Alert.alert('Ainda sem conexão', 'Tente novamente mais tarde.');
                        }
                    }}
                >
                    <ThemedText style={styles.text}>{loading ? 'Verificando...' : 'Tentar novamente'}</ThemedText>
                </ThemedButton>
            </ThemedView>
        </ThemedView>
    ) : (
        <ThemedView style={styles.safeView}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <ThemedView style={styles.container}>
                    <ThemedText type="title">Entrar</ThemedText>
                    <ThemedTextInput
                        style={styles.textInput}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                    />
                    <ThemedTextInput
                        ref={passwordRef}
                        style={styles.textInput}
                        placeholder="Senha"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        iconName={showPassword ? "eye-off" : "eye"}
                        onIconPress={() => setShowPassword(!showPassword)}
                        returnKeyType="go"
                        onSubmitEditing={signInWithEmail}
                    />
                    <ThemedButton style={styles.button} onPress={() => signInWithEmail()}>
                        <ThemedText style={styles.text}>Entrar</ThemedText>
                    </ThemedButton>
                    <ThemedButton style={styles.button} onPress={navigateToSignUp}>
                        <ThemedText style={styles.text}>Cadastrar</ThemedText>
                    </ThemedButton>

                </ThemedView>
            </KeyboardAvoidingView>
        </ThemedView>
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