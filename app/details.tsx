import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import ColorTheme from "../src/config/ColorTheme";
import ChartComponent from "../src/components/ChartComponent";

export default function DetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const {
        id,
        name,
        symbol,
        current_price,
        image,
        price_change_percentage_24h,
        sparkline
    } = params;

    const parsedSparkline = sparkline ? JSON.parse(sparkline as string) : [];
    const isPositive = parseFloat(price_change_percentage_24h as string) > 0;

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={["#2D1B4D", "black"]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
            />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerNav}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <SymbolView name="chevron.left" size={24} tintColor="white" />
                        </TouchableOpacity>
                    </View>
                    <ChartComponent
                        currentPrice={parseFloat(current_price as string)}
                        logoUrl={image as string}
                        name={name as string}
                        symbol={symbol as string}
                        priceChangePercentage7d={0} // Not used in design but required by props
                        sparkLine={parsedSparkline}
                        high_24h={0}
                        low_24h={0}
                        price_change_24h={0}
                        price_change_percentage_24h={parseFloat(price_change_percentage_24h as string)}
                    />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    headerNav: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        zIndex: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    scrollContent: {
        flexGrow: 1,
    },
});
