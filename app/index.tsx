import { View, Text } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { splashStyles } from '../src/styles/SplashStyles';
import Logo from '../src/assets/SVGComponents/Logo';

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/market');
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={splashStyles.container}>
            <View style={[splashStyles.topBlock, splashStyles.flexEnd, splashStyles.bodyColor]}>
                <Text style={[splashStyles.faintedText, splashStyles.textStart]}>COIN</Text>
            </View>
            <View style={[splashStyles.centerBlock, splashStyles.flexCenter, splashStyles.bodyColor]}>
                <Logo />
                <Text style={[splashStyles.normalText, splashStyles.marginTopSmall]}>Coinflow</Text>
            </View>
            <View style={[splashStyles.bottomBlock, splashStyles.flexStart, splashStyles.bodyColor]}>
                <Text style={[splashStyles.faintedText, splashStyles.textStart]}>FLOW</Text>
            </View>
        </View>
    );
}
