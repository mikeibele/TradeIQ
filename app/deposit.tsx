import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, KeyboardAvoidingView, Platform, Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import ColorTheme from '../src/config/ColorTheme';
import { getMarketData, ForexPair } from '../src/api/ForexService';
import { getTrades, getStats, addTrade } from '../src/api/JournalStore';

export default function DepositScreen() {
    const router = useRouter();
    const [pairs, setPairs] = useState<ForexPair[]>([]);
    const [selectedPair, setSelectedPair] = useState<ForexPair | null>(null);
    const [showPairSelector, setShowPairSelector] = useState(false);

    // Inputs
    const [balance, setBalance] = useState<string>("10000");
    const [riskPercent, setRiskPercent] = useState<string>("1");
    const [entryPrice, setEntryPrice] = useState<string>("1.0850");
    const [stopLoss, setStopLoss] = useState<string>("1.0830");
    const [tradeDirection, setTradeDirection] = useState<'BUY' | 'SELL'>('BUY');

    // Outputs
    const [cashAtRisk, setCashAtRisk] = useState<number>(100);
    const [pipDistance, setPipDistance] = useState<number>(20);
    const [lots, setLots] = useState<number>(0.5);

    // Fetch Forex pairs and current balance upon load
    useEffect(() => {
        const loadInitialData = async () => {
            const data = await getMarketData();
            setPairs(data);
            if (data.length > 0) {
                const eurusd = data.find(p => p.id === 'eurusd') || data[0];
                setSelectedPair(eurusd);
                setEntryPrice(eurusd.current_price.toFixed(eurusd.pipDecimalPlaces));
                // Set default SL 20 pips away
                const pipMultiplier = eurusd.pipDecimalPlaces === 3 ? 0.01 : 0.0001;
                const slVal = eurusd.current_price - (20 * pipMultiplier);
                setStopLoss(slVal.toFixed(eurusd.pipDecimalPlaces));
            }

            const trades = await getTrades();
            const stats = getStats(trades);
            setBalance(stats.balance.toFixed(2));
        };
        loadInitialData();
    }, []);

    // Perform calculations when inputs change
    useEffect(() => {
        if (!selectedPair) return;

        const balVal = parseFloat(balance) || 10000;
        const riskVal = parseFloat(riskPercent) || 1;
        const entryVal = parseFloat(entryPrice) || 1;
        const slVal = parseFloat(stopLoss) || 1;

        // 1. Cash at risk
        const riskCash = balVal * (riskVal / 100);
        setCashAtRisk(riskCash);

        // 2. Pip distance
        const decimalPlaces = selectedPair.pipDecimalPlaces;
        const pipSize = decimalPlaces === 3 ? 0.01 : 0.0001;
        const distanceVal = Math.abs(entryVal - slVal) / pipSize;
        setPipDistance(distanceVal);

        // 3. Lot calculations
        // Compute standard pip value per lot based on cross currency
        let pipValueUSD = 10.0; // Standard lot size (100k) pip value is $10 for USD quote

        if (selectedPair.symbol === 'USD/JPY') {
            // JPY quote: $10 / (Rate / 100) -> e.g. $10 / (157.42 / 100) = $6.35
            pipValueUSD = 10.0 / (selectedPair.current_price / 100);
        } else if (selectedPair.symbol === 'USD/CAD') {
            // CAD quote: $10 / Rate -> e.g. $10 / 1.365 = $7.32
            pipValueUSD = 10.0 / selectedPair.current_price;
        } else if (selectedPair.symbol === 'EUR/GBP') {
            // GBP quote: $10 * GBPUSD rate. We approximate GBPUSD rate around 1.268
            pipValueUSD = 10.0 * 1.268;
        }

        if (distanceVal > 0) {
            const calculatedLots = riskCash / (distanceVal * pipValueUSD);
            setLots(isNaN(calculatedLots) || !isFinite(calculatedLots) ? 0 : calculatedLots);
        } else {
            setLots(0);
        }
    }, [balance, riskPercent, entryPrice, stopLoss, selectedPair]);

    // Handle pair switch
    const handleSelectPair = (pair: ForexPair) => {
        setSelectedPair(pair);
        setEntryPrice(pair.current_price.toFixed(pair.pipDecimalPlaces));

        // Auto set default stop loss (25 pips away depending on BUY/SELL)
        const pipMultiplier = pair.pipDecimalPlaces === 3 ? 0.01 : 0.0001;
        const directionFactor = tradeDirection === 'BUY' ? -1 : 1;
        const slVal = pair.current_price + (directionFactor * 25 * pipMultiplier);
        setStopLoss(slVal.toFixed(pair.pipDecimalPlaces));

        setShowPairSelector(false);
    };

    // Quick toggle directions
    const handleDirectionChange = (dir: 'BUY' | 'SELL') => {
        setTradeDirection(dir);
        if (!selectedPair) return;

        // Adjust Stop Loss automatically to make sense
        const currEntry = parseFloat(entryPrice) || selectedPair.current_price;
        const pipMultiplier = selectedPair.pipDecimalPlaces === 3 ? 0.01 : 0.0001;
        const directionFactor = dir === 'BUY' ? -1 : 1;
        const slVal = currEntry + (directionFactor * 20 * pipMultiplier);
        setStopLoss(slVal.toFixed(selectedPair.pipDecimalPlaces));
    };

    // Log calculated trade to journal
    const handleLogTrade = async () => {
        if (!selectedPair || lots <= 0) return;

        const entryVal = parseFloat(entryPrice);
        const slVal = parseFloat(stopLoss);

        // Create a realistic outcome
        // Win rate is ~60% to keep things encouraging
        const isWin = Math.random() > 0.4;
        const pipMultiplier = selectedPair.pipDecimalPlaces === 3 ? 0.01 : 0.0001;
        const priceDiff = Math.abs(entryVal - slVal);

        // Target 1.5x to 2x reward for win, or hit SL for loss
        const multiplier = isWin ? (Math.random() * 0.5 + 1.5) : -1.0;
        const profitLossUSD = cashAtRisk * multiplier;

        // Exit price calculation
        const exitOffset = priceDiff * (tradeDirection === 'BUY' ? multiplier : -multiplier);
        const exitVal = entryVal + exitOffset;

        await addTrade({
            symbol: selectedPair.symbol,
            type: tradeDirection,
            lots: parseFloat(lots.toFixed(2)),
            entryPrice: entryVal,
            exitPrice: exitVal,
            pnl: parseFloat(profitLossUSD.toFixed(2)),
            status: isWin ? 'WIN' : 'LOSS'
        });

        // Close modal
        router.back();
    };

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                                <SymbolView name="xmark" size={24} tintColor="white" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Risk Management Calculator</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                            {/* Pair Selection Selector Button */}
                            <Text style={styles.inputLabel}>CURRENCY PAIR</Text>
                            {selectedPair && (
                                <TouchableOpacity
                                    style={styles.pairSelectorBtn}
                                    onPress={() => setShowPairSelector(!showPairSelector)}
                                >
                                    <Text style={styles.selectedPairText}>{selectedPair.symbol} — {selectedPair.name.split(" (")[0]}</Text>
                                    <SymbolView name={showPairSelector ? "chevron.up" : "chevron.down"} size={16} tintColor={ColorTheme.white} />
                                </TouchableOpacity>
                            )}

                            {/* Collapsible Pair list */}
                            {showPairSelector && (
                                <View style={styles.pairsDropdown}>
                                    {pairs.map(pair => (
                                        <TouchableOpacity
                                            key={pair.id}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectPair(pair)}
                                        >
                                            <Text style={styles.dropdownSymbol}>{pair.symbol}</Text>
                                            <Text style={styles.dropdownDesc}>{pair.name.split(" (")[0]}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* BUY/SELL Toggle */}
                            <Text style={[styles.inputLabel, { marginTop: 15 }]}>TRADE DIRECTION</Text>
                            <View style={styles.directionToggle}>
                                <TouchableOpacity
                                    style={[styles.toggleBtn, tradeDirection === 'BUY' && styles.buyActive]}
                                    onPress={() => handleDirectionChange('BUY')}
                                >
                                    <Text style={[styles.toggleText, tradeDirection === 'BUY' && styles.activeText]}>BUY (LONG)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.toggleBtn, tradeDirection === 'SELL' && styles.sellActive]}
                                    onPress={() => handleDirectionChange('SELL')}
                                >
                                    <Text style={[styles.toggleText, tradeDirection === 'SELL' && styles.activeText]}>SELL (SHORT)</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Inputs section */}
                            <View style={styles.inputsGrid}>
                                <View style={styles.inputColumn}>
                                    <Text style={styles.inputLabel}>ACCOUNT BALANCE ($)</Text>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={balance}
                                        onChangeText={setBalance}
                                        keyboardType="numeric"
                                        placeholder="10000"
                                        placeholderTextColor={ColorTheme.grey}
                                    />
                                </View>

                                <View style={styles.inputColumn}>
                                    <Text style={styles.inputLabel}>RISK PERCENTAGE (%)</Text>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={riskPercent}
                                        onChangeText={setRiskPercent}
                                        keyboardType="numeric"
                                        placeholder="1"
                                        placeholderTextColor={ColorTheme.grey}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputsGrid}>
                                <View style={styles.inputColumn}>
                                    <Text style={styles.inputLabel}>ENTRY RATE</Text>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={entryPrice}
                                        onChangeText={setEntryPrice}
                                        keyboardType="numeric"
                                        placeholder="1.0850"
                                        placeholderTextColor={ColorTheme.grey}
                                    />
                                </View>

                                <View style={styles.inputColumn}>
                                    <Text style={styles.inputLabel}>STOP LOSS RATE</Text>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={stopLoss}
                                        onChangeText={setStopLoss}
                                        keyboardType="numeric"
                                        placeholder="1.0830"
                                        placeholderTextColor={ColorTheme.grey}
                                    />
                                </View>
                            </View>

                            {/* Outputs Dashboard Cards */}
                            <View style={styles.calculationResults}>
                                <Text style={styles.resultsHeader}>RISK ANALYSIS RESULTS</Text>

                                <View style={styles.resultRow}>
                                    <Text style={styles.resultLabel}>Total Cash Risked</Text>
                                    <Text style={styles.resultValueUSD}>${cashAtRisk.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </View>

                                <View style={styles.resultRow}>
                                    <Text style={styles.resultLabel}>Stop Loss PIPs</Text>
                                    <Text style={styles.resultValue}>{pipDistance.toFixed(1)} PIPs</Text>
                                </View>

                                <View style={styles.divider} />

                                <Text style={styles.positionLabel}>RECOMMENDED LOT SIZE</Text>

                                <View style={styles.lotsCard}>
                                    <Text style={styles.primaryLots}>
                                        {lots.toFixed(2)} <Text style={styles.lotsSubText}>Standard Lots</Text>
                                    </Text>
                                    <Text style={styles.miniLots}>
                                        {(lots * 10).toFixed(1)} Mini Lots | {(lots * 100).toFixed(0)} Micro Lots
                                    </Text>
                                    <Text style={styles.pipValueLabel}>
                                        Pip Value: <Text style={{ color: 'white', fontWeight: 'bold' }}>${(lots * 10).toFixed(2)} USD</Text> per pip
                                    </Text>
                                </View>
                            </View>

                            {/* Action Logging Button */}
                            <TouchableOpacity
                                style={[styles.logButton, lots <= 0 && styles.disabledButton]}
                                onPress={handleLogTrade}
                                disabled={lots <= 0}
                            >
                                <Text style={styles.logButtonText}>EXECUTE & LOG SIMULATED TRADE</Text>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ColorTheme.black,
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#0A0612', // Premium deep purple-black
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    closeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 50,
        paddingTop: 10,
    },
    inputLabel: {
        color: ColorTheme.grey,
        fontSize: 11,
        fontFamily: 'Archivo-Regular',
        letterSpacing: 1.0,
        marginBottom: 8,
    },
    pairSelectorBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1E1430',
        borderWidth: 1,
        borderColor: '#34264E',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
    },
    selectedPairText: {
        color: 'white',
        fontFamily: 'Archivo-ExtraBold',
        fontSize: 15,
        fontWeight: 'bold',
    },
    pairsDropdown: {
        backgroundColor: '#160E25',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#34264E',
        padding: 6,
        marginBottom: 15,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    dropdownSymbol: {
        color: ColorTheme.chartGold,
        fontFamily: 'Archivo-ExtraBold',
        fontSize: 15,
        fontWeight: 'bold',
        width: 80,
    },
    dropdownDesc: {
        color: ColorTheme.grey,
        fontFamily: 'Archivo-Regular',
        fontSize: 13,
    },
    directionToggle: {
        flexDirection: 'row',
        backgroundColor: '#1E1430',
        borderRadius: 14,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#34264E',
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buyActive: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderWidth: 1,
        borderColor: ColorTheme.trendingGreen,
    },
    sellActive: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: ColorTheme.trendingRed,
    },
    toggleText: {
        color: ColorTheme.grey,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
        fontSize: 12,
    },
    activeText: {
        color: 'white',
    },
    inputsGrid: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 15,
    },
    inputColumn: {
        flex: 1,
    },
    numberInput: {
        backgroundColor: '#120A20',
        borderColor: '#34264E',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        color: 'white',
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
        fontSize: 16,
    },
    calculationResults: {
        backgroundColor: '#140C26',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.15)',
        padding: 20,
        marginTop: 15,
        marginBottom: 25,
    },
    resultsHeader: {
        color: ColorTheme.vibrantPurple,
        fontFamily: 'Archivo-ExtraBold',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.0,
        marginBottom: 15,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 6,
    },
    resultLabel: {
        color: ColorTheme.grey,
        fontFamily: 'Archivo-Regular',
        fontSize: 13,
    },
    resultValue: {
        color: 'white',
        fontFamily: 'Archivo-ExtraBold',
        fontSize: 15,
        fontWeight: 'bold',
    },
    resultValueUSD: {
        color: ColorTheme.trendingGreen,
        fontFamily: 'Archivo-ExtraBold',
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#2D1F49',
        marginVertical: 14,
    },
    positionLabel: {
        color: ColorTheme.grey,
        fontFamily: 'Archivo-Regular',
        fontSize: 11,
        letterSpacing: 1.0,
        marginBottom: 10,
    },
    lotsCard: {
        backgroundColor: '#1E1430',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#34264E',
        alignItems: 'center',
    },
    primaryLots: {
        color: ColorTheme.chartGold,
        fontSize: 26,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
    },
    lotsSubText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'Archivo-Regular',
    },
    miniLots: {
        color: ColorTheme.grey,
        fontSize: 11,
        fontFamily: 'Archivo-Regular',
        marginTop: 8,
    },
    pipValueLabel: {
        color: ColorTheme.grey,
        fontSize: 11,
        fontFamily: 'Archivo-Regular',
        marginTop: 5,
    },
    logButton: {
        backgroundColor: ColorTheme.vibrantPurple,
        borderRadius: 25,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    disabledButton: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        shadowOpacity: 0,
    },
    logButtonText: {
        color: 'white',
        fontFamily: 'Archivo-ExtraBold',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
