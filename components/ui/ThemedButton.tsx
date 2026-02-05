import { Pressable, type PressableProps, StyleSheet, type ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

// Essas são as propriedades do objeto que podem ser editadas.
export type ThemedButtonProps = PressableProps & {
    lightColor?: string;
    darkColor?: string;
    textColor?: string;
    activeOpacity?: number;
};

export function ThemedButton({ style, lightColor, darkColor, textColor, activeOpacity = 0.7, ...otherProps }: ThemedButtonProps) {
    // Define a cor dependendo do tema do sistema
    // useThemeColor define a cor baseado no arquivo @/constants/Colors.ts
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'buttonBackground');

    return (
        <Pressable
            style={({ pressed }) => [
                { backgroundColor },
                styles.button,
                typeof style === 'function' ? style({ pressed }) : style,
                pressed && { opacity: activeOpacity }
            ]}
            {...otherProps}
        >
            {otherProps.children}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        marginHorizontal: 15,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
// O estilo do botão pode ser personalizado através do objeto styles
// e passado como propriedade 'style' ao componente ThemedButton.
// O componente ThemedButton pode ser usado em qualquer lugar do aplicativo
// onde um botão com tema é necessário, garantindo consistência visual.