import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Controller } from 'react-hook-form';
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { SwitchTextInput, type SwitchTextInputProps } from "@/components/SwitchTextInput";

// Define o tipo das propriedades aceitas pelo componente TextInputGroup
type TextInputGroupProps ={
    inputs: Array<SwitchTextInputProps['input']>; // Use 'input' from SwitchTextInputProps
    control: any; // react-hook-form control
    errors: any; // react-hook-form errors
};

/**
 * Componente que renderiza um grupo de campos de entrada de texto (TextInput).
 * Suporta campos regulares e campos controlados por um switch.
 * @param {TextInputGroupProps} props - Propriedades do componente.
 */
export function TextInputGroup({ inputs, control, errors }: TextInputGroupProps) {
    return (
        <ThemedView style={styles.container}>
            {inputs.map((input, index) => (
                <ThemedView key={index} style={styles.inputWrapper}>
                    {/* Verifica se o campo tem um switch associado */}
                    {input.isSwitch ? (
                        <SwitchTextInput
                            input={input}
                        />
                    ) : (
                        // Renderiza um campo de texto regular (TextInput) dentro de um Controller
                        <Controller
                            control={control}
                            name={input.label} // Nome do campo no formulário
                            defaultValue={input.inputValue || ''} // Valor inicial do campo
                            rules={{
                                required: `${input.label} é obrigatório`, // Mensagem de erro personalizada
                            }}
                            render={({ field: { onChange, value } }) => (
                                <>
                                    <ThemedTextInput
                                        placeholder={input.placeholder} // Placeholder exibido no campo de texto
                                        value={value} // Valor atual do campo
                                        onChangeText={onChange} // Função chamada ao alterar o valor do texto
                                        style={styles.textInput} // Estilização do campo de texto
                                    />
                                    {/* Exibe mensagem de erro se o campo for inválido */}
                                    {errors[input.label] && (
                                        <Text style={styles.errorText}>
                                            {errors[input.label]?.message}
                                        </Text>
                                    )}
                                </>
                            )}
                        />
                    )}
                </ThemedView>
            ))}
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
    textInput: {
        height: 48, // Altura do campo de entrada
        borderWidth: 1, // Espessura da borda do campo de entrada
        borderRadius: 8, // Bordas arredondadas
        paddingHorizontal: 12, // Espaçamento interno horizontal
        marginTop: 8, // Espaçamento entre o rótulo e o campo de entrada
    },
    errorText: {
        color: 'red', // Cor do texto de erro
        fontSize: 12, // Tamanho da fonte do texto de erro
        marginTop: 4, // Espaçamento superior entre o campo e o texto de erro
    },
});
