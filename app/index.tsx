import {StyleSheet, Alert} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import React, {useEffect, useState} from 'react';
import { auth } from '@/FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { ThemedView } from '@/components/ui/ThemedView';

export default function Index() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const signIn = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                setEmail('');
                setPassword('');
                router.push('/(tabs)');
                console.log("User logged in")
            }
        } catch (error: any) {
            console.error(error);
            alert('Sign in failed: ' + error.message);
        }
    };

    const navigateToSignUp = () => {
        setEmail('');
        setPassword('');
        router.push('/cadastro')
    };

    return (
        <SafeAreaView style={styles.safeView}>
            <ThemedView style={styles.container}>    
                <ThemedText type="title">Entrar</ThemedText>
                <ThemedTextInput
                    style={styles.textInput}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
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
                <ThemedButton style={styles.button} onPress={signIn}>
                    <ThemedText style={styles.text}>Entrar</ThemedText>
                </ThemedButton>
                <ThemedButton style={styles.button} onPress={navigateToSignUp}>
                    <ThemedText style={styles.text}>Cadastrar</ThemedText>
                </ThemedButton>
            </ThemedView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeView:{
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
