import { View, type TextProps, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';

export type ThemedHeaderProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  title: string;
  arrowBack: () => void;
};

export function ThemedHeader({ 
  style, 
  lightColor, 
  darkColor, 
  arrowBack, 
  title = "My Title", 
  ...otherProps 
}: ThemedHeaderProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <View 
      style={{
        flexDirection: "row",
        alignItems: "center", // Centraliza verticalmente
        paddingHorizontal: 16, // padding proporcional
        paddingVertical: 12,
        backgroundColor
      }}
    >
      {/* Go Back Icon */}
      <TouchableOpacity onPress={arrowBack} style={{ marginRight: 12 }}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>

      <ThemedText
        type='title'
        style={[
          { flexShrink: 1, flexWrap: 'wrap', color: textColor },
          style
        ]}
        {...otherProps}
      >
        {title}
      </ThemedText>
    </View>
  );
}
