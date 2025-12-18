import React, { useState } from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

// Import the specific prop type from the library
import type { DropdownProps } from 'react-native-element-dropdown/lib/typescript/components/Dropdown/model';

// We use 'Partial' for standard props but enforce the critical ones manually
export type ThemedDropdownProps<T> = Partial<DropdownProps<T>> & {
    lightColor?: string;
    darkColor?: string;
    data: T[];
    labelField: keyof T;
    valueField: keyof T;
    onChange: (item: T) => void; // <--- This fixes the error by making it required
};

export function ThemedDropdown<T>({
    style,
    placeholderStyle,
    selectedTextStyle,
    inputSearchStyle,
    iconStyle,
    itemTextStyle,
    containerStyle,
    lightColor,
    darkColor,
    data,
    labelField,
    valueField,
    onChange, // Destructure onChange to ensure it's passed explicitly
    ...otherProps
}: ThemedDropdownProps<T>) {
    const [isFocus, setIsFocus] = useState(false);

    // Theme Colors
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'inputBackground');
    const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
    const placeholderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'secondaryText');
    const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'inputBorder');
    const activeColor = useThemeColor({ light: lightColor, dark: darkColor }, 'accent');
    
    const listBackgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'cardBackground');
    const listTextColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

    return (
        <Dropdown
        style={[
            styles.dropdown,
            { 
            backgroundColor, 
            borderColor: isFocus ? activeColor : borderColor 
            },
            style,
        ]}
        placeholderStyle={[
            styles.placeholderStyle, 
            { color: placeholderColor },
            placeholderStyle
        ]}
        selectedTextStyle={[
            styles.selectedTextStyle, 
            { color: textColor },
            selectedTextStyle
        ]}
        inputSearchStyle={[
            styles.inputSearchStyle, 
            { color: textColor, borderColor: borderColor },
            inputSearchStyle
        ]}
        iconStyle={[
            styles.iconStyle, 
            { tintColor: isFocus ? activeColor : placeholderColor },
            iconStyle
        ]}
        containerStyle={[
            styles.containerStyle,
            { backgroundColor: listBackgroundColor, borderColor: borderColor },
            containerStyle
        ]}
        itemTextStyle={[
            styles.itemTextStyle,
            { color: listTextColor },
            itemTextStyle
        ]}
        activeColor={useThemeColor({}, 'cardShadow')}
        data={data}
        labelField={labelField as string}
        valueField={valueField as string}
        onChange={onChange} // Pass the required prop directly
        placeholder={!isFocus ? 'Select item' : '...'}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        {...otherProps}
        />
    );
}

const styles = StyleSheet.create({
    dropdown: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 10,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
        borderRadius: 5,
    },
    containerStyle: {
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 5,
        borderWidth: 1,
    },
    itemTextStyle: {
        fontSize: 16,
    },
});