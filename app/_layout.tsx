import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        "Archivo-Regular": require("../assets/fonts/Archivo-Regular.ttf"),
        "Archivo-ExtraBold": require("../assets/fonts/Archivo-ExtraBold.ttf"),
        "FREEFATFONT-Regular": require("../assets/fonts/FREEFATFONT-Regular.otf"),
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="market" />
                    <Stack.Screen name="details" />
                    <Stack.Screen name="deposit" options={{ presentation: 'modal' }} />
                </Stack>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    );
}
