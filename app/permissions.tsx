import { ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedHeader } from '@/components/ui/ThemedHeader';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { ThemedCheckbox } from '@/components/ui/ThemedCheckbox';
import { ThemedButton } from '@/components/ui/ThemedButton';

// Data structure for user permissions
interface UserPermission {
    user_id: string;
    name: string;
    email: string;
    is_editor: boolean;
}

export default function PermissionsScreen() {
    const { id, owner_id } = useLocalSearchParams();

    // Parse parameters to correct types
    const patId = Number(id);
    const ownId = String(owner_id);

    const [users, setUsers] = useState<UserPermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [edited, setEdited] = useState(false);
    const [saving, setSaving] = useState(false);

    /**
     * Fetches all profiles and merges them with existing permissions for the current asset.
     */
    const fetchAndMergeData = async () => {
        setLoading(true);
        try {
            // 1. Fetch available profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email');

            if (profilesError) throw profilesError;

            // 2. Fetch existing permissions for this asset
            const { data: permissions, error: permissionsError } = await supabase
                .from('permissoes')
                .select('user_id')
                .eq('patrimonio_id', patId);

            if (permissionsError) throw permissionsError;

            // 3. Create a Set of existing IDs for efficient lookup
            const existingEditorsIds = new Set(permissions?.map(p => p.user_id));

            // 4. Map profiles to permissions; mark as editor if ID exists in set
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
        setEdited(false); // Reset edit state on focus
    }, []));

    /**
     * Toggles the editor permission state for a user.
     */
    const handleToggleUser = (index: number, currentValue: boolean) => {
        const newUsersList = [...users];

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
            // Filter IDs of users with editor permission
            const selectedIds = users
                .filter(u => u.is_editor)
                .map(u => u.user_id);

            // Execute RPC to update permissions
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
        paddingBottom: 100, // Prevent content from being hidden behind bottom button
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
        backgroundColor: '#0a7ea4',
    },
    disabledButton: {
        opacity: 0.5,
    }
});