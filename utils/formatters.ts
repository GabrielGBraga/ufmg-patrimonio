import { Alert } from "react-native";

/**
 * Formata número de ATM: 3 caracteres, espaço, 6 caracteres, espaço, 1 caractere.
 * Ex: AAA 123456 1
 */
export const formatAtmNum = (atmNum: string): string => {
  const atmLimpo = String(atmNum || '').replace(/[^a-zA-Z0-9]/g, '');
  let resultado = atmLimpo.slice(0, 3);
  if (atmLimpo.length > 3) resultado += ' ' + atmLimpo.slice(3, 9);
  if (atmLimpo.length > 9) resultado += ' ' + atmLimpo.slice(9, 10);
  return resultado;
}

/**
 * Formata número de Patrimônio: 10 dígitos, com hífen no último.
 * Ex: 000000000-0
 */
export const formatPatNum = (patNum: string): string => {
  const digitosApenas = String(patNum || '').replace(/[^0-9]/g, '');
  if (!digitosApenas) return '';
  const digitosLimitados = digitosApenas.slice(0, 10);
  const numeroPreenchido = digitosLimitados.padStart(10, '0');
  const parte1 = numeroPreenchido.substring(0, 9);
  const parte2 = numeroPreenchido.substring(9);
  return `${parte1}-${parte2}`;
}

/**
 * Formata o input para pesquisa baseado se contém letras (ATM) ou apenas números (Patrimônio).
 */
export const formatInputForSearch = (input: string): string => {
  const cleanedInput = String(input || '').replace(/[^a-zA-Z0-9]/g, '');
  const hasLetters = /[a-zA-Z]/.test(cleanedInput);
  let formattedResult = '';
  
  if (hasLetters) {
    formattedResult = formatAtmNum(input);
  } else {
    formattedResult = formatPatNum(input);
  }

  if (formattedResult === '' && cleanedInput !== '') {
    Alert.alert("Erro de Formatação", "O número inserido não é um formato de ATM ou Patrimônio válido.");
  }
  
  return formattedResult;
};
