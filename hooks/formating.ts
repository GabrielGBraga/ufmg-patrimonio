import { Alert } from 'react-native'; // Supondo que você esteja em um ambiente React Native


/**
 * Formata o número ATM no formato "XXX XXXXXX X".
 * Remove caracteres não alfanuméricos e insere espaços nos locais apropriados.
 * @param {string} atmNum - O número ATM a ser formatado.
 * @returns {string} O número ATM formatado.
 */
export const formatAtmNum = (atmNum: string) => {
    const atmLimpo = atmNum.replace(/[^a-zA-Z0-9]/g, '');

    const TAMANHO_MINIMO = 10;

    if (atmLimpo.length === TAMANHO_MINIMO) {
        Alert.alert("Erro", 'O número ATM deve ter 10 caracteres.');
        return;
    }

    const parte1 = atmLimpo.substring(0, 3);
    const parte2 = atmLimpo.substring(3, 9);
    const parte3 = atmLimpo.substring(9);

    return `${parte1} ${parte2} ${parte3}`;
}

/**
 * Formata o número de patrimônio no formato "XXXXXXXXX-X".
 * Remove caracteres não alfanuméricos e insere espaços nos locais apropriados.
 * @param {string} atmNum - O número ATM a ser formatado.
 * @returns {string} O número ATM formatado.
 */
export const formatPatNum = (patNum: string) => {
    const patLimpo = patNum.replace(/[^a-zA-Z0-9]/g, '');

    const TAMANHO_MINIMO = 10;

    if (patLimpo.length === TAMANHO_MINIMO) {
        Alert.alert("Erro", 'O número ATM deve ter 10 caracteres.');
        return;
    }

    const parte1 = patLimpo.substring(0, 8);
    const parte2 = patLimpo.substring(9);

    return `${parte1}-${parte2}`;
}