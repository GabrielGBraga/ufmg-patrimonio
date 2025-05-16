import Checkbox, { CheckboxProps } from "expo-checkbox"; // Correct import
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedCheckboxProps = CheckboxProps & {
    lightColor?: string;
    darkColor?: string;
};

export function ThemedCheckbox({
                                   lightColor,
                                   darkColor,
                                   style,
                                   ...otherProps
                               }: ThemedCheckboxProps) {
    const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'tint');

    return (
        <Checkbox
            color={borderColor}
            style={style}
            {...otherProps} />
    );
}
