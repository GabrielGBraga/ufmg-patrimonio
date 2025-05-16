import React, {useState} from 'react';
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { auth } from '@/FirebaseConfig';
import { db } from '@/FirebaseConfig';
import { addDoc, collection } from 'firebase/firestore';
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';

export default function Cadastro ( loginEmail:string, loginSenha:string ) {

    const [email, setEmail] = useState(loginEmail);
    const [password, setPassword] = useState(loginSenha);
    const [showPassword, setShowPassword] = useState(false);
    const [nome, setNome] = React.useState('');
    const usuario = {
        nome: nome,
        email: email,
        password: password,
    }

    const usuarios = collection(db, 'usuarios');

    const handleCadastro = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                await addDoc(usuarios, usuario);
                setEmail('')
                setPassword('')
                setNome('')
                router.back();
            }
        } catch (error: any) {
            console.log(error);
            alert('Sign in failed: ' + error.message);
        }
    };

    return (
        <ThemedView style={styles.container}>

            <ThemedText type={'title'}>Cadastro</ThemedText>

            <ThemedTextInput
                style={styles.textInput}
                placeholder="Nome"
                value={nome}
                onChangeText={setNome}
            />

            <ThemedTextInput
                style={styles.textInput}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
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

            <ThemedButton style={styles.button} onPress={handleCadastro}>
                <ThemedText> Cadastrar </ThemedText>
            </ThemedButton>

        </ThemedView>
    );
};

const styles = StyleSheet.create({
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