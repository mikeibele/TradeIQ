import {
    View, Text, Image, TouchableOpacity, StyleSheet
} from "react-native";
import React from "react";
import { marketStyles } from "../styles/MarketStyles";
import ColorTheme from "../config/ColorTheme";
import { responsiveScreenFontSize, responsiveScreenHeight, responsiveScreenWidth } from "react-native-responsive-dimensions";

interface ListItemProps {
    name: string;
    symbol: string;
    currentPrice: number;
    priceChangePercentage7d: number;
    logoUrl: string;
    onPress: () => void;
}

const ListItem: React.FC<ListItemProps> = ({
    name,
    symbol,
    currentPrice,
    priceChangePercentage7d,
    logoUrl,
    onPress
}) => {
    const isPositive = priceChangePercentage7d > 0;
    const priceChangeColor = isPositive ? ColorTheme.trendingGreen : ColorTheme.trendingRed;

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
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.symbol}>{symbol.toUpperCase()}</Text>
                </View>
            </View>
            <View style={styles.rightContent}>
                <Text style={styles.price}>
                    ${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.change, { color: priceChangeColor }]}>
                    {isPositive ? "+" : ""}{priceChangePercentage7d.toFixed(2)}%
                </Text>
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
    },
    leftContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#1f1f1f",
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        width: 32,
        height: 32,
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
        fontSize: responsiveScreenFontSize(1.4),
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
    change: {
        fontFamily: "Archivo-Regular",
        fontSize: responsiveScreenFontSize(1.4),
        marginTop: 2,
    },
});

export default ListItem;
