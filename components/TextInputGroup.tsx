import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Controller } from 'react-hook-form';
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { SwitchTextInput, type SwitchTextInputProps } from "@/components/SwitchTextInput";
import { ThemedSwitch } from './ui/ThemedSwitch';
import { patrimonio } from '@/constants/Patrimonio';

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
    const patNum = inputs[0].inputValue === patrimonio.patNum; // Verifica se o patNum está preenchido
    const atmNum = inputs[1].inputValue === patrimonio.atmNum; // Verifica se o atmNum está preenchido

    console.log(patNum, atmNum);

    return (
        <ThemedView style={styles.container}>
            {inputs.map((input, index) => (
                <ThemedView key={index} style={styles.inputWrapper}>
                    {input.isSwitch && (
                        <>
                            <ThemedView style={styles.switchWrapper}>
                                <ThemedSwitch
                                    value={input.switchValue} // Estado do switch (ligado/desligado)
                                    onValueChange={input.onSwitchChange} // Função para alternar o estado do switch
                                />
                            </ThemedView>
                        </>
                    )}

                    {(!input.isSwitch || input.switchValue) && (
                        <Controller
                            control={control}
                            name={input.label} // Nome do campo no formulário
                            defaultValue={input.inputValue || ''} // Valor inicial do campo
                            rules={{
                                required: input.label === 'Número ATM' && patNum
                                    ? 'Número ATM é obrigatório se o Número de Patrimônio não estiver preenchido'
                                    : input.label === 'Número ATM' && !patNum
                                    ? false
                                    : input.label === 'Número de Patrimônio' && atmNum
                                    ? 'Número de Patrimônio é obrigatório se o Número ATM não estiver preenchido'
                                    : input.label === 'Número de Patrimônio' && !atmNum
                                    ? false
                                    : `${input.label} é obrigatório`, // Outros campos são sempre obrigatórios
                            }}
                            render={({ field: { onChange, value } }) => {
                                const handleChange = (text: string) => {
                                    onChange(text); // Atualiza o estado do react-hook-form
                                    input.onInputChange?.(text); // Atualiza o estado do useState externo
                                };
                                return (
                                    <>
                                        <ThemedTextInput
                                            placeholder={input.placeholder} // Placeholder exibido no campo de texto
                                            value={value} // Valor atual do react-hook-form
                                            onChangeText={handleChange} // Sincroniza com RHF e useState
                                            style={styles.textInput} // Estilização do campo de texto
                                        />
                                        {/* Exibe mensagem de erro se o campo for inválido */}
                                        {errors[input.label] && (
                                            <Text style={styles.errorText}>
                                                {errors[input.label]?.message}
                                            </Text>
                                        )}
                                    </>
                                );
                            }}
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
        width: '100%', // Faz o contêiner ocupar 100% da largura disponível
        marginBottom: 16, // Espaçamento inferior entre os inputs no grupos
    },
    switchWrapper: {
        flex: 1,
        alignItems: 'center', // Centraliza verticalmente o switch e o rótulo
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
