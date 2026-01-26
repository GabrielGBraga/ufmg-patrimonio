import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export function useAccessControl() {
    // IDs específicos que posso editar (ex: [10, 15, 20])
    // Nota: number[] pois seu ID no banco é BigInt (numérico)
    const [permittedPatrimonioIds, setPermittedPatrimonioIds] = useState<
        number[]
    >([]);

    // IDs de Donos que me deram "Carta Branca" (ex: ['uuid-do-carlos', 'uuid-da-ana'])
    const [wildcardOwners, setWildcardOwners] = useState<string[]>([]);

    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchPermissions() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            if (isMounted) setLoading(false);
            return;
        }

        if (isMounted) setUserId(user.id);

        // Busca na tabela 'permissoes' tudo que foi dado para MIM (user_id = eu)
        const { data, error } = await supabase
            .from("permissoes")
            .select("patrimonio_id, owner_id")
            .eq("user_id", user.id);

        if (error) {
            console.error("Erro ao buscar permissões:", error);
        }

        if (data && isMounted) {
            // 1. Separa as permissões Específicas (onde patrimonio_id NÃO é nulo)
            const specificIds = data
            .filter((p) => p.patrimonio_id !== null)
            .map((p) => p.patrimonio_id);

            // 2. Separa as permissões Curinga (onde patrimonio_id É nulo)
            // Guardamos o ID do Dono que deu essa permissão geral
            const wildcards = data
            .filter((p) => p.patrimonio_id === null)
            .map((p) => p.owner_id);

            setPermittedPatrimonioIds(specificIds);
            setWildcardOwners(wildcards);
        }

        if (isMounted) setLoading(false);
        }

        fetchPermissions();

        return () => {
        isMounted = false;
        };
    }, []);

    /**
    * Função que será usada na UI para decidir se mostra o lápis
    * @param itemOwnerId - O ID do dono do patrimônio (vem do banco)
    * @param itemId - O ID do patrimônio (number/BigInt)
    */
    const canEdit = (itemOwnerId: string | null | undefined, itemId: number) => {
        // Se não tiver usuário logado, ninguém edita
        if (!userId) return false;

        // Regra 1: Sou o Dono? (A mais forte)
        // Se itemOwnerId for nulo (item legado), assumimos que ninguém edita por segurança, ou você pode liberar.
        if (itemOwnerId === userId) return true;

        // Se o item não tem dono definido, bloqueamos edição (exceto admins, se houvesse)
        if (!itemOwnerId) return false;

        // Regra 2: Tenho "Carta Branca" deste dono?
        if (wildcardOwners.includes(itemOwnerId)) return true;

        // Regra 3: Tenho permissão específica para este item?
        if (permittedPatrimonioIds.includes(itemId)) return true;

        // Se falhou em tudo, não pode editar
        return false;
    };

    return { canEdit, userId, loading };
}
