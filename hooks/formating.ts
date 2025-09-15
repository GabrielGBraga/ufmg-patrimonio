import { Alert } from 'react-native'; // Supondo que você esteja em um ambiente React Native


/**
 * Formata o número ATM no formato "XXX XXXXXX X".
 * Remove caracteres não alfanuméricos e insere espaços nos locais apropriados.
 * @param {string} atmNum - O número ATM a ser formatado.
 * @returns {string} O número ATM formatado.
 */
export const formatAtmNum = (atmNum: string): string => {
    // 1. atmLimpo se torna ''
    const atmLimpo = String(atmNum || '').replace(/[^a-zA-Z0-9]/g, '');

    
    if (atmLimpo.length != 10){
        return '';
    }
    
    // 3. resultado é inicializado como ''
    let resultado = atmLimpo.slice(0, 3);

    // 4. A condição (0 > 3) é falsa
    if (atmLimpo.length > 3) {
        resultado += ' ' + atmLimpo.slice(3, 9);
    }
    
    // 5. A condição (0 > 9) é falsa
    if (atmLimpo.length > 9) {
        resultado += ' ' + atmLimpo.slice(9, 10);
    }

    // 6. Retorna o valor de 'resultado', que ainda é ''
    return resultado;
}

/**
 * Formata o número de patrimônio no formato "XXXXXXXXX-X".
 * Se a string tiver menos de 10 caracteres numéricos, preenche com zeros à esquerda.
 * Remove caracteres não numéricos e limita a 10 dígitos.
 * @param {string} patNum - O número de patrimônio a ser formatado.
 * @returns {string} O número de patrimônio formatado ou uma string vazia se a entrada for inválida.
 */
export const formatPatNum = (patNum: string): string => {
    // 1. Garante que a entrada é uma string e remove tudo que não for dígito.
    const digitosApenas = String(patNum || '').replace(/[^0-9]/g, '');

    // Se não houver nenhum dígito, retorna uma string vazia.
    if (!digitosApenas && digitosApenas.length > 10) {
        return '';
    }
    
    // 2. Garante que a string tenha no máximo 10 caracteres, pegando os 10 primeiros.
    const digitosLimitados = digitosApenas.slice(0, 10);

    // 3. Preenche com zeros à esquerda até que a string tenha 10 caracteres de comprimento.
    // Ex: "123456789" vira "0123456789"
    const numeroPreenchido = digitosLimitados.padStart(10, '0');

    // 4. Divide a string nos locais corretos para a formatação.
    const parte1 = numeroPreenchido.substring(0, 9); // Pega os primeiros 9 caracteres
    const parte2 = numeroPreenchido.substring(9);   // Pega o 10º caractere

    // 5. Retorna a string formatada.
    return `${parte1}-${parte2}`;
}

/**
 * Verifica se a string de entrada deve ser formatada como atmNum ou patNum.
 * - Se a string contiver letras, tenta formatar como atmNum.
 * - Se contiver apenas números, tenta formatar como patNum.
 * @param {string} input - A string de entrada a ser verificada e formatada.
 * @returns {string} A string formatada ou uma string vazia se o formato não for reconhecido/válido.
 */
export const formatInputForSearch = (input: string): string => {
    // Remove qualquer caractere que não seja letra ou número para a verificação
    const cleanedInput = String(input || '').replace(/[^a-zA-Z0-9]/g, '');

    // Verifica se a string contém alguma letra
    const hasLetters = /[a-zA-Z]/.test(cleanedInput);
    
    let formattedResult = '';

    if (hasLetters) {
        // Se tem letras, trata como atmNum
        formattedResult = formatAtmNum(input);
    } else {
        // Se não tem letras, trata como patNum
        formattedResult = formatPatNum(input);
    }

    if (formattedResult === '') {
        Alert.alert("Erro de Formatação", "O número inserido não é um formato de ATM ou Patrimônio válido.");
    }
    
    return formattedResult;
};