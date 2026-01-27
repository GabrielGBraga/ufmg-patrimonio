import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, TextInputProps } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextInputProps<T = any> = TextInputProps & {
    lightColor?: string;
    darkColor?: string;
    iconName?: string;
    onIconPress?: () => void;

    // Props do Filtro
    filterData?: T[];
    filterValue?: string | null;
    filterLabelField?: keyof T;
    filterValueField?: keyof T;
    onFilterChange?: (item: T) => void;
    filterPlaceholder?: string;
    filterWidth?: number;
};

export const ThemedTextInput = React.forwardRef(function ThemedTextInput<T = any>(
    {
        style,
        lightColor,
        darkColor,
        iconName = 'none',
        onIconPress,

        filterData,
        filterValue,
        filterLabelField = 'label' as keyof T,
        filterValueField = 'value' as keyof T,
        onFilterChange,
        filterPlaceholder,
        filterWidth = 145,

        ...otherProps
    }: ThemedTextInputProps<T>,
    ref: React.Ref<any>
) {
    // Cores Principais
    const contentColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
    const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'inputBorder');
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'inputBackground');

    // Cor da "Caixinha" do Dropdown (Cinza suave adaptativo)
    const dropdownBackgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'dropdownBackground');

    const [isFocused, setIsFocused] = useState(false);

    const renderFilter = () => {
        if (!filterData) return null;

        return (
            <View style={[
                styles.filterWrapper,
                {
                    width: filterWidth,
                    backgroundColor: dropdownBackgroundColor, // Cor de fundo da caixinha
                }
            ]}>
                <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={{ color: contentColor, fontSize: 13, fontWeight: '500' }}
                    selectedTextStyle={{ color: contentColor, fontSize: 13, fontWeight: '500' }}
                    // Ícone menor para caber na caixinha
                    iconStyle={{ width: 18, height: 18, tintColor: contentColor }}
                    containerStyle={{
                        backgroundColor: backgroundColor, // Menu aberto continua com a cor do input
                        borderColor: borderColor,
                        borderRadius: 12,
                        margin: 4,
                    }}
                    itemTextStyle={{ color: contentColor, fontSize: 14 }}
                    activeColor={borderColor}

                    data={filterData}
                    labelField={filterLabelField as string}
                    valueField={filterValueField as string}
                    placeholder={filterPlaceholder || "Filtro"}
                    value={filterValue}
                    onChange={(item) => {
                        onFilterChange?.(item);
                    }}
                />
            </View>
        );
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: backgroundColor,
                    borderColor: isFocused ? borderColor : borderColor,
                    borderWidth: 1,
                },
                style
            ]}
        >
            {renderFilter()}

            <TextInput
                ref={ref}
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                placeholderTextColor={contentColor}
                textColor={contentColor}
                onFocus={(e) => {
                    setIsFocused(true);
                    otherProps.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    otherProps.onBlur?.(e);
                }}
                style={[
                    styles.input,
                    { backgroundColor: 'transparent' }
                ]}
                theme={{
                    colors: {
                        placeholder: contentColor,
                        text: contentColor,
                        primary: contentColor,
                        cursorColor: contentColor,
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
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 15,
        height: 58,
        overflow: 'hidden',
    },
    filterWrapper: {
        // Estilo da "Caixinha" interna
        flexDirection: 'row',
        alignItems: 'center',
        height: 38, // Altura menor que o input (58px) para parecer "flutuante"
        borderRadius: 10, // Arredondado próprio
        marginRight: 10, // Espaço entre caixinha e texto
        paddingRight: 4,
        paddingLeft: 8,
    },
    dropdown: {
        flex: 1,
        height: '100%',
    },
    input: {
        flex: 1,
        height: 58,
        fontSize: 16,
        paddingHorizontal: 5,
    },
});