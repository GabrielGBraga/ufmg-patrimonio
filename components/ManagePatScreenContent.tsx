
import { ActivityIndicator, Alert, Image, StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedButton } from "@/components/ui/ThemedButton";
import { ScrollableAreaView } from "@/components/layout/ScrollableAreaView";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { deleteImage, getImage, uploadImage } from "@/hooks/ImageHandler";
import { patrimonio, Patrimonio } from "@/constants/Patrimonio";
import { ThemedHeader } from '@/components/ui/ThemedHeader';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import CameraScreen from '@/components/ui/CameraScreen';
import { supabase } from '@/utils/supabase';
import { ThemedTextInput } from './ui/ThemedTextInput';
import { ThemedSwitch } from './ui/ThemedSwitch';

// Helper formatting functions moved from hooks/formating
const formatAtmNum = (atmNum: string): string => {
    const atmLimpo = String(atmNum || '').replace(/[^a-zA-Z0-9]/g, '');
    let resultado = atmLimpo.slice(0, 3);
    if (atmLimpo.length > 3) resultado += ' ' + atmLimpo.slice(3, 9);
    if (atmLimpo.length > 9) resultado += ' ' + atmLimpo.slice(9, 10);
    return resultado;
}

const formatPatNum = (patNum: string): string => {
    const digitosApenas = String(patNum || '').replace(/[^0-9]/g, '');
    if (!digitosApenas && digitosApenas.length > 10) return '';
    const digitosLimitados = digitosApenas.slice(0, 10);
    const numeroPreenchido = digitosLimitados.padStart(10, '0');
    const parte1 = numeroPreenchido.substring(0, 9);
    const parte2 = numeroPreenchido.substring(9);
    return `${parte1}-${parte2}`;
}

// Helper to ensure numeric strings for generic validation
const numericString = z.string().regex(/^\d+([.,]\d+)?$/, "Deve ser um número");

const schema = z.object({
    patNum: z.preprocess(
        (val) => formatPatNum(String(val || '')), // Preprocess using existing hook logic
        z.string().optional()
    ),
    atmNum: z.preprocess(
        (val) => formatAtmNum(String(val || '')), // Preprocess using existing hook logic
        z.string().optional()
    ),
    descricao: z.string().min(1, "Descrição é obrigatória"),
    sala: numericString.min(1, "Sala é obrigatória"), // Enforcing numeric string
    responsavel: z.string().email("Email inválido").min(1, "Responsável é obrigatório"),
    valor: numericString.min(1, "Valor é obrigatório"), // Enforcing numeric string
    conservacao: z.string().min(1, "Estado de conservação é obrigatório"),
}).superRefine((data, ctx) => {
    // 1. Check exclusivity/requirement
    const hasPat = !!data.patNum && data.patNum.length > 0;
    const hasAtm = !!data.atmNum && data.atmNum.length > 0;

    if (!hasPat && !hasAtm) {
        ctx.addIssue({
            code: "custom",
            message: "Preencha pelo menos o Número de Patrimônio ou ATM",
            path: ["patNum"],
        });
    }

    // 2. Validate Formats STRICTLY if present
    // patNum should be XXXXXXXXX-X (matches output of formatPatNum if valid)
    if (hasPat) {
        if (!/^\d{9}-\d$/.test(data.patNum || '')) {
            ctx.addIssue({
                code: "custom",
                message: "Patrimônio inválido (XXXXXXXXX-X)",
                path: ["patNum"],
            });
        }
    }

    // atmNum should be XXX XXXXXX X
    if (hasAtm) {
        if (!/^[A-Za-z0-9]{3} [A-Za-z0-9]{6} [A-Za-z0-9]{1}$/.test(data.atmNum || '')) {
            ctx.addIssue({
                code: "custom",
                message: "ATM inválido (XXX XXXXXX X)",
                path: ["atmNum"],
            });
        }
    }
});

type FormData = z.infer<typeof schema>;

