import { View, type TextProps, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';

export type ThemedHeaderProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  title: string;
  onPressIcon: () => void;
  variant?: 'back' | 'settings'; // Nova prop para escolher o ícone
};

export function ThemedHeader({ 
  style, 
  lightColor, 
  darkColor, 
  onPressIcon, 
  title = "My Title", 
  variant = 'settings', // Valor padrão é 'back' se você não passar nada
  ...otherProps 
}: ThemedHeaderProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const textColor = useThemeColor({}, 'text');

  // Decide qual ícone mostrar baseado na prop 'variant'
  const iconName = variant === 'settings' ? 'settings-outline' : 'arrow-back';

  return (
    <View 
      style={{
        flexDirection: "row",
        alignItems: "center", 
        justifyContent: "center", // Centraliza o título
        paddingVertical: 12,
        backgroundColor,
        position: 'relative',
        minHeight: 48 
      }}
    >
      {/* Botão Esquerdo (Absoluto) */}
      <TouchableOpacity 
        onPress={onPressIcon} 
        style={{ 
          position: 'absolute', 
          left: 35, 
          zIndex: 1, 
          padding: 4,
        }}
      >
        <Ionicons name={iconName} size={30} color={textColor} />
      </TouchableOpacity>

      {/* Título Centralizado */}
      <ThemedText
        type='title'
        style={[
          { 
            textAlign: 'center', 
            color: textColor,
            paddingHorizontal: 48 
          },
          style
        ]}
        {...otherProps}
      >
        {title}
      </ThemedText>
    </View>
  );
}