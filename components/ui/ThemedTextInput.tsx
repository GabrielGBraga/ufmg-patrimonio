import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput, TextInputProps } from 'react-native-paper';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextInputProps = TextInputProps & {
    lightColor?: string;
    darkColor?: string;
    iconName?: string; // Nome do ícone a ser exibido (opcional)
    onIconPress?: () => void; // Ação ao clicar no ícone (opcional)
};

export function ThemedTextInput({
                                    style,
                                    lightColor,
                                    darkColor,
                                    iconName = 'none', // Ícone padrão é "nenhum"
                                    onIconPress,
                                    ...otherProps
                                }: ThemedTextInputProps) {
    const contentColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
    const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'inputBorder');
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'inputBackground');

    return (
        <TextInput
            mode="outlined"
            placeholderTextColor={contentColor}
            textColor={contentColor}
            style={[
                styles.input,
                style,
            ]}
            theme={{
                roundness: 15,
                colors: {
                    primary: borderColor, // Cor da borda em foco
                    background: backgroundColor, // Cor do fundo
                    placeholder: contentColor, // Cor do placeholder
                },
            }}
            right={
                iconName !== 'none' ? (
                    <TextInput.Icon
                        icon={iconName}
                        onPress={onIconPress}
                        color={contentColor}
                    />
                ) : null
            }
            {...otherProps}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        borderRadius: 18,
    },
});
