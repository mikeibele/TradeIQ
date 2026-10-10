import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import React from "react";
import ColorTheme from "../config/ColorTheme";
import Svg, { Path, Line, Circle } from "react-native-svg";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";

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
    logoUrl, // Note: not used anymore as we display nice flags/icons derived or currency symbols in text
    name,
    symbol,
    sparkLine,
    high_24h,
    low_24h,
    price_change_percentage_24h,
}) => {
    const isPositive = price_change_percentage_24h > 0;
    const changeColor = isPositive ? ColorTheme.trendingGreen : ColorTheme.trendingRed;
    const isJpy = symbol.includes("JPY");
    const decimalPlaces = isJpy ? 3 : 5;

    // Timeframe selector state
    const [activeInterval, setActiveInterval] = React.useState("1H");
    const [localSparkline, setLocalSparkline] = React.useState<any[]>(sparkLine);

    React.useEffect(() => {
        setLocalSparkline(sparkLine);
    }, [sparkLine]);

    const handleIntervalChange = (interval: string) => {
        setActiveInterval(interval);

        let multiplier = 0.005; // 1H default
        if (interval === "1M") multiplier = 0.0006;
        else if (interval === "5M") multiplier = 0.0012;
        else if (interval === "15M") multiplier = 0.0025;
        else if (interval === "4H") multiplier = 0.015;
        else if (interval === "1D") multiplier = 0.035;

        // Generate mock points based on interval
        const pointsCount = 30;
        const newPoints: number[] = [];
        let priceTracker = currentPrice * (1 - multiplier * 0.5);

        for (let i = 0; i < pointsCount; i++) {
            const changePercent = (Math.random() - 0.485) * (multiplier * 0.15);
            priceTracker = priceTracker * (1 + changePercent);
            newPoints.push(priceTracker);
        }
        newPoints[newPoints.length - 1] = currentPrice;
        setLocalSparkline(newPoints);
    };

    // Chart logic
    const chartHeight = 200;
    const chartWidth = width - 40;

    let pathData = "";
    let lastPoint = { x: 0, y: 0 };

    if (localSparkline && localSparkline.length > 1) {
        const prices: number[] = localSparkline.map(p => typeof p === 'object' ? p.y : p).filter(p => !isNaN(p));

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

    // Today's Range Calculation
    const rangeSpan = high_24h - low_24h || 0.001;
    const currentOffsetPercent = Math.min(Math.max(((currentPrice - low_24h) / rangeSpan) * 100, 0), 100);

    // Bid/Ask Spread values
    const spreadOffset = isJpy ? 0.012 : 0.00012; // Spread around 1.2 pips
    const bidPrice = currentPrice - spreadOffset / 2;
    const askPrice = currentPrice + spreadOffset / 2;

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={["#0F0824", "transparent"]}
                style={styles.topGradient}
            />

            {/* Header info */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.symbolText}>{symbol}</Text>
                    <Text style={styles.nameText}>{name.split(" (")[0]}</Text>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={styles.priceMainText}>
                        {currentPrice.toFixed(decimalPlaces)}
                    </Text>
                    <View style={[styles.changeBadge, { backgroundColor: isPositive ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)" }]}>
                        <SymbolView
                            name={isPositive ? "arrow.up" : "arrow.down"}
                            size={12}
                            tintColor={changeColor}
                        />
                        <Text style={[styles.changeText, { color: changeColor }]}>
                            {isPositive ? "+" : ""}{price_change_percentage_24h.toFixed(2)}%
                        </Text>
                    </View>
                </View>
            </View>

            {/* Chart Wrapper */}
            <View style={styles.chartWrapper}>
                <Svg height={chartHeight} width={chartWidth}>
                    {/* Grid Lines */}
                    {[0.25, 0.5, 0.75].map((percent, idx) => (
                        <Line
                            key={idx}
                            x1="0"
                            y1={chartHeight * percent}
                            x2={chartWidth}
                            y2={chartHeight * percent}
                            stroke="#1F1535"
                            strokeWidth="1"
                            strokeDasharray="4, 4"
                        />
                    ))}

                    {/* Path */}
                    {pathData !== "" && (
                        <Path
                            d={pathData}
                            fill="none"
                            stroke={ColorTheme.chartGold}
                            strokeWidth="2.5"
                        />
                    )}

                    {/* Laser point endpoint */}
                    {lastPoint.x !== 0 && (
                        <>
                            <Circle
                                cx={lastPoint.x}
                                cy={lastPoint.y}
                                r="5"
                                fill={ColorTheme.chartGold}
                            />
                            <Circle
                                cx={lastPoint.x}
                                cy={lastPoint.y}
                                r="10"
                                fill={ColorTheme.chartGold}
                                opacity={0.25}
                            />
                        </>
                    )}
                </Svg>
            </View>

            {/* Timeframes */}
            <View style={styles.timeIntervals}>
                {["1M", "5M", "15M", "1H", "4H", "1D"].map((interval) => (
                    <TouchableOpacity
                        key={interval}
                        style={[
                            styles.intervalBtn,
                            interval === activeInterval && styles.activeIntervalBtn
                        ]}
                        onPress={() => handleIntervalChange(interval)}
                    >
                        <Text style={[
                            styles.intervalText,
                            interval === activeInterval && styles.activeIntervalText
                        ]}>
                            {interval}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Today's Range Slider */}
            <View style={styles.rangeContainer}>
                <View style={styles.rangeRow}>
                    <Text style={styles.rangeLabel}>Today's Range</Text>
                </View>
                <View style={styles.rangeBarTrack}>
                    <View style={[styles.rangeBarActive, { left: `${currentOffsetPercent}%` }]} />
                </View>
                <View style={styles.rangePriceRow}>
                    <Text style={styles.rangePriceText}>L: {low_24h.toFixed(decimalPlaces)}</Text>
                    <Text style={styles.rangePriceText}>H: {high_24h.toFixed(decimalPlaces)}</Text>
                </View>
            </View>

            {/* Bid / Ask Panel boxes */}
            <View style={styles.bidAskPanel}>
                <View style={styles.bidAskBox}>
                    <Text style={styles.bidAskTitle}>SELL (BID)</Text>
                    <Text style={[styles.bidAskValue, { color: ColorTheme.trendingRed }]}>
                        {bidPrice.toFixed(decimalPlaces)}
                    </Text>
                </View>
                <View style={styles.bidAskBox}>
                    <Text style={styles.bidAskTitle}>BUY (ASK)</Text>
                    <Text style={[styles.bidAskValue, { color: ColorTheme.trendingGreen }]}>
                        {askPrice.toFixed(decimalPlaces)}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        paddingHorizontal: 20,
    },
    topGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 250,
    },
    header: {
        marginTop: 15,
        alignItems: "flex-start",
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    symbolText: {
        color: "white",
        fontSize: 26,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
    },
    nameText: {
        color: ColorTheme.grey,
        fontSize: 14,
        fontFamily: "Archivo-Regular",
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
        fontSize: 32,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
    },
    changeBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 4,
    },
    changeText: {
        fontSize: 13,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
    },
    chartWrapper: {
        height: 220,
        marginTop: 15,
        marginBottom: 5,
        justifyContent: "center",
        alignItems: "center",
    },
    timeIntervals: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 12,
    },
    intervalBtn: {
        flex: 1,
        height: 32,
        marginHorizontal: 3,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#110A1F",
        borderWidth: 1,
        borderColor: "#25173F",
    },
    activeIntervalBtn: {
        backgroundColor: ColorTheme.vibrantPurple,
        borderColor: ColorTheme.vibrantPurple,
    },
    intervalText: {
        color: ColorTheme.grey,
        fontSize: 11,
        fontWeight: "bold",
        fontFamily: "Archivo-ExtraBold",
    },
    activeIntervalText: {
        color: "white",
    },
    rangeContainer: {
        marginVertical: 14,
        padding: 16,
        backgroundColor: "#0D071B",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#23163A",
    },
    rangeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    rangeLabel: {
        color: ColorTheme.grey,
        fontSize: 11,
        fontFamily: "Archivo-Regular",
    },
    rangeBarTrack: {
        height: 4,
        backgroundColor: "#201235",
        borderRadius: 2,
        position: 'relative',
        marginBottom: 6,
    },
    rangeBarActive: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: ColorTheme.chartGold,
        position: 'absolute',
        top: -3,
        shadowColor: ColorTheme.chartGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    rangePriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    rangePriceText: {
        color: 'white',
        fontSize: 11,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: 'bold',
    },
    bidAskPanel: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 10,
    },
    bidAskBox: {
        flex: 1,
        backgroundColor: "#0F0A1F",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#25173F",
        padding: 14,
        alignItems: 'center',
    },
    bidAskTitle: {
        color: ColorTheme.grey,
        fontSize: 10,
        fontFamily: "Archivo-Regular",
        letterSpacing: 1.0,
        marginBottom: 6,
    },
    bidAskValue: {
        fontSize: 18,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
    },
});

export default ChartComponent;
