import React, {useState} from 'react';
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabase';

export default function Cadastro () {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [nome, setNome] = useState('');
    const [loading, setLoading] = useState(false);

    const signUpWithEmail = async () =>{    
        
        setLoading(true)    
        
        const {      
            data: { session },      
            error,    
        } = await supabase.auth.signUp({
            email: email,      
            password: password,    
        })    
        
        if (error) Alert.alert(error.message)    
        
        if (!session) Alert.alert('Please check your inbox for email verification!')    
        
        setLoading(false)  

        router.back();
    }

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

            <ThemedButton style={styles.button} onPress={signUpWithEmail}>
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