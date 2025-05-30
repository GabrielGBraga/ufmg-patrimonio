import {ActivityIndicator, Alert, Image, StyleSheet} from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from '@/FirebaseConfig';
import { addDoc, collection, deleteDoc, doc, updateDoc, waitForPendingWrites } from 'firebase/firestore';
import { StorageReference } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedButton } from "@/components/ui/ThemedButton";
import { ScrollableAreaView } from "@/components/layout/ScrollableAreaView";
import { TextInputGroup } from "@/components/TextInputGroup";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { getImage, uploadImage, deleteImage, getImageUrl } from "@/hooks/ImageHandler";
import { patrimonio, Patrimonio } from "@/constants/Patrimonio";
import { ThemedHeader } from '@/components/ui/ThemedHeader';
import { router, useLocalSearchParams } from 'expo-router';
import { getDownloadURL } from "firebase/storage";


// Define the interface BEFORE using it
interface LocalSearchParams {
    mode?: string;
    patrimonioParam?: string;
    patrimonioId?: string;
}

// noinspection JSUnusedGlobalSymbols
export default function manegePat() {
    
    const params = useLocalSearchParams() as LocalSearchParams; // Type assertion

    const mode = params.mode;
    const docId = params.patrimonioId ? JSON.parse(params.patrimonioId) : null;

    const title = mode === "edit" ? 'Editar Patrimônio' : "Adicionar Patrimônio";
    const finalButtonText = mode === "edit" ? 'Atualizar' : "Adicionar";

    const auth = getAuth();
    const user = auth.currentUser;

    // Referência à coleção "patrimonios" no Firestore.
    const patrimoniosRef = mode === "edit" && docId 
        ? doc(db, "patrimonios", docId) 
        : collection(db, 'patrimonios');
    
    const patrimonioData = (params.patrimonioParam && mode === "edit") 
        ? JSON.parse(params.patrimonioParam as string) as Patrimonio 
        : patrimonio;

    const [formData, setFormData] = useState(patrimonioData);

    useEffect(() => {
        if (mode === "edit" && formData.image.ref) {
            setFormData((prevState) => ({
                ...prevState,
                image: {
                    ...prevState.image,
                    ref: JSON.parse(prevState.image.ref as string) as StorageReference,
                },
            }));
        }
    }, [mode, formData.image.ref]);

    const hasEditImage = mode === "edit" && formData.image.ref != null && typeof formData.image.ref === 'object' && 'bucket' in formData.image.ref

    // Estados iniciais para imagem, botão "Adicionar" pressionado e alternância de ATM.
    const [image, setImage] = useState<any>(
        hasEditImage
            ? getImageUrl(formData.image.ref as StorageReference)
            : null
    );
    const [isAddingPatrimonio, setIsAddingPatrimonio] = useState(false);
    const [boolAtm, setBollAtm] = useState(false);
    const [loading, setLoading] = useState(false);

    /**
     * Efeito colateral para adicionar um patrimônio após a URL da imagem ser atualizada.
     */
    useEffect(() => {
        if (isAddingPatrimonio) {
            addPatrimonio();
            setIsAddingPatrimonio(false);
        }
    }, [isAddingPatrimonio]);

    /**
     * Manipula a alteração nos checkboxes, alternando o estado selecionado.
     */
    const handleCheckboxChange = (value: string) => {
        setFormData((prevState) => ({
            ...prevState,
            conservacao: value === prevState.conservacao ? patrimonio.conservacao : value,
        }));
    };

    /**
     * Adiciona um novo patrimônio no Firestore após validar os dados.
     */
    const addPatrimonio = async () => {
        try {
            if (user) {
                console.log("Adding patrimonio");
                
                if (mode === "add") {
                    // Ensure we are using a CollectionReference
                    console.log("to add")
                    await addDoc(collection(db, "patrimonios"), { ...formData });
                    console.log("after add")
                } else if (mode === "edit" && docId) {
                    // Ensure we are using a DocumentReference
                    await updateDoc(doc(db, "patrimonios", docId), { ...formData });
                } else {
                    console.error("Invalid mode or missing docId");
                }
                console.log("Added")
                // Reseta o formulário e imagem após salvar.
                setFormData(patrimonio);
                await resetImage();
                setLoading(false);
                
                mode === "add" ? alert('Patrimonio adicionado') : alert('Patrimonio Editado');
                
                router.back()
            } else {
                console.error('Não há usuário logado');
            }
        } catch (error) {
            console.error("Erro ao tentar adicionar patrimonio: ", error)
        }
        
    };

    /**
     * Reseta o estado da imagem para o padrão.
     */
    const resetImage = async () => {
        setImage(null);
    };

    // Configurações dinâmicas de entrada para o TextInputGroup.
    const inputConfigs = [
        { label: 'Número de Patrimônio', placeholder: 'Digite o número de patrimônio', key: 'patNum' },
        { label: 'Número ATM', placeholder: 'Digite o número ATM', key: 'atmNum', isSwitch: true, switchKey: 'boolAtm' },
        { label: 'Descrição', placeholder: 'Digite a descrição', key: 'descricao' },
        { label: 'Valor', placeholder: 'Digite o valor', key: 'valor' },
        { label: 'Responsável', placeholder: 'Digite o nome do responsável', key: 'responsavel' },
        { label: 'Sala', placeholder: 'Digite o numero da sala', key: 'sala'}
    ];

    const inputs = inputConfigs.map((config) => ({
        label: config.label,
        placeholder: config.placeholder,
        inputValue: formData[config.key],
        onInputChange: (text: string) => setFormData((prevState) => ({ ...prevState, [config.key]: text })),
        isSwitch: config.isSwitch || false,
        switchValue: config.isSwitch ? boolAtm : false,
        onSwitchChange: config.isSwitch ? (value: boolean) => setBollAtm(value) : () => {},
    }));

    /**
     * Deleta o patriomonio
     */
    const deletePatrimonio = async () => {
        if (docId) {
            try {
                await deleteDoc(doc(db, "patrimonios", docId));
                console.log("Patrimonio deleted successfully");
                router.back()
            } catch (error) {
                console.error("Error deleting patrimonio:", error);
            }
        } else {
            console.warn("docId is undefined. Cannot delete patrimonio.");
            //Or you can throw an error.
            //throw new Error("docId is undefined");
        }
    };
    
    /**
     * Manipula a seleção de imagem e atualiza os dados do formulário.
     */
    const handleSelectImage = async (selectionType: 'Camera'|'Gallery') => {
        try {
            const result = await getImage(selectionType);
            console.log("Image received: ", !!result);
            if (result) {
                setImage(result.uri);
                setFormData((prevState) => ({
                    ...prevState,
                    image: {
                        ...prevState.image,
                        height: result.height,
                        width: result.width,
                    }
                }));
            } else {
                console.log('Nenhuma imagem selecionada');
            }
        } catch (error) {
            console.error('Erro ao escolher a imagem:', error);
            Alert.alert(
                'Erro',
                'Não foi possível selecionar a imagem. Por favor, tente novamente.'
            );
        }
    };

    /**
     * Faz o upload da imagem selecionada e salva a URL no formulário.
     */
    const handleUploadImage = async () => {

        if(user && image){

            const email = user.email;

            setLoading(true);

            try {
                if (mode === "edit" && formData.image.ref) {
                    try {
                        await deleteImage(formData.image.ref as StorageReference);
                    } catch (error) {
                        console.error('Erro ao deletar a imagem:', error);
                        Alert.alert('Erro', 'Ocorreu um erro durante a exclusão da imagem. Por favor, tente novamente.');
                        return
                    }
                }

                const imageUrl = await uploadImage(user.uid, image);
                if (imageUrl) {
                    setFormData((prevState) => ({
                        ...prevState,
                        image: {
                            ...prevState.image,
                            url: imageUrl,
                        },
                        email: email ?? ""
                    }));
                    console.log("A")
                } else {
                    console.log('Erro ao fazer upload da imagem');
                    Alert.alert('Erro', 'Não foi possível fazer o upload da imagem.');
                }
                setIsAddingPatrimonio(true);
            } catch (error) {
                console.error('Erro no upload da imagem:', error);
                Alert.alert('Erro', 'Ocorreu um erro durante o upload da imagem. Por favor, tente novamente.');
            }
        }else{
            Alert.alert('Erro', 'Usuário ou imagem não encontrados!');
            return;
        }
    };

    return (
        <ScrollableAreaView style={styles.safeArea}>
            <ThemedView style={styles.container}>

                {/* Header da página */}
                <ThemedHeader title={title} arrowBack={() => {router.back}}/>

                {/* Botão para selecionar imagem */}
                {!image ? (
                    <ThemedView style={{flexDirection: 'row'}}>
                        <ThemedButton style={styles.imageButton} onPress={() => handleSelectImage('Gallery')}>
                            <ThemedText style={styles.buttonText}>Escolher uma imagem</ThemedText>
                        </ThemedButton>
                        <ThemedButton style={styles.imageButton} onPress={() => handleSelectImage('Camera')}>
                            <ThemedText style={styles.buttonText}>Tirar foto</ThemedText>
                        </ThemedButton>
                    </ThemedView>
                ) : (
                    <ThemedView style={styles.imageContainer}>
                        <Image
                            source={{ uri: image }}
                            style={[styles.image, {
                                width: formData.image.width || 200,
                                height: formData.image.height || 200,
                            }]}
                        />
                        <ThemedButton style={styles.button} onPress={resetImage}>
                            <ThemedText style={styles.buttonText}>Cancelar</ThemedText>
                        </ThemedButton>
                    </ThemedView>
                )}

                {/* Inputs do formulário */}
                <TextInputGroup inputs={inputs} />

                {/* Grupo de checkboxes para conservação */}
                <CheckboxGroup selectedCheckbox={formData.conservacao} onCheckboxChange={handleCheckboxChange} />

                {mode === "edit" && (
                    <ThemedButton style={styles.button} onPress={deletePatrimonio}>
                        <ThemedText style={styles.buttonText}>Deletar</ThemedText>
                    </ThemedButton>
                )}

                {/* Botão para adicionar patrimônio */}
                <ThemedButton style={styles.button} onPress={handleUploadImage}>
                    <ThemedText style={styles.buttonText}>{finalButtonText}</ThemedText>
                </ThemedButton>

            </ThemedView>
        </ScrollableAreaView>
    );
}

/**
 * Estilos da página.
 */
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 24,
    },
    title: {
        paddingTop: 60,
        marginBottom: 24,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
    },
    imageButton: {
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        marginBottom: 15,
        marginHorizontal: 10,
        flex: 1
    },
    imageContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    image: {
        margin: 10,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        margin: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});