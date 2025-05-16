import React from 'react';
import { Switch, View, StyleSheet, Text } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ThemedSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    lightColor?: string;
    darkColor?: string;
}

export function ThemedSwitch({ lightColor, darkColor, value, onValueChange, ...otherProps }: ThemedSwitchProps) {
    const trackColor = useThemeColor(
        { light: lightColor, dark: darkColor }, // Track color for off state
        'trackColor'
    );
    const thumbColor = useThemeColor(
        { light: lightColor, dark: darkColor }, // Thumb color for on state
        'thumbColor'
    );

    return (
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ true: trackColor }}
            thumbColor={ value ? '#045ccc:' : thumbColor }
            style={styles.switch}
        />
    );
}

const styles = StyleSheet.create({
    switch: {
        marginHorizontal: 10,
    },
});
