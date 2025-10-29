import {ActivityIndicator, Alert, Image, StyleSheet, View} from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from '@/FirebaseConfig';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedButton } from "@/components/ui/ThemedButton";
import { ScrollableAreaView } from "@/components/layout/ScrollableAreaView";
import { TextInputGroup } from "@/components/TextInputGroup";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { deleteImage, getImage, uploadImage } from "@/hooks/ImageHandler";
import { patrimonio, Patrimonio } from "@/constants/Patrimonio";
import { ThemedHeader } from '@/components/ui/ThemedHeader';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import CameraScreen from '@/components/ui/CameraScreen';
import { formatAtmNum, formatPatNum } from '@/hooks/formating';
import { supabase } from '@/utils/supabase';

export default  function manegePat() {
    
    const params = useLocalSearchParams();
    const mode = params.mode as string;
    const docId = params.patrimonioId as string;

    const title = mode === "edit" ? 'Editar Patrimônio' : "Adicionar Patrimônio";
    const finalButtonText = mode === "edit" ? 'Atualizar' : "Adicionar";

    const user = async () => {
        return (await supabase.auth.getUser()).data.user;
    }

    const [formData, setFormData] = useState<Patrimonio | null>(mode === 'add' ? patrimonio : null);
    const [image, setImage] = useState<string | null>(null);
    const [boolAtm, setBoolAtm] = useState(false);
    const [loading, setLoading] = useState(mode === 'edit');
    const [imageCancel, setImageCancel] = useState(false);
    const [scanBool, setScanBool] = useState(false);

    const { control, handleSubmit, formState: { errors }, setValue } = useForm();

    useEffect(() => {
        if(formData?.atmNum != ''){
            setBoolAtm(true)
        }
    }, [formData?.atmNum])
    
    useEffect(() => {
        if (formData?.image.fileName && formData?.image.fileName !== '') {
            const { data } = supabase
                .storage
                .from('public-bucket')
                .getPublicUrl('folder/avatar1.png')
            setImage(data.publicUrl);
        }
    }, [formData?.image.fileName]);

    useEffect(() => {
        if (mode === 'edit' && docId) {
            const fetchPatrimonioData = async () => {
                const docRef = doc(db, 'patrimonios', docId);
                try {
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const patrimonioData = docSnap.data() as Patrimonio;
                        setFormData(patrimonioData);
                        if (patrimonioData.image && patrimonioData.image.fileName) {
                            setImage(patrimonioData.image.fileName);
                        }
                    } else {
                        Alert.alert("Erro", "Patrimônio não encontrado.");
                        router.back();
                    }
                } catch (error) {
                    console.error("Erro ao buscar dados do patrimônio:", error);
                    Alert.alert("Erro", "Não foi possível carregar os dados.");
                } finally {
                    setLoading(false);
                }
            };
            fetchPatrimonioData();
        }
    }, [mode, docId]);

    const handleCheckboxChange = (value: string) => {
        // ✅ **CORREÇÃO**: Adicionada verificação de segurança para o estado nulo.
        setFormData((prevState) => {
            if (!prevState) return null;
            return {
                ...prevState,
                conservacao: value === prevState.conservacao ? '' : value,
            };
        });
    };

    const resetImage = async () => {
        setImage(null);
        setImageCancel(true);
    };

    // const checkExistingPat = async (patNum: string, atmNum: string) => {
    //     if (!(await user())) return false;

    //     try {
    //         const q = query(collection(db, "patrimonios"), where("patNum", "==", patNum));
    //         let search = await getDocs(q);
    //         if (search.empty || patNum === '') {
    //             const q = query(collection(db, "patrimonios"), where("atmNum", "==", atmNum));
    //             search = await getDocs(q);
    //             if (search.empty || atmNum === '') {
    //                 return false;
    //             }else{
    //                 return true;
    //             }
    //         } else{
    //             return true;
    //         }
    //     } catch (error) {
    //         console.error("Erro ao buscar patrimônios: ", error);
    //         return false;
    //     }
    // }

    const inputs = formData ? [
        { label: 'Número de Patrimônio', placeholder: 'Digite o número de patrimônio', key: 'patNum' },
        { label: 'Número ATM', placeholder: 'Digite o número ATM', key: 'atmNum', isSwitch: true, switchKey: boolAtm },
        { label: 'Descrição', placeholder: 'Digite a descrição', key: 'descricao' },
        { label: 'Valor', placeholder: 'Digite o valor', key: 'valor' },
        { label: 'Responsável', placeholder: 'Digite o nome do responsável', key: 'responsavel' },
        { label: 'Sala', placeholder: 'Digite o numero da sala', key: 'sala'}
    ].map((config) => ({
        label: config.label,
        placeholder: config.placeholder,
        inputValue: formData[config.key as keyof Patrimonio] as string,
        // ✅ **CORREÇÃO**: Adicionada verificação de segurança para o estado nulo.
        onInputChange: (text: string) => setFormData(prevState => prevState ? { ...prevState, [config.key]: text } : null),
        isSwitch: config.isSwitch || false,
        switchValue: config.isSwitch ? boolAtm : false,
        onSwitchChange: config.isSwitch ? (value: boolean) => setBoolAtm(value) : () => {},
    })) : [];

    const deletePatrimonio = async () => {
        if (docId) {
            Alert.alert(
                "Confirmar Exclusão",
                "Você tem certeza que deseja deletar este patrimônio?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Deletar", style: "destructive",

                        onPress: async () => {
                            try {
                                setLoading(true);
                                if (formData?.image?.fileName) {
                                    await deleteImage(formData.image.fileName);
                                }
                                await deleteDoc(doc(db, "patrimonios", docId));
                                Alert.alert("Sucesso", "Patrimônio deletado.");
                                router.back();
                            } catch (error) {
                                setLoading(false);
                                console.error("Erro ao deletar patrimônio:", error);
                                Alert.alert("Erro", "Não foi possível deletar o patrimônio.");
                            }
                        }
                    }
                ]
            );
        }
    };
    
    const handleSelectImage = async (selectionType: 'Camera' | 'Gallery') => {
        try {
            const result = await getImage(selectionType);
            if (result) {
                setImage(result.uri);
                setFormData((prevState) => {
                    if (!prevState) return null;
                    return {
                        ...prevState,
                        image: {
                            ...prevState.image,
                            url: prevState.image?.fileName || '', // Mantém a URL antiga por enquanto
                            height: result.height,
                            width: result.width,
                        }
                    };
                });
            }
        } catch (error) {
            console.error('Erro ao escolher a imagem:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
        }
    };

    // ✅ **LÓGICA DE SUBMISSÃO REATORADA**
    // Esta função agora controla todo o fluxo de salvar os dados.
    const onSubmit = async () => {
        if (!formData || !(await user())) {
            return Alert.alert('Erro', 'Dados do formulário ou usuário não encontrados.');
        }
        if (!formData.patNum && !formData.atmNum) {
            return Alert.alert('Erro', 'Preencha o número de patrimônio ou ATM.');
        }
        if (!formData.conservacao) {
            return Alert.alert('Erro', 'Selecione uma opção de conservação.');
        }
        // if (await checkExistingPat(formData.patNum, formData.atmNum) && mode === 'add') {
        //     return Alert.alert('Erro', 'Número de patrimônio ou ATM já existe.');
        // }

        let patFormat = formatPatNum(formData.patNum);

        if (patFormat == '' && formData.patNum != '') {
            return Alert.alert('Erro', 'O número de patrimônio inserido é inválido.');
        }

        let atmFormat = formatAtmNum(formData.atmNum);

        if (atmFormat == '' && formData.atmNum != '') {
            return Alert.alert('Erro', 'O número ATM inserido é inválido.');
        }

        setLoading(true);

        try {
            // Clona os dados atuais para evitar mutações diretas no estado.
            let dataToSave: Patrimonio = {
                ...formData,
                patNum: patFormat,
                atmNum: atmFormat,
                lastEditedBy: (await user())?.email || 'N/A',
                lastEditedAt: new Date().toLocaleDateString('pt-BR'),
            };

            if (imageCancel && image) {
                // Se estiver editando, apague a imagem antiga primeiro
                if (mode === 'edit' && formData.image?.fileName) {
                    await deleteImage(formData.image.fileName);
                }
                const newImageUrl = await uploadImage(image);
                if (newImageUrl != '' && newImageUrl) {
                    dataToSave.image.fileName = newImageUrl;
                } else {
                    throw new Error("Falha no upload da imagem.");
                }
            }

            let patrimonios = JSON.stringify(dataToSave)

            // Salva os dados no Firestore
            if (mode === "add") {
                const { error } = await supabase
                    .from('patrimonios')
                    .insert(dataToSave)

                if (error) console.error('Erro ao adicionar patrimônio:', error);
            } else if (mode === "edit" && docId) {
                await updateDoc(doc(db, "patrimonios", docId), { ...dataToSave });
            }

            if(true) Alert.alert('Sucesso', mode === "add" ? 'Patrimônio adicionado!' : 'Patrimônio atualizado!');
            router.back();

        } catch (error) {
            console.error('Erro ao salvar:', error);
            Alert.alert('Erro', 'Ocorreu um erro ao salvar o patrimônio.');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
                <ThemedText>Carregando...</ThemedText>
            </ThemedView>
        );
    }
    
    if (!formData) return null;

    if (scanBool) {
        return (
            <View style={styles.container}>
                <ThemedHeader title="Escanear Patrimônio" arrowBack={() => setScanBool(false)} />
                <CameraScreen
                    
                    onBarcodeScanned={({ data }) => {
                        setValue('Número de Patrimônio', data);
                        setFormData(prevState => prevState ? { ...prevState, patNum: data } : null);
                        setScanBool(false);
                    }}
                />
            </View>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ScrollableAreaView>
                <ThemedHeader title={title} arrowBack={() => {router.back()}}/>

                {!image ? (
                    <ThemedView style={{flexDirection: 'row'}}>
                        <ThemedButton style={styles.imageButton} onPress={() => handleSelectImage('Gallery')}>
                            <ThemedText style={styles.buttonText}>Escolher Imagem</ThemedText>
                        </ThemedButton>
                        <ThemedButton style={styles.imageButton} onPress={() => handleSelectImage('Camera')}>
                            <ThemedText style={styles.buttonText}>Tirar Foto</ThemedText>
                        </ThemedButton>
                    </ThemedView>
                ) : (
                    <ThemedView style={styles.imageContainer}>
                        <Image
                            source={{ uri: image }}
                            style={[styles.image, {
                                width: formData.image?.width || 200,
                                height: formData.image?.height || 200,
                            }]}
                        />
                        <ThemedButton style={styles.button} onPress={resetImage}>
                            <ThemedText style={styles.buttonText}>Remover Imagem</ThemedText>
                        </ThemedButton>
                    </ThemedView>
                )}
                
                <ThemedButton onPress={() => setScanBool(true)}>
                    <ThemedText style={styles.buttonText}>Escanear Código de Barras</ThemedText>
                </ThemedButton>

                <TextInputGroup inputs={inputs} control={control} errors={errors} />
                <CheckboxGroup selectedCheckbox={formData.conservacao} onCheckboxChange={handleCheckboxChange} />

                {mode === "edit" && (
                    <ThemedButton style={styles.deleteButton} onPress={deletePatrimonio}>
                        <ThemedText style={styles.buttonText}>Deletar</ThemedText>
                    </ThemedButton>
                )}

                <ThemedButton style={styles.button} onPress={handleSubmit(onSubmit)}>
                    <ThemedText style={styles.buttonText}>{finalButtonText}</ThemedText>
                </ThemedButton>

            </ScrollableAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
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
        borderRadius: 8,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        margin: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        margin: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dc3545' // Cor vermelha para indicar perigo
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});