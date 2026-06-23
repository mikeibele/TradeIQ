import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import React from "react";
import ColorTheme from "../config/ColorTheme";
import { responsiveScreenFontSize, responsiveScreenHeight, responsiveScreenWidth } from "react-native-responsive-dimensions";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Line, Circle } from "react-native-svg";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";

interface SparklinePoint {
    x: number;
    y: number;
}

interface ChartComponentProps {
    currentPrice: number;
    logoUrl: string;
    name: string;
    symbol: string;
    priceChangePercentage7d: number;
    sparkLine: any[];
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
}

const { width } = Dimensions.get("window");

const ChartComponent: React.FC<ChartComponentProps> = ({
    currentPrice,
    logoUrl,
    name,
    symbol,
    priceChangePercentage7d,
    sparkLine,
    high_24h,
    low_24h,
    price_change_24h,
    price_change_percentage_24h,
}) => {
    const isPositive = price_change_percentage_24h > 0;
    const changeColor = isPositive ? ColorTheme.trendingGreen : ColorTheme.trendingRed;

    // Chart logic
    const chartHeight = 220;
    const chartWidth = width - 40;

    let pathData = "";
    let lastPoint = { x: 0, y: 0 };

    if (sparkLine && sparkLine.length > 1) {
        const prices: number[] = sparkLine.map(p => typeof p === 'object' ? p.y : p).filter(p => !isNaN(p));

        if (prices.length > 1) {
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const range = max - min || 1;

            const points = prices.map((val, i) => {
                const x = (i / (prices.length - 1)) * chartWidth;
                const y = chartHeight - ((val - min) / range) * chartHeight;
                if (i === prices.length - 1) lastPoint = { x, y };
                return `${x},${y}`;
            });

            pathData = `M ${points.join(" L ")}`;
        }
    }

    return (
        <View style={styles.container}>
            {/* Background Gradient at top */}
            <LinearGradient
                colors={["#2D1B4D", "transparent"]}
                style={styles.topGradient}
            />

            {/* Top Info Section */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Image source={{ uri: logoUrl }} style={styles.logo} />
                </View>
                <Text style={styles.title}>{symbol.toUpperCase()} ({name})</Text>

                <View style={styles.priceContainer}>
                    <Text style={styles.priceMainText}>
                        {currentPrice.toLocaleString("en-US", { minimumFractionDigits: 5 })} {symbol.toUpperCase()}
                    </Text>
                    <View style={[styles.changeBadge, { backgroundColor: isPositive ? "#14532d" : "#450a0a" }]}>
                        <SymbolView
                            name={isPositive ? "arrow.up" : "arrow.down"}
                            size={10}
                            tintColor={changeColor}
                        />
                        <Text style={[styles.changeText, { color: changeColor }]}>
                            {isPositive ? "" : "- "}{Math.abs(price_change_percentage_24h).toFixed(2)}%
                        </Text>
                    </View>
                </View>
            </View>

            {/* Chart Section */}
            <View style={styles.chartWrapper}>
                <Svg height={chartHeight} width={chartWidth}>
                    {/* Grid Lines */}
                    {[0.2, 0.4, 0.6, 0.8].map((percent, idx) => (
                        <Line
                            key={idx}
                            x1="0"
                            y1={chartHeight * percent}
                            x2={chartWidth}
                            y2={chartHeight * percent}
                            stroke="#1A1A1A"
                            strokeWidth="1"
                            strokeDasharray="5, 5"
                        />
                    ))}

                    {/* Golden Path */}
                    <Path
                        d={pathData}
                        fill="none"
                        stroke={ColorTheme.chartGold}
                        strokeWidth="3"
                    />

                    {/* Endpoint dot with glow */}
                    {lastPoint.x !== 0 && (
                        <>
                            <Circle
                                cx={lastPoint.x}
                                cy={lastPoint.y}
                                r="6"
                                fill={ColorTheme.chartGold}
                            />
                            <Circle
                                cx={lastPoint.x}
                                cy={lastPoint.y}
                                r="12"
                                fill={ColorTheme.chartGold}
                                opacity={0.3}
                            />
                        </>
                    )}
                </Svg>
            </View>

            {/* Time Interval Selectors */}
            <View style={styles.timeIntervals}>
                {["1H", "1D", "1W", "1M", "1Y"].map((interval) => (
                    <TouchableOpacity
                        key={interval}
                        style={[
                            styles.intervalBtn,
                            interval === "1D" && styles.activeIntervalBtn
                        ]}
                    >
                        <Text style={[
                            styles.intervalText,
                            interval === "1D" && styles.activeIntervalText
                        ]}>
                            {interval}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Balance and Value Section */}
            <View style={styles.balanceInfo}>
                <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Balance</Text>
                    <View style={styles.infoValueRow}>
                        <Image source={{ uri: logoUrl }} style={styles.infoIcon} />
                        <Text style={styles.infoValue}>{currentPrice.toLocaleString("en-US", { minimumFractionDigits: 5 })}</Text>
                    </View>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Value</Text>
                    <View style={styles.infoValueRow}>
                        <View style={styles.dollarIconWrapper}>
                            <Text style={styles.dollarIcon}>$</Text>
                        </View>
                        <Text style={styles.infoValue}>$37.42</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.walletNote}>
                In Your Wallet <Text style={{ color: 'white', fontWeight: 'bold' }}>You</Text>
            </Text>

            {/* Actions Section */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.swapBtn}>
                    <Text style={styles.actionBtnText}>Swap</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendBtn}>
                    <Text style={styles.actionBtnText}>Send {symbol.toUpperCase()}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
        paddingHorizontal: 20,
    },
    topGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: responsiveScreenHeight(40),
    },
    header: {
        marginTop: 20,
        alignItems: "flex-start",
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#1A1A1A",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#333",
    },
    logo: {
        width: 35,
        height: 35,
        resizeMode: "contain",
    },
    title: {
        color: "white",
        fontSize: 24,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
        marginBottom: 5,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 5,
    },
    priceMainText: {
        color: "white",
        fontSize: 28,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
    },
    changeBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        gap: 4,
    },
    changeText: {
        fontSize: 16,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
    },
    chartWrapper: {
        height: 250,
        marginVertical: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    timeIntervals: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 10,
        paddingHorizontal: 10,
    },
    intervalBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0A0A0A",
    },
    activeIntervalBtn: {
        backgroundColor: ColorTheme.vibrantPurple,
    },
    intervalText: {
        color: ColorTheme.grey,
        fontSize: 14,
        fontWeight: "bold",
    },
    activeIntervalText: {
        color: "white",
    },
    balanceInfo: {
        flexDirection: "row",
        backgroundColor: "#0A0A0A",
        borderRadius: 25,
        padding: 24,
        marginTop: 20,
        borderWidth: 1,
        borderColor: "#1A1A1A",
    },
    infoCol: {
        flex: 1,
        alignItems: "flex-start",
    },
    verticalDivider: {
        width: 1,
        backgroundColor: "#1A1A1A",
        marginHorizontal: 15,
    },
    infoLabel: {
        color: ColorTheme.grey,
        fontSize: 14,
        marginBottom: 10,
        fontFamily: "Archivo-Regular",
    },
    infoValueRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    infoIcon: {
        width: 24,
        height: 24,
        resizeMode: "contain",
    },
    dollarIconWrapper: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#333",
        justifyContent: "center",
        alignItems: "center",
    },
    dollarIcon: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
    },
    infoValue: {
        color: "white",
        fontSize: 22,
        fontWeight: "bold",
        fontFamily: "Archivo-ExtraBold",
    },
    walletNote: {
        textAlign: "center",
        color: ColorTheme.grey,
        marginTop: 25,
        fontSize: 14,
        fontFamily: "Archivo-Regular",
    },
    actions: {
        flexDirection: "row",
        marginTop: 30,
        gap: 15,
        paddingBottom: 40,
    },
    swapBtn: {
        flex: 1,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#1A1A1A", // Match reference image dark button
        justifyContent: "center",
        alignItems: "center",
    },
    sendBtn: {
        flex: 1.5,
        height: 60,
        borderRadius: 30,
        backgroundColor: ColorTheme.vibrantPurple,
        justifyContent: "center",
        alignItems: "center",
    },
    actionBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: "Archivo-ExtraBold",
    },
});

export default ChartComponent;
