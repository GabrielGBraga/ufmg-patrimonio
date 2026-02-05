import { ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedHeader } from '@/components/ui/ThemedHeader';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { ThemedCheckbox } from '@/components/ui/ThemedCheckbox';
import { ThemedButton } from '@/components/ui/ThemedButton';

// Definindo a interface para tipagem correta
interface UserPermission {
    user_id: string;
    name: string;
    email: string;
    is_editor: boolean;
}

export default function PermissionsScreen() {
    const { id, owner_id } = useLocalSearchParams();

    // Convertendo para o tipo correto para garantir segurança no envio
    const patId = Number(id);
    const ownId = String(owner_id);

    const [users, setUsers] = useState<UserPermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [edited, setEdited] = useState(false);
    const [saving, setSaving] = useState(false);

    // Função que carrega e mescla os dados (A Lógica do "Merge")
    const fetchAndMergeData = async () => {
        setLoading(true);
        try {
            // 1. Buscamos TODOS os perfis disponíveis
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email');

            if (profilesError) throw profilesError;

            // 2. Buscamos AS PERMISSÕES JÁ EXISTENTES para este patrimônio
            const { data: permissions, error: permissionsError } = await supabase
                .from('permissoes') // Certifique-se que o nome da tabela está correto aqui
                .select('user_id')
                .eq('patrimonio_id', patId);

            if (permissionsError) throw permissionsError;

            // 3. Criamos um Set com os IDs que já possuem permissão
            // Usamos Set porque verificar "set.has(id)" é muito mais rápido que "array.includes(id)"
            const existingEditorsIds = new Set(permissions?.map(p => p.user_id));

            // 4. Cruzamos os dados: Se o ID do profile está no Set, is_editor vira true
            const mergedList = profiles?.map((profile: any) => ({
                user_id: profile.id,
                name: profile.full_name || 'Usuário sem nome',
                email: profile.email || '',
                is_editor: existingEditorsIds.has(profile.id)
            })) || [];

            setUsers(mergedList);

        } catch (error) {
            console.error('Erro ao carregar:', error);
            Alert.alert('Erro', 'Não foi possível carregar a lista de usuários.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        fetchAndMergeData();
        setEdited(false); // Reseta o estado de edição ao entrar na tela
    }, []));

    // Lógica correta para alterar estado no React (Imutabilidade)
    const handleToggleUser = (index: number, currentValue: boolean) => {
        const newUsersList = [...users]; // Cria cópia rasa do array

        // Atualiza o objeto específico recriando-o (spread operator)
        // Isso garante que o React perceba a mudança
        newUsersList[index] = {
            ...newUsersList[index],
            is_editor: !currentValue
        };

        setUsers(newUsersList);
        setEdited(true);
    };

    const savePermissions = async () => {
        setSaving(true);
        try {
            // Filtramos apenas os IDs dos usuários que estão marcados como TRUE
            const selectedIds = users
                .filter(u => u.is_editor)
                .map(u => u.user_id);

            // Chamamos a função RPC (Stored Procedure) do Banco
            const { error } = await supabase
                .rpc('manage_patrimony_permissions', {
                    p_patrimonio_id: patId,
                    p_owner_id: ownId,
                    p_selected_user_ids: selectedIds
                });

            if (error) throw error;

            Alert.alert('Sucesso', 'Permissões atualizadas!');
            setEdited(false);

            router.back();

            // Opcional: Recarregar os dados para garantir sincronia total
            // fetchAndMergeData(); 

        } catch (error) {
            console.error('Erro ao salvar:', error);
            Alert.alert('Erro', 'Falha ao atualizar permissões.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedHeader title="Permissões" onPressIcon={() => router.back()} variant='back' />

            {loading ? (
                <ThemedView style={styles.center}>
                    <ActivityIndicator size="large" color="#fff" />
                </ThemedView>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ThemedText style={styles.instructionText}>
                        Escolha quem terá permissão para editar esse patrimônio:
                    </ThemedText>

                    {users.map((user, index) => (
                        <ThemedButton
                            key={user.user_id}
                            style={styles.userItem}
                            activeOpacity={0.7}
                            onPress={() => handleToggleUser(index, user.is_editor)}
                        >
                            <ThemedCheckbox
                                value={user.is_editor}
                                onValueChange={() => handleToggleUser(index, user.is_editor)}
                                style={styles.checkbox}
                            />
                            <ThemedView style={styles.textContainer}>
                                <ThemedText type='defaultSemiBold'>{user.name}</ThemedText>
                                <ThemedText style={styles.emailText}>{user.email}</ThemedText>
                            </ThemedView>
                        </ThemedButton>
                    ))}
                </ScrollView>
            )}

            <ThemedButton
                style={[styles.button, (!edited || saving) && styles.disabledButton]}
                disabled={!edited || saving}
                onPress={savePermissions}
            >
                {saving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <ThemedText type='defaultSemiBold'>Salvar Alterações</ThemedText>
                )}
            </ThemedButton>

        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 100, // Espaço para o botão não cobrir o último item
    },
    instructionText: {
        margin: 15,
        marginBottom: 10,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 15,
        marginBottom: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    textContainer: {
        flex: 1,
        backgroundColor: 'transparent'
    },
    emailText: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 2
    },
    checkbox: {
        marginRight: 15,
    },
    button: {
        position: 'absolute',
        bottom: 20,
        left: 15,
        right: 15,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a7ea4', // Ajuste para a cor do seu tema
    },
    disabledButton: {
        opacity: 0.5,
    }
});