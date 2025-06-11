import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { SwitchTextInput, type SwitchTextInputProps } from "@/components/SwitchTextInput"; // Importa o componente SwitchTextInput

// Define o tipo das propriedades aceitas pelo componente TextInputGroup
type TextInputGroupProps = {
    inputs: Array<SwitchTextInputProps['input']>; // Use 'input' from SwitchTextInputProps
};

/**
 * Componente que renderiza um grupo de campos de entrada de texto (TextInput).
 * Suporta campos regulares e campos controlados por um switch.
 * @param {TextInputGroupProps} props - Propriedades do componente.
 */
export function TextInputGroup({ inputs }: TextInputGroupProps) {
    return (
        <ThemedView style={styles.container}>
            {inputs.map((input, index) => {
                return (
                    <ThemedView key={index} style={styles.inputWrapper}>
                        {/* Verifica se o campo tem um switch associado */}
                        {input.isSwitch ? (
                            <SwitchTextInput
                                input={input}
                            />
                        ) : (
                            // Renderiza um campo de texto regular (TextInput)
                            <ThemedTextInput
                                placeholder={input.placeholder} // Placeholder exibido no campo de texto
                                value={input.inputValue} // Valor atual do campo
                                onChangeText={input.onInputChange} // Função chamada ao alterar o valor do texto
                                style={styles.textInput} // Estilização do campo de texto
                            />
                        )}
                    </ThemedView>
                );
            })}
        </ThemedView>
    );
}

// Estilos utilizados pelo componente
const styles = StyleSheet.create({
    container: {
        marginBottom: 20, // Espaçamento inferior entre o grupo de inputs e o próximo elemento
    },
    inputWrapper: {
        marginBottom: 16, // Espaçamento inferior entre os inputs no grupo
    },
    label: {
        fontSize: 16, // Tamanho da fonte do rótulo
        marginBottom: 8, // Espaçamento entre o rótulo e o campo de entrada
        fontWeight: '600', // Fonte semi-negrito para o rótulo
    },
    textInput: {
        height: 48, // Altura do campo de entrada
        borderWidth: 1, // Espessura da borda do campo de entrada
        borderRadius: 8, // Bordas arredondadas
        paddingHorizontal: 12, // Espaçamento interno horizontal
        marginTop: 8, // Espaçamento entre o rótulo e o campo de entrada
    },
});
