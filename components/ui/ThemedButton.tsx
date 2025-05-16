import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

// Essas são as propriedades do objeto que podem ser editadas.
export type ThemedViewTouchableOpacity = TouchableOpacityProps & {
    lightColor?: string;
    darkColor?: string;
    textColor?: string;
};

export function ThemedButton({ style, lightColor, darkColor, textColor, ...otherProps }: ThemedViewTouchableOpacity) {
    // Define a cor dependendo do tema do sistema
    // useThemeColor define a cor baseado no arquivo @/constants/Colors.ts
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'buttonBackground');
    const color = useThemeColor({ light: textColor, dark: textColor }, 'buttonText');

    return (
        <TouchableOpacity style={[{ backgroundColor }, style]} {...otherProps}>
        </TouchableOpacity>
    );
}
