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
    inputs: Array<{
        label: string; // Rótulo exibido acima do input
        placeholder: string; // Texto exibido como placeholder no campo de texto
        inputValue: string; // Valor atual do campo de texto
        onInputChange: (text: string) => void; // Função chamada ao alterar o valor do texto
        isSwitch: boolean; // Indica se este campo possui um switch associado
        switchValue: boolean; // Estado atual do switch (ligado/desligado)
        onSwitchChange: (value: boolean) => void; // Função chamada ao alterar o estado do switch
        enabled?: boolean; // Indica se o campo de texto está habilitado ou desabilitado
    }>;
    control: any; // react-hook-form control
    errors: any; // react-hook-form errors
};

/**
 * Componente que renderiza um grupo de campos de entrada de texto (TextInput).
 * Suporta campos regulares e campos controlados por um switch.
 * @param {TextInputGroupProps} props - Propriedades do componente.
 */
export function TextInputGroup({ inputs, control, errors }: TextInputGroupProps) {
    // Dica: Use nomes mais descritivos para variáveis booleanas (ex: isPatNumFilled)
    const patNum = inputs[0].inputValue === patrimonio.patNum;
    const atmNum = inputs[1].inputValue === patrimonio.atmNum;

    return (
        <ThemedView style={styles.container}>
            {inputs.map((input, index) => {
                // Definindo o padrão true aqui
                const { enabled = true } = input;

                return (
                    <ThemedView key={index} style={styles.inputWrapper}>
                        {input.isSwitch && (
                            <ThemedView style={styles.switchWrapper}>
                                <ThemedSwitch
                                    value={input.switchValue}
                                    onValueChange={input.onSwitchChange}
                                />
                            </ThemedView>
                        )}
                        
                        {(input.switchValue || !input.isSwitch) && (
                            <Controller
                                control={control}
                                name={input.label}
                                defaultValue={input.inputValue || ''}
                                // Lógica de validação simplificada
                                rules={{
                                    required: {
                                        value: 
                                            (input.label === 'Número ATM' && !patNum) || 
                                            (input.label === 'Número de Patrimônio' && !atmNum) ||
                                            (input.label !== 'Número ATM' && input.label !== 'Número de Patrimônio'),
                                        message: `${input.label} é obrigatório`
                                    }
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <>
                                        <ThemedTextInput
                                            editable={enabled} // Aplicando o valor padrão
                                            placeholder={input.placeholder}
                                            value={value}
                                            onChangeText={(text) => {
                                                onChange(text);
                                                input.onInputChange?.(text);
                                            }}
                                            style={[
                                                styles.textInput, 
                                                !enabled && { opacity: 0.5 } // Feedback visual de desabilitado
                                            ]}
                                        />
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
        width: '100%', // Faz o contêiner ocupar 100% da largura disponível
        marginBottom: 16, // Espaçamento inferior entre os inputs no grupos
    },
    switchWrapper: {
        flex: 1,
        alignItems: 'center', // Centraliza verticalmente o switch e o rótulo
    },
    textInput: {
        height: 48, // Altura do campo de entrada
        borderColor: 'transparent', // Cor da borda do campo de entrada
        borderWidth: 1, // Espessura da borda do campo de entrada
        borderRadius:8, // Bordas arredondadas
        paddingHorizontal: 12, // Espaçamento interno horizontal
        marginTop: 8, // Espaçamento entre o rótulo e o campo de entrada
    },
    errorText: {
        color: 'red', // Cor do texto de erro
        fontSize: 12, // Tamanho da fonte do texto de erro
        marginTop: 4, // Espaçamento superior entre o campo e o texto de erro
    },
});
