import {
    View, Text, Image, TouchableOpacity, StyleSheet
} from "react-native";
import React from "react";
import ColorTheme from "../config/ColorTheme";
import { responsiveScreenFontSize } from "react-native-responsive-dimensions";

interface ListItemProps {
    name: string;
    symbol: string;
    currentPrice: number;
    priceChangePercentage7d: number;
    logoUrl: string;
    pipDecimalPlaces?: number;
    spread?: number;
    onPress: () => void;
}

const ListItem: React.FC<ListItemProps> = ({
    name,
    symbol,
    currentPrice,
    priceChangePercentage7d,
    logoUrl,
    pipDecimalPlaces = 5,
    spread = 1.2,
    onPress
}) => {
    const isPositive = priceChangePercentage7d > 0;
    const priceChangeColor = isPositive ? ColorTheme.trendingGreen : ColorTheme.trendingRed;
    const formattedPrice = currentPrice.toFixed(pipDecimalPlaces);

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={styles.container}
        >
            <View style={styles.leftContent}>
                <View style={styles.iconContainer}>
                    <Image
                        source={{ uri: logoUrl }}
                        style={styles.logo}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.name}>{symbol}</Text>
                    <Text style={styles.symbol}>{name.split(" (")[0]}</Text>
                </View>
            </View>
            <View style={styles.rightContent}>
                <Text style={styles.price}>{formattedPrice}</Text>
                <View style={styles.statsRow}>
                    <Text style={styles.spread}>Spread: {spread.toFixed(1)}p</Text>
                    <Text style={[styles.change, { color: priceChangeColor }]}>
                        {isPositive ? "+" : ""}{priceChangePercentage7d.toFixed(2)}%
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: ColorTheme.darkCard,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    leftContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#1A1A1A",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    logo: {
        width: 28,
        height: 28,
        resizeMode: "contain",
    },
    textContainer: {
        marginLeft: 12,
    },
    name: {
        color: ColorTheme.white,
        fontFamily: "Archivo-ExtraBold",
        fontSize: responsiveScreenFontSize(1.8),
    },
    symbol: {
        color: ColorTheme.grey,
        fontFamily: "Archivo-Regular",
        fontSize: responsiveScreenFontSize(1.3),
        marginTop: 2,
    },
    rightContent: {
        alignItems: "flex-end",
    },
    price: {
        color: ColorTheme.white,
        fontFamily: "Archivo-ExtraBold",
        fontSize: responsiveScreenFontSize(1.8),
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 3,
    },
    spread: {
        color: ColorTheme.grey,
        fontFamily: "Archivo-Regular",
        fontSize: responsiveScreenFontSize(1.2),
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    change: {
        fontFamily: "Archivo-Regular",
        fontSize: responsiveScreenFontSize(1.3),
    },
});

export default ListItem;
