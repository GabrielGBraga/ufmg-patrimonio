import { StyleSheet } from 'react-native';
import { auth } from '@/FirebaseConfig';
import { router } from 'expo-router';
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedButton } from "@/components/ui/ThemedButton";
import { useEffect } from "react";
import { useCameraPermissions } from "expo-camera";

export default function TabOneScreen() {
    const user = auth.currentUser;
    const [cameraPermission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        setTimeout(() => {
            if (!user) {
                console.log("No user logged in.");
                router.replace("/");
            }
        }, 0);
    }, []);

    const singOut = async () => {
        await auth.signOut();
        router.back();
    };

    const addPage = async () => {
        router.push({
            pathname: '/managePat',
            params: { mode: "add" }
        });
    };

    const searchPage = async () => {
        if (!cameraPermission?.granted) {
            const permission = await requestPermission();
            if (!permission.granted) {
                console.log("Camera permission denied.");
                return;
            }
        }
        router.push("/listing");
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Bem vindo!</ThemedText>

            {/* Botão para Deslogar */}
            <ThemedButton style={styles.button} onPress={singOut}>
                <ThemedText style={styles.text}>Sair</ThemedText>
            </ThemedButton>

            {/* Botão para adicionar um novo */}
            <ThemedButton style={styles.button} onPress={addPage}>
                <ThemedText style={styles.text}>Adicionar</ThemedText>
            </ThemedButton>

            {/* Botão para pesquisar um patrimonio */}
            <ThemedButton style={styles.button} onPress={searchPage}>
                <ThemedText style={styles.text}>Pesquisar</ThemedText>
            </ThemedButton>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        marginBottom: 40, // Increased space for a more airy, open feel
    },
    button: {
        width: '90%',
        padding: 20,
        borderRadius: 15, // Softly rounded corners for a modern, friendly touch
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5, // Slightly elevated for a subtle 3D effect
        marginTop: 15, // Adjusted to match the new style
    },
    text: {
        fontWeight: '800', // Semi-bold for a balanced weight
    }
});