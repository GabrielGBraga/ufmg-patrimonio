import { ActivityIndicator, Alert, Image, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
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

export default function ManagePatScreenContent() {

    const params = useLocalSearchParams();
    
    // LÓGICA IMPORTANTE: Se não vier mode, assume 'add' (caso da Aba). Se vier (caso do Modal), usa o que veio.
    const mode = (params.mode as string) || 'add'; 
    const docId = params.id as string || params.patrimonioId as string; // Aceita 'id' ou 'patrimonioId' para flexibilidade

    const title = mode === "edit" ? 'Editar Patrimônio' : "Adicionar Patrimônio";
    const headerIcon = mode === "edit" ? 'back' : 'settings';
    const headerFunc = mode === "edit" ? () => {router.back()} : () => router.push('/settings');

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

    // Reset do form se o usuário trocar de Aba para Modal e vice-versa sem desmontar
    useEffect(() => {
        if (mode === 'add') {
            setFormData(patrimonio);
            setImage(null);
            setLoading(false);
        }
    }, [mode]);

    useEffect(() => {
        if (formData?.atmNum != '') {
            setBoolAtm(true)
        }
    }, [formData?.atmNum])

    useEffect(() => {
        const getUrl = async () => {
            if (formData?.image.fileName) {
                const { data, error } = await supabase
                    .storage
                    .from('images')
                    .createSignedUrl(formData.image.fileName, 60)
                if (error) return console.error("Error fetching image URL: ", error);
                if (data?.signedUrl) {
                    setImage(data.signedUrl);
                } else {
                    console.log("No signed URL returned");
                }
            }
        };

        getUrl();
    }, [formData?.image.fileName]);

    useEffect(() => {
        if (mode === 'edit' && docId) {
            const fetchPatrimonioData = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('patrimonios')
                    .select()
                    .eq('id', docId)

                try {
                    if (data && data.length > 0) {
                        const patrimonioData = data[0] as Patrimonio;
                        setFormData(patrimonioData);
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

    const checkExistingPat = async (patNum: string, atmNum: string): Promise<string | null | false> => {
        if (!(await user())) return false;

        try {
            const { data, error } = await supabase
                .from('patrimonios')
                .select('patNum, atmNum')
                .or(`patNum.eq.${patNum},atmNum.eq.${atmNum}`);

            if (error) {
                console.error("Erro ao buscar patrimônios: ", error);
                return false;
            }

            if (!data || data.length === 0) {
                return null;
            }

            const patNumExists = data.some(item => item.patNum === patNum) && patNum !== '';
            const atmNumExists = data.some(item => item.atmNum === atmNum) && atmNum !== '';

            if (patNumExists && atmNumExists) {
                return "both";
            } else if (patNumExists) {
                return "patNum";
            } else if (atmNumExists) {
                return "atmNum";
            }
            return null;

        } catch (error) {
            console.error("Erro ao buscar patrimônios: ", error);
            return false;
        }
    }

    const inputs = formData ? [
        { label: 'Número de Patrimônio', placeholder: 'Digite o número de patrimônio', key: 'patNum' },
        { label: 'Número ATM', placeholder: 'Digite o número ATM', key: 'atmNum', isSwitch: true, switchKey: boolAtm },
        { label: 'Descrição', placeholder: 'Digite a descrição', key: 'descricao' },
        { label: 'Valor', placeholder: 'Digite o valor', key: 'valor' },
        { label: 'Responsável', placeholder: 'Digite o nome do responsável', key: 'responsavel' },
        { label: 'Sala', placeholder: 'Digite o numero da sala', key: 'sala' }
    ].map((config) => ({
        label: config.label,
        placeholder: config.placeholder,
        inputValue: formData[config.key as keyof Patrimonio] as string,
        onInputChange: (text: string) => setFormData(prevState => prevState ? { ...prevState, [config.key]: text } : null),
        isSwitch: config.isSwitch || false,
        switchValue: config.isSwitch ? boolAtm : false,
        onSwitchChange: config.isSwitch ? (value: boolean) => setBoolAtm(value) : () => { },
    })) : [];

    const deletePatrimonio = async () => {
        if (docId) {
            Alert.alert(
                "Confirmar Exclusão",
                "Você tem certeza que deseja deletar este patrimônio?",
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Deletar", style: "destructive",
                        onPress: async () => {
                            try {
                                setLoading(true);
                                if (formData?.image?.fileName) {
                                    await deleteImage(formData.image.fileName);
                                }
                                const response = await supabase
                                    .from('patrimonios')
                                    .delete()
                                    .eq('id', docId)

                                if (response.error) {
                                    throw response.error;
                                }
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
                            url: prevState.image?.fileName || '',
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
        if (!image) {
            return Alert.alert('Erro', 'Adicione uma imagem do patrimônio.');
        }

        let patFormat = formatPatNum(formData.patNum);

        if (patFormat == '' && formData.patNum != '') {
            return Alert.alert('Erro', 'O número de patrimônio inserido é inválido.');
        }

        let atmFormat = formatAtmNum(formData.atmNum);

        if (atmFormat == '' && formData.atmNum != '') {
            return Alert.alert('Erro', 'O número ATM inserido é inválido.');
        }

        if (mode === 'add') {
            const result = await checkExistingPat(patFormat, atmFormat);

            if (result === "both") {
                return Alert.alert("Esse patrimonio já foi cadastrado.");
            } else if (result === "patNum") {
                return Alert.alert("Esse número de patrimônio já foi cadastrado.");
            } else if (result === "atmNum") {
                return Alert.alert("Esse número ATM já foi cadastrado.");
            }
        }

        setLoading(true);

        try {
            let dataToSave: Patrimonio = {
                ...formData,
                patNum: patFormat,
                atmNum: atmFormat,
                lastEditedBy: (await user())?.email || 'N/A',
                lastEditedAt: new Date().toLocaleDateString('pt-BR'),
            };

            if (mode === 'edit' && formData.image?.fileName && imageCancel) {
                await deleteImage(formData.image.fileName);
            }
            if (mode === "add" || imageCancel) {
                const imageFileName = await uploadImage(image);
                if (imageFileName != '' && imageFileName) {
                    dataToSave.image.fileName = imageFileName;
                } else {
                    throw new Error("Falha no upload da imagem.");
                }
            }

            if (mode === "add") {
                const { error } = await supabase
                    .from('patrimonios')
                    .insert(dataToSave)

                if (error) console.error('Erro ao adicionar patrimônio:', error);
            } else if (mode === "edit" && docId) {
                const { error } = await supabase
                    .from('patrimonios')
                    .update(dataToSave)
                    .eq('id', docId);

                if (error) console.error('Erro ao atualizar patrimônio:', error);
            }

            Alert.alert('Sucesso', mode === "add" ? 'Patrimônio adicionado!' : 'Patrimônio atualizado!');
            
            // Aqui decidimos o que fazer ao finalizar
            if (router.canGoBack()) {
                router.back();
            } else {
               // Se estiver na tab e não der pra voltar, resetamos o form visualmente apenas (opcional)
                setFormData(patrimonio);
                setImage(null);
                setLoading(false);
            }

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
                <ThemedHeader title="Escanear Patrimônio" onPressIcon={() => setScanBool(false)} />
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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollableAreaView>
                    <ThemedHeader title={title} onPressIcon={headerFunc} variant={headerIcon}/>

                    {!image ? (
                        <ThemedView style={{ flexDirection: 'row' }}>
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
            </KeyboardAvoidingView>
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
        backgroundColor: '#dc3545'
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});