import { View, type TextProps, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from './ThemedText';


export type ThemedHeaderProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  title?: string;
};

export function ThemedHeader({ 
  style, 
  lightColor, 
  darkColor, 
  title = "My Title", 
  ...otherProps 
}: ThemedHeaderProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={{ flexDirection: "row", alignItems: "center", padding: 50, backgroundColor }}>
      {/* Go Back Icon */}
      <TouchableOpacity onPress={() => router.back()} style={{ zIndex: 1 }}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>

      {/* Centered Text */}
      <View style={{ flex: 1, alignItems: "center", position: "absolute", left: 0, right: 0 }}>
        <ThemedText type='title' style={style} {...otherProps}>
          {title}
        </ThemedText>
      </View>
    </View>
  );
}
