import { ActivityIndicator, Alert, Image, StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedButton } from "@/components/ui/ThemedButton";
import { ScrollableAreaView } from "@/components/layout/ScrollableAreaView";
import { TextInputGroup } from "@/components/TextInputGroup";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { deleteImage, getImage, uploadImage } from "@/hooks/ImageHandler";
import { patrimonio, Patrimonio } from "@/constants/Patrimonio"; // Sua constante atualizada
import { ThemedHeader } from '@/components/ui/ThemedHeader';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import CameraScreen from '@/components/ui/CameraScreen';
import { formatAtmNum, formatPatNum } from '@/hooks/formating';
import { supabase } from '@/utils/supabase';

export default function ManagePatScreenContent() {

    const params = useLocalSearchParams();
    const mode = (params.mode as string) || 'add';
    const docId = params.id as string || params.patrimonioId as string;

    const title = mode === "edit" ? 'Editar Patrimônio' : "Adicionar Patrimônio";
    const headerIcon = mode === "edit" ? 'back' : 'settings';
    const headerFunc = mode === "edit" ? () => { router.back() } : () => router.push('/settings');
    const finalButtonText = mode === "edit" ? 'Atualizar' : "Adicionar";

    const user = async () => {
        return (await supabase.auth.getUser()).data.user;
    }

    // Estado do formulário seguindo estritamente o tipo Patrimonio
    const [formData, setFormData] = useState<Patrimonio | null>(mode === 'add' ? patrimonio : null);

    // Estado separado para o INPUT de Email (já que owner_id é UUID)
    const [ownerEmailInput, setOwnerEmailInput] = useState('');

    const [image, setImage] = useState<string | null>(null);
    const [boolAtm, setBoolAtm] = useState(false);
    const [loading, setLoading] = useState(mode === 'edit');
    const [imageCancel, setImageCancel] = useState(false);
    const [scanBool, setScanBool] = useState(false);

    // Controle de permissão visual
    const [isOwner, setIsOwner] = useState(true);

    const { control, handleSubmit, formState: { errors }, setValue } = useForm();

    // Inicialização para Modo ADICIONAR
    useEffect(() => {
        if (mode === 'add') {
            const initAdd = async () => {
                const currentUser = await user();
                // Define o email visual como o do usuário atual
                setOwnerEmailInput(currentUser?.email || '');

                // Define o ID técnico
                setFormData({
                    ...patrimonio,
                    owner_id: currentUser?.id || ''
                });

                setImage(null);
                setLoading(false);
                setIsOwner(true);
            };
            initAdd();
        }
    }, [mode]);

    // Inicialização para Modo EDITAR
    useEffect(() => {
        if (mode === 'edit' && docId) {
            const fetchPatrimonioData = async () => {
                setLoading(true);
                // Busca apenas os campos que existem na tabela
                const { data, error } = await supabase
                    .from('patrimonios')
                    .select() // Select simples traz as colunas reais
                    .eq('id', docId);

                try {
                    if (data && data.length > 0) {
                        const patrimonioData = data[0] as Patrimonio;
                        const currentUser = await user();

                        // 1. Verifica permissão
                        const isUserOwner = patrimonioData.owner_id === currentUser?.id;
                        setIsOwner(isUserOwner);

                        // 2. Busca o EMAIL baseado no UUID do owner_id para preencher o input visual
                        let emailDisplay = '';
                        if (patrimonioData.owner_id) {
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('email')
                                .eq('id', patrimonioData.owner_id)
                                .single();

                            if (profile) emailDisplay = profile.email || '';
                        }

                        setOwnerEmailInput(emailDisplay);
                        setFormData(patrimonioData);

                        if (patrimonioData.image?.fileName) {
                            const { data: imgData } = await supabase
                                .storage
                                .from('images')
                                .createSignedUrl(patrimonioData.image.fileName, 60);
                            if (imgData?.signedUrl) setImage(imgData.signedUrl);
                        }

                    } else {
                        Alert.alert("Erro", "Patrimônio não encontrado.");
                        router.back();
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchPatrimonioData();
        }
    }, [mode, docId]);

    // Lógica ATM Switch
    useEffect(() => {
        if (formData?.atmNum != '') {
            setBoolAtm(true)
        }
    }, [formData?.atmNum])

    const handleCheckboxChange = (value: string) => {
        setFormData((prevState) => prevState ? { ...prevState, conservacao: value === prevState.conservacao ? '' : value } : null);
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

            if (error || !data || data.length === 0) return null;
            const patNumExists = data.some(item => item.patNum === patNum) && patNum !== '';
            const atmNumExists = data.some(item => item.atmNum === atmNum) && atmNum !== '';
            if (patNumExists && atmNumExists) return "both";
            if (patNumExists) return "patNum";
            if (atmNumExists) return "atmNum";
            return null;
        } catch (error) {
            return false;
        }
    }

    // Configuração dos Inputs
    // Mapeamos os campos do Patrimonio, mas substituímos a lógica do owner_id pelo input de email
    const inputs = formData ? [
        { label: 'Número de Patrimônio', placeholder: 'Digite o número', key: 'patNum' },
        { label: 'Número ATM', placeholder: 'Digite o número ATM', key: 'atmNum', isSwitch: true, switchKey: boolAtm },
        { label: 'Descrição', placeholder: 'Descrição do item', key: 'descricao' },
        { label: 'Valor', placeholder: 'Valor em R$', key: 'valor' },
        { label: 'Sala', placeholder: 'Número da sala', key: 'sala' },
        // Campo Especial: Email do Responsável (Manipula estado separado)
        {
            label: 'Responsável (Email)',
            placeholder: 'email@ufmg.br',
            key: 'owner_email_visual', // Chave fictícia para o map
            customValue: ownerEmailInput, // Valor visual
            customOnChange: (text: string) => setOwnerEmailInput(text), // Setter visual
            enabled: isOwner,
            keyboardType: 'email-address'
        },
    ].map((config) => ({
        label: config.label,
        placeholder: config.placeholder,
        // Se for o campo especial, usa a lógica customizada, senão usa o formData padrão
        inputValue: config.key === 'owner_email_visual'
            ? config.customValue
            : formData[config.key as keyof Patrimonio] as string,
        onInputChange: config.key === 'owner_email_visual'
            ? config.customOnChange
            : (text: string) => setFormData(prevState => prevState ? { ...prevState, [config.key]: text } : null),
        isSwitch: config.isSwitch || false,
        switchValue: config.isSwitch ? boolAtm : false,
        onSwitchChange: config.isSwitch ? (value: boolean) => setBoolAtm(value) : () => { },
        editable: (config as any).editable !== undefined ? (config as any).editable : true,
        keyboardType: (config as any).keyboardType || 'default',
        enabled: config.enabled !== undefined ? config.enabled : true,
    })) : [];

    const deletePatrimonio = async () => {
        if (docId) {
            Alert.alert("Confirmar Exclusão", "Deseja deletar?", [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Deletar", style: "destructive", onPress: async () => {
                        setLoading(true);
                        if (formData?.image?.fileName) await deleteImage(formData.image.fileName);
                        await supabase.from('patrimonios').delete().eq('id', docId);
                        router.back();
                    }
                }
            ]);
        }
    };

    const handleSelectImage = async (type: 'Camera' | 'Gallery') => {
        const result = await getImage(type);
        if (result) {
            setImage(result.uri);
            setFormData(prev => prev ? {
                ...prev,
                image: { ...prev.image, fileName: prev.image?.fileName || '', height: result.height, width: result.width }
            } : null);
        }
    };

    const onSubmit = async () => {
        if (!formData || !(await user())) return Alert.alert('Erro', 'Dados inválidos.');
        if (!formData.patNum && !formData.atmNum) return Alert.alert('Erro', 'Preencha identificação.');
        if (!formData.conservacao) return Alert.alert('Erro', 'Selecione conservação.');
        if (!image) return Alert.alert('Erro', 'Adicione imagem.');

        let patFormat = formatPatNum(formData.patNum);
        let atmFormat = formatAtmNum(formData.atmNum);

        if (mode === 'add') {
            const result = await checkExistingPat(patFormat, atmFormat);
            if (result) return Alert.alert("Erro", "Patrimônio já cadastrado.");
        }

        setLoading(true);

        try {
            const currentUser = await user();

            // 1. RESOLVER O DONO (Email -> UUID)
            // Começamos com o dono atual (ou eu no add)
            let finalOwnerId = mode === 'add' ? currentUser?.id : undefined;

            if (ownerEmailInput && isOwner) {
                const emailTrimmed = ownerEmailInput.trim();
                // Só busca se mudou algo ou se é novo
                if (emailTrimmed !== currentUser?.email || mode === 'add') {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('email', emailTrimmed)
                        .maybeSingle();

                    if (profile) {
                        finalOwnerId = profile.id;
                    } else {
                        // Se não achou o email digitado, mantém o anterior (ou eu no add) e avisa
                        Alert.alert("Aviso", "Email não encontrado. O responsável não foi alterado.");
                        if (mode === 'add') finalOwnerId = currentUser?.id;
                        // No edit, se finalOwnerId for undefined, ele simplesmente não atualiza o campo
                    }
                }
            }

            // 2. TRATAMENTO DE IMAGEM
            let imageFileName = formData.image?.fileName;
            if (mode === 'edit' && formData.image?.fileName && imageCancel) {
                await deleteImage(formData.image.fileName);
            }
            if (mode === "add" || imageCancel) {
                const uploadName = await uploadImage(image);
                if (uploadName) imageFileName = uploadName;
                else throw new Error("Falha upload imagem");
            }

            // 3. CONSTRUÇÃO DO OBJETO FINAL (AQUI EVITAMOS O ERRO DE COLUNA INEXISTENTE)
            // Criamos um objeto limpo, campo a campo, compatível com o banco
            const dataToSave: any = {
                patNum: patFormat,
                atmNum: atmFormat,
                descricao: formData.descricao,
                valor: formData.valor,
                sala: formData.sala,
                conservacao: formData.conservacao,

                // Imagem (JSONB)
                image: {
                    fileName: imageFileName,
                    width: formData.image?.width || 0,
                    height: formData.image?.height || 0
                },

                // Auditoria
                lastEditedBy: currentUser?.email || 'N/A',
                lastEditedAt: new Date().toISOString(),
            };

            // Injeta owner_id apenas se tiver valor definido
            if (finalOwnerId) {
                dataToSave.owner_id = finalOwnerId;
            }

            // 4. ENVIO
            if (mode === "add") {
                const { error } = await supabase.from('patrimonios').insert(dataToSave);
                if (error) throw error;
            } else if (mode === "edit" && docId) {
                const { error } = await supabase.from('patrimonios').update(dataToSave).eq('id', docId);
                if (error) throw error;
            }

            Alert.alert('Sucesso', mode === "add" ? 'Adicionado!' : 'Atualizado!');
            if (router.canGoBack()) router.back();
            else {
                setFormData(patrimonio);
                setImage(null);
                setOwnerEmailInput(currentUser?.email || '');
            }

        } catch (error: any) {
            console.error(error);
            Alert.alert('Erro', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <ThemedView style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></ThemedView>;
    if (!formData) return null;

    if (scanBool) {
        return (
            <View style={styles.container}>
                <ThemedHeader title="Escanear Patrimônio" onPressIcon={() => setScanBool(false)} variant='back' />
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
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollableAreaView>
                    <ThemedHeader title={title} onPressIcon={headerFunc} variant={headerIcon} />

                    {!image ? (
                        <ThemedView style={{ flexDirection: 'row' }}>
                            <ThemedButton style={styles.imageButton} onPress={() => handleSelectImage('Gallery')}><ThemedText>Galeria</ThemedText></ThemedButton>
                            {(Platform.OS === 'ios' || Platform.OS === 'android') && (
                                <ThemedButton style={styles.imageButton} onPress={() => handleSelectImage('Camera')}><ThemedText>Câmera</ThemedText></ThemedButton>
                            )}
                        </ThemedView>
                    ) : (
                        <ThemedView style={styles.imageContainer}>
                            <Image source={{ uri: image }} style={[styles.image, { width: 200, height: 200 }]} />
                            <ThemedButton style={styles.button} onPress={resetImage}><ThemedText>Remover</ThemedText></ThemedButton>
                        </ThemedView>
                    )}

                    <ThemedButton onPress={() => setScanBool(true)}><ThemedText>Escanear Código</ThemedText></ThemedButton>

                    <TextInputGroup inputs={inputs as any} control={control} errors={errors} />
                    <CheckboxGroup selectedCheckbox={formData.conservacao} onCheckboxChange={handleCheckboxChange} />

                    {mode === "edit" && (
                        <ThemedButton style={styles.deleteButton} onPress={deletePatrimonio}><ThemedText>Deletar</ThemedText></ThemedButton>
                    )}

                    <ThemedButton style={styles.button} onPress={handleSubmit(onSubmit)}><ThemedText>{finalButtonText}</ThemedText></ThemedButton>
                </ScrollableAreaView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 5 },
    imageButton: { padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 5, marginBottom: 15, marginHorizontal: 10, flex: 1 },
    imageContainer: { alignItems: 'center', marginVertical: 10 },
    image: { margin: 10, borderRadius: 8 },
    button: { paddingVertical: 14, paddingHorizontal: 24, margin: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    deleteButton: { paddingVertical: 14, paddingHorizontal: 24, margin: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc3545' },
});