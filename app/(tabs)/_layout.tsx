import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      {/* Optionally configure static options outside the route.*/}
      <Stack.Screen name="index" options={{}} />
      <Stack.Screen name="managePat" options={{}} />
      <Stack.Screen name="imageTesting" options={{}} />
      <Stack.Screen name="listing" options={{}} />
    </Stack>
  );
}