export default function ManagePatScreenContent() {

    const params = useLocalSearchParams();
    const mode = (params.mode as string) || 'add';
    const docId = params.id as string;

    const title = mode === "edit" ? 'Editar Patrimônio' : "Adicionar Patrimônio";
    const headerIcon = mode === "edit" ? 'back' : 'settings';
    const headerFunc = mode === "edit" ? () => { router.back() } : () => router.push('/settings');
    const finalButtonText = mode === "edit" ? 'Atualizar' : "Adicionar";

    const user = async () => {
        return (await supabase.auth.getUser()).data.user;
    }

    const { control, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            patNum: '',
            atmNum: '',
            descricao: '',
            sala: '',
            responsavel: '',
            valor: '',
            conservacao: '',
        }
    });

    const [image, setImage] = useState<string | null>(null);
    const [imageHeight, setImageHeight] = useState(0);
    const [imageWidth, setImageWidth] = useState(0);
    const [imageFileName, setImageFileName] = useState<string | null>(null);

    const [loading, setLoading] = useState(mode === 'edit');
    const [imageCancel, setImageCancel] = useState(false);
    const [scanBool, setScanBool] = useState(false);
    const [boolAtm, setBoolAtm] = useState(false); // Controls visibility of ATM input

    // Controle de permissão visual
    const [isOwner, setIsOwner] = useState(true);

    const watchedConservacao = watch('conservacao');

    // Inicialização para Modo ADICIONAR
    useEffect(() => {
        if (mode === 'add') {
            const initAdd = async () => {
                const currentUser = await user();
                reset({
                    ...patrimonio,
                    responsavel: currentUser?.email || '',
                    conservacao: '',
                    patNum: '',
                    atmNum: '',
                    descricao: '',
                    sala: '',
                    valor: ''
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
                const { data, error } = await supabase
                    .from('patrimonios')
                    .select()
                    .eq('id', docId);

                if (error) {
                    Alert.alert("Erro", "Erro ao buscar patrimônio.");
                    console.error("Error fetching patrimonio: ", error);
                    router.back();
                    return;
                }

                try {
                    if (data && data.length > 0) {
                        const patrimonioData = data[0] as Patrimonio;
                        const currentUser = await user();

                        // 1. Verifica permissão
                        const isUserOwner = patrimonioData.owner_id === currentUser?.id;
                        setIsOwner(isUserOwner);

                        // 2. Busca o EMAIL baseado no UUID do owner_id
                        let emailDisplay = '';
                        if (patrimonioData.owner_id) {
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('email')
                                .eq('id', patrimonioData.owner_id)
                                .single();

                            if (profile) emailDisplay = profile.email || '';
                        }

                        // Preenche o form
                        reset({
                            patNum: patrimonioData.patNum,
                            atmNum: patrimonioData.atmNum,
                            descricao: patrimonioData.descricao,
                            sala: patrimonioData.sala,
                            valor: patrimonioData.valor,
                            responsavel: emailDisplay,
                            conservacao: patrimonioData.conservacao
                        });

                        // ATM Switch logic
                        if (patrimonioData.atmNum) {
                            setBoolAtm(true);
                        }

                        // Image handling
                        setImageFileName(patrimonioData.image?.fileName || null);
                        setImageHeight(patrimonioData.image?.height || 0);
                        setImageWidth(patrimonioData.image?.width || 0);

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


    const handleCheckboxChange = (value: string) => {
        const current = watchedConservacao;
        setValue('conservacao', value === current ? '' : value, { shouldValidate: true });
    };

    const resetImage = async () => {
        setImage(null);
        setImageCancel(true);
        setImageFileName(null);
    };

    const checkExistingPat = async (patNum: string, atmNum: string): Promise<string | null | false> => {
        if (!(await user())) return false;
        try {
            // Need to handle empty strings for query logic
            let query = `patNum.eq.${patNum}`;
            if (atmNum) {
                query += `,atmNum.eq.${atmNum}`;
            }

            // Using OR logic if both exist, but if atmNum is empty we shouldn't query it like that if we want strict check
            // The original logic was: .or(`patNum.eq.${patNum},atmNum.eq.${atmNum}`);
            // If atmNum is empty string in DB and we pass empty string, it might match all empty ones?
            // Actually original code checked: if (patNumExists && patNum !== '')

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

    const deletePatrimonio = async () => {
        if (docId) {
            Alert.alert("Confirmar Exclusão", "Deseja deletar?", [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Deletar", style: "destructive", onPress: async () => {
                        setLoading(true);
                        if (imageFileName) await deleteImage(imageFileName);
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
            setImageHeight(result.height);
            setImageWidth(result.width);
        }
    };

    const onSubmit = async (data: FormData) => {
        if (!(await user())) return Alert.alert('Erro', 'Usuário não autenticado.');
        if (!image) return Alert.alert('Erro', 'Adicione imagem.');

        let patFormat = data.patNum ? formatPatNum(data.patNum) : '';
        let atmFormat = data.atmNum ? formatAtmNum(data.atmNum) : '';

        // Se boolAtm for falso, garantimos que atmNum seja vazio
        if (!boolAtm) {
            atmFormat = '';
        }

        if (mode === 'add') {
            const result = await checkExistingPat(patFormat, atmFormat);
            if (result) return Alert.alert("Erro", "Patrimônio já cadastrado.");
        }

        setLoading(true);

        try {
            const currentUser = await user();

            // 1. RESOLVER O DONO (Email -> UUID)
            let finalOwnerId = mode === 'add' ? currentUser?.id : undefined;

            if (data.responsavel && isOwner) {
                const emailTrimmed = data.responsavel.trim();
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
                        Alert.alert("Aviso", "Email não encontrado. O responsável não foi alterado.");
                        if (mode === 'add') finalOwnerId = currentUser?.id;
                    }
                }
            }

            // 2. TRATAMENTO DE IMAGEM
            let finalImageFileName = imageFileName;

            // Se cancelou imagem antiga no edit
            if (mode === 'edit' && imageFileName && imageCancel) {
                // Assuming logic: if we have a new image or removed it, we delete old ref
                // Actually existing logic was: if cancel, delete.
                // But wait, if we select NEW image, we should upload it.
                // If we just removed, image is null -> blocked by check above.
                // So we definitely have an image uri.
                await deleteImage(imageFileName);
                finalImageFileName = null; // will be replaced
            }

            if (mode === "add" || imageCancel || !imageFileName) {
                // Upload new image
                const uploadName = await uploadImage(image);
                if (uploadName) finalImageFileName = uploadName;
                else throw new Error("Falha upload imagem");
            }

            // 3. DATA OBJECT
            const dataToSave: any = {
                patNum: patFormat,
                atmNum: atmFormat,
                descricao: data.descricao,
                valor: data.valor,
                sala: data.sala,
                conservacao: data.conservacao,
                image: {
                    fileName: finalImageFileName,
                    width: imageWidth,
                    height: imageHeight
                },
                lastEditedBy: currentUser?.email || 'N/A',
                lastEditedAt: new Date().toISOString(),
            };

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
                reset();
                setImage(null);
                // reset to default
            }

        } catch (error: any) {
            console.error(error);
            Alert.alert('Erro', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <ThemedView style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></ThemedView>;

    if (scanBool) {
        return (
            <View style={styles.container}>
                <ThemedHeader title="Escanear Patrimônio" onPressIcon={() => setScanBool(false)} variant='back' />
                <CameraScreen
                    onBarcodeScanned={({ data }) => {
                        setValue('patNum', data, { shouldValidate: true });
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

                    <ThemedView style={styles.formContainer}>
                        {/* patNum */}
                        <Controller
                            control={control}
                            name="patNum"
                            render={({ field: { onChange, value, onBlur: fieldOnBlur } }) => (
                                <View style={styles.inputWrapper}>
                                    <ThemedTextInput
                                        placeholder="Número de Patrimônio"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={() => {
                                            fieldOnBlur();
                                            if (value) {
                                                const formatted = formatPatNum(value);
                                                onChange(formatted);
                                            }
                                        }}
                                        style={styles.textInput}
                                    />
                                    <Text style={{ fontSize: 10, color: 'gray', marginLeft: 4 }}>Zeros à esquerda serão adicionados automaticamente.</Text>
                                    {errors.patNum && <Text style={styles.errorText}>{errors.patNum.message}</Text>}
                                </View>
                            )}
                        />

                        {/* atmNum with Switch */}
                        <View style={styles.inputWrapper}>
                            <View style={styles.switchContainer}>
                                <ThemedText>Possui número ATM?</ThemedText>
                                <ThemedSwitch
                                    value={boolAtm}
                                    onValueChange={(val) => {
                                        setBoolAtm(val);
                                        if (!val) setValue('atmNum', '');
                                    }}
                                />
                            </View>
                            {boolAtm && (
                                <Controller
                                    control={control}
                                    name="atmNum"
                                    render={({ field: { onChange, value, onBlur: fieldOnBlur } }) => (
                                        <>
                                            <ThemedTextInput
                                                placeholder="Número ATM"
                                                value={value}
                                                onChangeText={onChange}
                                                onBlur={() => {
                                                    fieldOnBlur();
                                                    if (value) {
                                                        const formatted = formatAtmNum(value);
                                                        onChange(formatted);
                                                    }
                                                }}
                                                style={styles.textInput}
                                            />
                                            {errors.atmNum && <Text style={styles.errorText}>{errors.atmNum.message}</Text>}
                                        </>
                                    )}
                                />
                            )}
                        </View>

                        {/* descricao */}
                        <Controller
                            control={control}
                            name="descricao"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <ThemedTextInput
                                        placeholder="Descrição"
                                        value={value}
                                        onChangeText={onChange}
                                        style={styles.textInput}
                                    />
                                    {errors.descricao && <Text style={styles.errorText}>{errors.descricao.message}</Text>}
                                </View>
                            )}
                        />

                        {/* valor and sala row */}
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {/* valor */}
                            <Controller
                                control={control}
                                name="valor"
                                render={({ field: { onChange, value } }) => (
                                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                                        <ThemedTextInput
                                            placeholder="Valor em R$"
                                            value={value}
                                            onChangeText={onChange}
                                            keyboardType='numeric'
                                            style={styles.textInput}
                                        />
                                        {errors.valor && <Text style={styles.errorText}>{errors.valor.message}</Text>}
                                    </View>
                                )}
                            />

                            {/* sala */}
                            <Controller
                                control={control}
                                name="sala"
                                render={({ field: { onChange, value } }) => (
                                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                                        <ThemedTextInput
                                            placeholder="Sala (número)"
                                            value={value}
                                            onChangeText={onChange}
                                            keyboardType='numeric'
                                            style={styles.textInput}
                                        />
                                        {errors.sala && <Text style={styles.errorText}>{errors.sala.message}</Text>}
                                    </View>
                                )}
                            />
                        </View>

                        {/* responsavel */}
                        <Controller
                            control={control}
                            name="responsavel"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputWrapper}>
                                    <ThemedTextInput
                                        placeholder="Responsável (Email)"
                                        value={value}
                                        onChangeText={onChange}
                                        editable={isOwner}
                                        keyboardType='email-address'
                                        style={[styles.textInput, !isOwner && { opacity: 0.5 }]}
                                    />
                                    {errors.responsavel && <Text style={styles.errorText}>{errors.responsavel.message}</Text>}
                                </View>
                            )}
                        />

                    </ThemedView>

                    <CheckboxGroup selectedCheckbox={watchedConservacao} onCheckboxChange={handleCheckboxChange} />
                    {errors.conservacao && <Text style={[styles.errorText, { marginLeft: 10 }]}>{errors.conservacao.message}</Text>}

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
    formContainer: { marginBottom: 20 },
    inputWrapper: { marginBottom: 16, width: '100%' },
    textInput: { height: 48, borderColor: 'transparent', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginTop: 8 },
    errorText: { color: 'red', fontSize: 12, marginTop: 4 },
    switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }
});