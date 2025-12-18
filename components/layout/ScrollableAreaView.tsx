import { ViewProps, ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { ThemedView } from '../ui/ThemedView';

export type ScrollableAreaViewProps = ViewProps & ScrollViewProps;

export function ScrollableAreaView({ style, contentContainerStyle, ...otherProps }: ScrollableAreaViewProps) {
  return (
    <ThemedView style={[styles.safeArea, style]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={contentContainerStyle}
        {...otherProps}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
