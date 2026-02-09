import { supabase } from '@/utils/supabase';


/**
 * Checks the connectivity status of the Supabase server.
 * 
 * This function attempts to make a lightweight query to the 'patrimonios' table.
 * It is used to verify if the client can successfully communicate with the database,
 * which is useful for handling offline states or server unavailability.
 * 
 * @returns {Promise<boolean>} Returns `true` if the connection is successful, `false` otherwise.
 */
export const checkServerStatus = async (): Promise<boolean> => {
    try {

        const { data, error } = await supabase
            .from('patrimonios')
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