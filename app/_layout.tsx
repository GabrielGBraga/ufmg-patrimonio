import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { checkServerStatus } from '@/hooks/checkConnection';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { Alert } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * RootLayout Component
 * 
 * This component serves as the entry point for the application's layout structure.
 * It manages global configurations such as:
 * - Font loading (SpaceMono and FontAwesome).
 * - Splash screen visibility control.
 * - Initial server connection check to handle offline states.
 * - Session restoration: checks for existing authentication session on app launch.
 * - Authentication state monitoring via Supabase.
 * - Automatic navigation: routes authenticated users to tabs, unauthenticated to login.
 * 
 * If the server connection is unavailable at startup, it renders a fallback error screen.
 * Otherwise, it renders the main navigation stack.
 * 
 * @returns {JSX.Element | null} The rendered layout component or null while loading.
 */
export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [connection, setConnection] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [initialSession, setInitialSession] = useState<Session | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkServerStatus();
      setConnection(isConnected);
    };

    checkConnection();
  }, [])

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && !isCheckingSession) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isCheckingSession]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setInitialSession(session);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (!isCheckingSession && initialSession) {
      // Small delay to ensure router is fully mounted
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    }
  }, [isCheckingSession, initialSession]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/(tabs)');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!loaded || isCheckingSession) {
    return null;
  }

  if (connection) {
    return <RootLayoutNav />;
  } else {
    return (
      <ThemedView style={styles.safeView}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">Erro de conexão</ThemedText>
          <ThemedText style={{ textAlign: 'center', marginHorizontal: 20, marginTop: 10 }}>
            Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.
          </ThemedText>

          <ThemedButton
            style={styles.button}
            onPress={async () => {
              setLoading(true);
              const isConnected = await checkServerStatus();
              setConnection(isConnected);
              setLoading(false);
              if (!isConnected) {
                Alert.alert('Ainda sem conexão', 'Tente novamente mais tarde.');
              }
            }}
          >
            <ThemedText style={styles.text}>{loading ? 'Verificando...' : 'Tentar novamente'}</ThemedText>
          </ThemedButton>
        </ThemedView>
      </ThemedView>
    );
  }
}


/**
 * RootLayoutNav Component
 * 
 * This component handles the main navigation stack configuration for the application.
 * It uses a native stack navigator to manage screen transitions and hierarchy.
 * The theme is dynamically adjusted based on the user's system preference (Light/Dark mode).
 * 
 * Defined Routes:
 * - `index`: The initial login/welcome screen.
 * - `cadastro`: The user registration screen.
 * - `(tabs)`: The main application interface with tabbed navigation.
 * - `modalManagePat`: A modal screen for adding or editing assets.
 * - `permissions`: A modal screen for managing access permissions.
 * - `settings`: A modal screen for application settings and user profile.
 * 
 * @returns {JSX.Element} The configured Navigation Stack wrapped in a ThemeProvider.
 */
function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="cadastro" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen
          name="modalManagePat"
          options={{
            presentation: 'modal',
            headerShown: false
          }}
        />

        <Stack.Screen
          name="permissions"
          options={{
            presentation: 'modal',
            headerShown: false
          }}
        />

        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            headerShown: false
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeView: {
    flex: 1
  },
  keyboardAvoidingView: {
    flex: 1
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    width: '90%',
    marginVertical: 15,
    fontSize: 16,
  },
  button: {
    width: '90%',
    marginVertical: 15,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  text: {
    fontSize: 20,
    fontWeight: '800',
  },
});