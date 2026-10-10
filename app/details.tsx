import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import ColorTheme from "../src/config/ColorTheme";
import ChartComponent from "../src/components/ChartComponent";
import { addTrade } from "../src/api/JournalStore";

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
        sparkline,
        spread = "1.2",
        pipDecimalPlaces = "5"
    } = params;

    const parsedSparkline = sparkline ? JSON.parse(sparkline as string) : [];
    const decimalPlaces = parseInt(pipDecimalPlaces as string) || 5;
    const spreadPips = parseFloat(spread as string) || 1.2;

    // Simulation states
    const [livePrice, setLivePrice] = useState<number>(parseFloat(current_price as string));
    const [isTradeActive, setIsTradeActive] = useState(false);
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
    const [lotsInput, setLotsInput] = useState("1.0");
    const [livePnl, setLivePnl] = useState(0);
    const [initialTradePrice, setInitialTradePrice] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Simulate price fluctuation in details page
    useEffect(() => {
        const interval = setInterval(() => {
            const pipSize = decimalPlaces === 3 ? 0.01 : 0.0001;
            const tickDir = Math.random() > 0.5 ? 1 : -1;
            const priceMovement = (Math.random() * 0.5 + 0.1) * tickDir * pipSize;

            setLivePrice(prev => {
                const nextPrice = prev + priceMovement;

                // If trade is active, update live P&L
                if (isTradeActive) {
                    const lotsVal = parseFloat(lotsInput) || 1.0;
                    // Pip value: $10 approximate standard value matching cross currency calculations
                    let pipValueUSD = 10.0;
                    if (symbol === 'USD/JPY') pipValueUSD = 10.0 / (nextPrice / 100);
                    else if (symbol === 'USD/CAD') pipValueUSD = 10.0 / nextPrice;
                    else if (symbol === 'EUR/GBP') pipValueUSD = 10.0 * 1.268;

                    const pipDifference = (nextPrice - initialTradePrice) / pipSize;
                    const computedPnl = pipDifference * pipValueUSD * lotsVal * (tradeType === 'BUY' ? 1 : -1);
                    setLivePnl(computedPnl);
                }

                return nextPrice;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isTradeActive, tradeType, lotsInput, initialTradePrice, decimalPlaces, symbol]);

    // Handle Active Trade Countdown auto-completion
    useEffect(() => {
        if (isTradeActive && countdown > 0) {
            timerRef.current = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (isTradeActive && countdown === 0) {
            handleCloseTrade();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isTradeActive, countdown]);

    // Quick Execute Sim
    const handleExecuteTrade = (type: 'BUY' | 'SELL') => {
        setTradeType(type);
        setInitialTradePrice(livePrice);
        setLivePnl(0);
        setIsTradeActive(true);
        setCountdown(6); // 6 seconds duration trading window
    };

    // Close simulated position and log
    const handleCloseTrade = async () => {
        setIsTradeActive(false);
        if (timerRef.current) clearTimeout(timerRef.current);

        const finalPnl = parseFloat(livePnl.toFixed(2));
        const finalExit = livePrice;

        await addTrade({
            symbol: symbol as string,
            type: tradeType,
            lots: parseFloat(lotsInput) || 1.0,
            entryPrice: initialTradePrice,
            exitPrice: finalExit,
            pnl: finalPnl,
            status: finalPnl >= 0 ? 'WIN' : 'LOSS'
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={["#1B0D36", "black"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
            />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerNav}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <SymbolView name="chevron.left" size={24} tintColor="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{symbol} DETAIL</Text>
                        <View style={styles.spreadLabel}>
                            <Text style={styles.spreadLabelText}>Spread: {spreadPips.toFixed(1)} Pips</Text>
                        </View>
                    </View>

                    <ChartComponent
                        currentPrice={livePrice}
                        logoUrl={image as string}
                        name={name as string}
                        symbol={symbol as string}
                        priceChangePercentage7d={0}
                        sparkLine={parsedSparkline}
                        high_24h={livePrice * 1.004}
                        low_24h={livePrice * 0.996}
                        price_change_24h={0}
                        price_change_percentage_24h={parseFloat(price_change_percentage_24h as string)}
                    />

                    {/* Quick Trade Simulator Panel */}
                    <View style={styles.simulatorPanel}>
                        <Text style={styles.panelTitle}>Quick Trade Simulator</Text>
                        <Text style={styles.panelDesc}>Simulate trades instantly and view real-time portfolio performance tracking.</Text>

                        {isTradeActive ? (
                            <View style={styles.activePositionCard}>
                                <View style={styles.activeHeader}>
                                    <View style={styles.activePairWrapper}>
                                        <View style={[styles.miniBadge, { backgroundColor: tradeType === 'BUY' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                                            <Text style={[styles.miniBadgeText, { color: tradeType === 'BUY' ? ColorTheme.trendingGreen : ColorTheme.trendingRed }]}>
                                                {tradeType}
                                            </Text>
                                        </View>
                                        <Text style={styles.activeSymbol}>{symbol} ({lotsInput} Lots)</Text>
                                    </View>
                                    <View style={styles.countdownRow}>
                                        <SymbolView name="clock.fill" size={12} tintColor={ColorTheme.chartGold} />
                                        <Text style={styles.countdownText}>Closing in {countdown}s</Text>
                                    </View>
                                </View>

                                <View style={styles.pnlDisplayRow}>
                                    <View>
                                        <Text style={styles.rateLabel}>Entry Rate: {initialTradePrice.toFixed(decimalPlaces)}</Text>
                                        <Text style={styles.rateLabel}>Market Price: {livePrice.toFixed(decimalPlaces)}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.rateLabel}>Estimated P&L</Text>
                                        <Text style={[styles.pnlLiveVal, { color: livePnl >= 0 ? ColorTheme.trendingGreen : ColorTheme.trendingRed }]}>
                                            {livePnl >= 0 ? '+' : ''}${livePnl.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.closePosBtn} onPress={handleCloseTrade}>
                                    <Text style={styles.closePosText}>Close Position Immediately</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.tradeInputCard}>
                                <View style={styles.lotsRow}>
                                    <Text style={styles.lotsLabel}>Lot Size (Multiplier)</Text>
                                    <View style={styles.lotInputWrapper}>
                                        <TextInput
                                            style={styles.lotTextEntry}
                                            value={lotsInput}
                                            onChangeText={setLotsInput}
                                            keyboardType="numeric"
                                            placeholder="1.0"
                                            placeholderTextColor={ColorTheme.grey}
                                        />
                                        <Text style={styles.lotsUnit}>standard lot</Text>
                                    </View>
                                </View>

                                <View style={styles.actionButtonsRow}>
                                    <TouchableOpacity
                                        style={[styles.simTradeBtn, styles.buyBtn]}
                                        onPress={() => handleExecuteTrade('BUY')}
                                    >
                                        <Text style={styles.simBtnHeading}>BUY (LONG)</Text>
                                        <Text style={styles.simBtnPrice}>{livePrice.toFixed(decimalPlaces)}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.simTradeBtn, styles.sellBtn]}
                                        onPress={() => handleExecuteTrade('SELL')}
                                    >
                                        <Text style={styles.simBtnHeading}>SELL (SHORT)</Text>
                                        <Text style={styles.simBtnPrice}>{livePrice.toFixed(decimalPlaces)}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
    },
    spreadLabel: {
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    spreadLabelText: {
        color: ColorTheme.vibrantPurple,
        fontSize: 11,
        fontWeight: 'bold',
        fontFamily: 'Archivo-ExtraBold',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 60,
    },
    simulatorPanel: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    panelTitle: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
    },
    panelDesc: {
        color: ColorTheme.grey,
        fontSize: 12,
        fontFamily: 'Archivo-Regular',
        marginTop: 4,
        lineHeight: 18,
    },
    tradeInputCard: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
        borderRadius: 20,
        padding: 16,
        marginTop: 15,
    },
    lotsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    lotsLabel: {
        color: 'white',
        fontFamily: 'Archivo-ExtraBold',
        fontSize: 14,
    },
    lotInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#110922',
        borderWidth: 1,
        borderColor: '#34264E',
        borderRadius: 10,
        paddingHorizontal: 10,
        width: 150,
        height: 40,
    },
    lotTextEntry: {
        flex: 1,
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'Archivo-ExtraBold',
        fontSize: 14,
    },
    lotsUnit: {
        color: ColorTheme.grey,
        fontSize: 10,
        fontFamily: 'Archivo-Regular',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    simTradeBtn: {
        flex: 1,
        borderRadius: 15,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buyBtn: {
        backgroundColor: ColorTheme.trendingGreen,
    },
    sellBtn: {
        backgroundColor: ColorTheme.trendingRed,
    },
    simBtnHeading: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
    },
    simBtnPrice: {
        color: 'white',
        fontSize: 15,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
        marginTop: 3,
    },
    activePositionCard: {
        backgroundColor: '#0F091F',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderRadius: 20,
        padding: 16,
        marginTop: 15,
    },
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 10,
    },
    activePairWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    miniBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        fontFamily: 'Archivo-ExtraBold',
    },
    activeSymbol: {
        color: 'white',
        marginLeft: 8,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
        fontSize: 13,
    },
    countdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    countdownText: {
        color: ColorTheme.chartGold,
        fontSize: 11,
        fontFamily: 'Archivo-Regular',
        fontWeight: 'bold',
    },
    pnlDisplayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
    },
    rateLabel: {
        color: ColorTheme.grey,
        fontSize: 11,
        fontFamily: 'Archivo-Regular',
        marginTop: 2,
    },
    pnlLiveVal: {
        fontSize: 22,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
        marginTop: 3,
    },
    closePosBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    closePosText: {
        color: 'white',
        fontFamily: 'Archivo-ExtraBold',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
