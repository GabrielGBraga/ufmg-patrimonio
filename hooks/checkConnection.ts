import { supabase } from '@/utils/supabase'; // Importe onde você inicializou seu client

export const checkServerStatus = async () => {
    try {
        // Tenta buscar apenas a contagem de linhas de uma tabela que você sabe que existe.
        // 'head: true' significa: "Não me traga dados, só me diga se deu certo".
        // count: 'exact' é opcional, mas força o banco a responder algo.
        
        const { data, error } = await supabase
            .from('patrimonios') // Troque 'users' por qualquer tabela real do seu banco
            .select()

        if (error) {
            return false;
        }

        return true;
    } catch (err) {
        // Se o zrok estiver fora, o supabase client vai lançar um erro de rede
        // ou erro de parse JSON (se receber HTML de erro do zrok)
        console.log("Supabase offline:", err);
        return false;
    }
};