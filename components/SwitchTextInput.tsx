import { StyleSheet } from 'react-native';
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedSwitch } from "@/components/ui/ThemedSwitch";
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";

// Define o tipo das propriedades aceitas pelo componente
export type SwitchTextInputProps = {
    input: {
        label: string; // Rótulo exibido acima do input
        placeholder: string; // Texto exibido como placeholder no campo de texto
        inputValue: string; // Valor atual do campo de texto
        onInputChange: (text: string) => void; // Função chamada ao alterar o valor do texto
        isSwitch: boolean; // Indica se este campo possui um switch associado
        switchValue: boolean; // Estado atual do switch (ligado/desligado)
        onSwitchChange: (value: boolean) => void; // Função chamada ao alterar o estado do switch
    };
};

/**
 * Componente que combina um switch com um campo de texto opcional.
 * O campo de texto só é exibido se o switch estiver ativado.
 * @param {SwitchTextInputProps} input - Objeto contendo as configurações para o campo e o switch.
 */
export function SwitchTextInput({ input }: SwitchTextInputProps) {
    return (
        <ThemedView style={styles.inputWrapper}>
            {/* Rótulo do input */}
            <ThemedText style={styles.label}>{input.label}</ThemedText>

            {/* Componente de switch */}
            <ThemedSwitch
                value={input.switchValue} // Estado do switch (ligado/desligado)
                onValueChange={input.onSwitchChange} // Função para alternar o estado do switch
            />

            {/* Componente de entrada de texto (renderizado condicionalmente) */}
            {input.switchValue && (
                <ThemedTextInput
                    placeholder={input.placeholder} // Placeholder exibido no campo de texto
                    value={input.inputValue} // Valor atual do campo
                    onChangeText={input.onInputChange} // Função chamada ao alterar o valor do texto
                    style={styles.textInput} // Estilização do campo de texto
                />
            )}
        </ThemedView>
    );
}

// Estilos utilizados no componente
const styles = StyleSheet.create({
    container: {
        marginBottom: 5, // Espaçamento inferior para o contêiner principal
    },
    inputWrapper: {
        alignItems: 'center', // Alinha o conteúdo ao centro horizontalmente
        width: '100%', // Faz o contêiner ocupar 100% da largura disponível
    },
    label: {
        fontSize: 16, // Tamanho da fonte do rótulo
        marginBottom: 8, // Espaçamento inferior entre o rótulo e os outros elementos
        fontWeight: '600', // Peso da fonte (semi-negrito)
    },
    textInput: {
        height: 48, // Altura do campo de texto
        borderWidth: 1, // Espessura da borda
        borderRadius: 8, // Borda arredondada
        paddingHorizontal: 12, // Espaçamento interno horizontal
        width: '100%', // Faz o campo de texto ocupar toda a largura disponível do contêiner
    },
});
