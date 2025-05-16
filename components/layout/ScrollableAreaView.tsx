import { ViewProps, ScrollView, ScrollViewProps, SafeAreaView, StyleSheet } from 'react-native';

export type ScrollableAreaViewProps = ViewProps & ScrollViewProps;

export function ScrollableAreaView({ style, contentContainerStyle, ...otherProps }: ScrollableAreaViewProps) {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={contentContainerStyle}
        {...otherProps}
      />
    </SafeAreaView>
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
