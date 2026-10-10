import {
    View, TouchableWithoutFeedback, Keyboard, Text, TextInput, FlatList,
    ActivityIndicator, RefreshControl, StyleSheet, Image, TouchableOpacity, ScrollView,
    DeviceEventEmitter,
} from "react-native";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { responsiveScreenFontSize, responsiveScreenHeight, responsiveScreenWidth } from "react-native-responsive-dimensions";
import ColorTheme from "../src/config/ColorTheme";
import ListItem from "../src/components/ListItem";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { AntDesign, Ionicons, FontAwesome5 } from "@expo/vector-icons";

// Forex and Journal Stores
import { getMarketData, tickRates, ForexPair } from "../src/api/ForexService";
import { getTrades, getStats, resetTrades, clearAllTrades, Trade, TraderStats } from "../src/api/JournalStore";

const debounce = (func: Function, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

export default function MarketScreen() {
    const router = useRouter();
    const [data, setData] = useState<ForexPair[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ForexPair[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Journal and Stats States
    const [trades, setTrades] = useState<Trade[]>([]);
    const [stats, setStats] = useState<TraderStats>({
        balance: 10000,
        netPnl: 0,
        netPnlPercent: 0,
        winRate: 0,
        totalTrades: 0,
        drawdown: 0
    });

    // Tracking price directions for flash animation colors
    const [priceDirections, setPriceDirections] = useState<Record<string, 'up' | 'down' | null>>({});
    const prevPricesRef = useRef<Record<string, number>>({});

    // Fetch Forex Market and Journal Data
    const fetchAllData = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const forexData = await getMarketData();
            setData(forexData);

            // Fetch Journal trades and stats
            const journalTrades = await getTrades();
            setTrades(journalTrades);
            const calculatedStats = getStats(journalTrades);
            setStats(calculatedStats);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData(true);

        // Set up tick interval for real-time rates
        const tickInterval = setInterval(() => {
            const ticked = tickRates();

            // Determine price direction changes
            const directions: Record<string, 'up' | 'down' | null> = {};
            ticked.forEach(pair => {
                const prev = prevPricesRef.current[pair.id];
                if (prev) {
                    if (pair.current_price > prev) directions[pair.id] = 'up';
                    else if (pair.current_price < prev) directions[pair.id] = 'down';
                }
                prevPricesRef.current[pair.id] = pair.current_price;
            });
            setPriceDirections(directions);
            setData(ticked);

            // Clear direction flashes after 600ms
            setTimeout(() => {
                setPriceDirections(prev => {
                    const cleared = { ...prev };
                    ticked.forEach(p => { cleared[p.id] = null; });
                    return cleared;
                });
            }, 600);
        }, 1200);

        // Listen for internal trade journal updates
        const handleJournalUpdate = () => {
            getTrades().then(updatedTrades => {
                setTrades(updatedTrades);
                setStats(getStats(updatedTrades));
            });
        };

        const subscription = DeviceEventEmitter.addListener('journal_updated', handleJournalUpdate);

        return () => {
            clearInterval(tickInterval);
            subscription.remove();
        };
    }, []);

    // Handle Search Query Filter
    const handleSearchQueryChange = useCallback(
        debounce((query: string) => {
            setSearchQuery(query);
            if (query.trim() !== "") {
                const results = data.filter((pair: ForexPair) =>
                    pair.symbol.toLowerCase().includes(query.toLowerCase()) ||
                    pair.name.toLowerCase().includes(query.toLowerCase())
                );
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300),
        [data]
    );

    const navigateToDetails = useCallback((item: ForexPair) => {
        router.push({
            pathname: "/details",
            params: {
                id: item.id,
                name: item.name,
                symbol: item.symbol,
                current_price: item.current_price,
                image: item.image,
                price_change_percentage_24h: item.price_change_percentage_24h,
                sparkline: JSON.stringify(item.sparkline_in_7d.price.map(p => p.y)),
                spread: item.spread,
                pipDecimalPlaces: item.pipDecimalPlaces
            }
        });
    }, [router]);

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchAllData(false);
        setIsRefreshing(false);
    };

    const handleResetJournal = async () => {
        await resetTrades();
    };

    const handleClearJournal = async () => {
        await clearAllTrades();
    };

    const displayedPairs = searchQuery !== "" ? searchResults : data;

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ColorTheme.accentYellow} />
                <Text style={styles.loadingText}>Initializing Trading Environment...</Text>
            </SafeAreaView>
        );
    }

    const ActionButton = ({ icon, label, onPress, color = ColorTheme.white }: { icon: string, label: string, onPress?: () => void, color?: string }) => (
        <View style={styles.actionButtonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={onPress}>
                <SymbolView
                    name={icon as any}
                    size={24}
                    tintColor={color}
                    fallback={<Text style={{ color }}>+</Text>}
                />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>{label}</Text>
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={styles.container}>
                <StatusBar style="light" />
                <LinearGradient
                    colors={[ColorTheme.gradientStart, ColorTheme.gradientEnd]}
                    style={StyleSheet.absoluteFillObject}
                />

                <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                    <FlatList
                        keyExtractor={(item) => item.id}
                        data={displayedPairs}
                        ListHeaderComponent={
                            <>
                                {/* Header: Profile */}
                                <View style={styles.header}>
                                    <View style={styles.profileSection}>
                                        <View style={styles.avatarBorder}>
                                            <Image
                                                source={{ uri: 'https://i.pravatar.cc/150?u=trader1' }}
                                                style={styles.avatar}
                                            />
                                        </View>
                                        <View style={styles.profileInfo}>
                                            <View style={styles.nameRow}>
                                                <Text style={styles.fullName}>Samuel B. (Demo Account)</Text>
                                                <SymbolView name="checkmark.seal.fill" size={14} tintColor={ColorTheme.accentYellow} />
                                            </View>
                                            <Text style={styles.traderRank}>Senior Risk Manager</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.supportBtn}>
                                        <Ionicons name="information-circle-outline" size={22} color="white" />
                                    </TouchableOpacity>
                                </View>

                                {/* Performance Metrics Panel */}
                                <View style={styles.performanceDashboard}>
                                    <Text style={styles.dashboardLabel}>PORTFOLIO EQUITY</Text>
                                    <Text style={styles.balanceText}>
                                        ${stats.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>

                                    <View style={styles.pnlBadgeContainer}>
                                        <View style={[
                                            styles.pnlBadge,
                                            { backgroundColor: stats.netPnl >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                                        ]}>
                                            <Text style={[
                                                styles.pnlText,
                                                { color: stats.netPnl >= 0 ? ColorTheme.trendingGreen : ColorTheme.trendingRed }
                                            ]}>
                                                {stats.netPnl >= 0 ? '+' : ''}${stats.netPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({stats.netPnlPercent.toFixed(2)}%)
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Stats Grid */}
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statsCard}>
                                            <Text style={styles.statsCardLabel}>Win Rate</Text>
                                            <Text style={[styles.statsCardVal, { color: ColorTheme.chartGold }]}>{stats.winRate.toFixed(1)}%</Text>
                                        </View>
                                        <View style={styles.statsCard}>
                                            <Text style={styles.statsCardLabel}>Drawdown</Text>
                                            <Text style={[styles.statsCardVal, { color: ColorTheme.trendingRed }]}>{stats.drawdown.toFixed(2)}%</Text>
                                        </View>
                                        <View style={styles.statsCard}>
                                            <Text style={styles.statsCardLabel}>Total Trades</Text>
                                            <Text style={styles.statsCardVal}>{stats.totalTrades}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Quick Actions */}
                                <View style={styles.actionsGrid}>
                                    <ActionButton
                                        icon="arrow.down.right.circle.fill"
                                        label="Calculate Risk"
                                        onPress={() => router.push("/deposit")}
                                        color={ColorTheme.vibrantPurple}
                                    />
                                    <ActionButton
                                        icon="arrow.counterclockwise.circle.fill"
                                        label="Reset Journal"
                                        onPress={handleResetJournal}
                                        color={ColorTheme.chartGold}
                                    />
                                    <ActionButton
                                        icon="trash.circle.fill"
                                        label="Clear Journal"
                                        onPress={handleClearJournal}
                                        color={ColorTheme.trendingRed}
                                    />
                                </View>

                                {/* Search Bar */}
                                <View style={styles.searchContainer}>
                                    <View style={styles.searchInner}>
                                        <SymbolView name="magnifyingglass" size={18} tintColor={ColorTheme.grey} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Search major/minor forex pairs..."
                                            placeholderTextColor={ColorTheme.grey}
                                            defaultValue={searchQuery}
                                            onChangeText={handleSearchQueryChange}
                                        />
                                    </View>
                                </View>

                                {/* Coin List Section */}
                                <View style={styles.listHeader}>
                                    <Text style={styles.listTitle}>Live Currency Rates</Text>
                                    <View style={styles.liveIndicator}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.liveText}>REALTIME</Text>
                                    </View>
                                </View>
                            </>
                        }
                        renderItem={({ item }) => {
                            return (
                                <ListItem
                                    name={item.name}
                                    symbol={item.symbol}
                                    currentPrice={item.current_price}
                                    logoUrl={item.image}
                                    priceChangePercentage7d={item.price_change_percentage_7d_in_currency}
                                    pipDecimalPlaces={item.pipDecimalPlaces}
                                    spread={item.spread}
                                    onPress={() => navigateToDetails(item)}
                                />
                            );
                        }}
                        ListFooterComponent={
                            <View style={styles.footerContainer}>
                                <Text style={styles.journalHeader}>Performance Trade Journal</Text>

                                {trades.length === 0 ? (
                                    <View style={styles.emptyJournal}>
                                        <Ionicons name="journal-outline" size={40} color={ColorTheme.grey} />
                                        <Text style={styles.emptyJournalText}>No logged trades found</Text>
                                        <Text style={styles.emptyJournalSub}>Add trades using details screen or risk calculator.</Text>
                                    </View>
                                ) : (
                                    <View style={styles.journalList}>
                                        {trades.map((trade) => {
                                            const isWin = trade.status === 'WIN';
                                            return (
                                                <View key={trade.id} style={styles.journalItem}>
                                                    <View style={styles.journalLeft}>
                                                        <View style={[styles.typeBadge, { backgroundColor: trade.type === 'BUY' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                                                            <Text style={[styles.typeBadgeText, { color: trade.type === 'BUY' ? ColorTheme.trendingGreen : ColorTheme.trendingRed }]}>
                                                                {trade.type}
                                                            </Text>
                                                        </View>
                                                        <View style={{ marginLeft: 10 }}>
                                                            <Text style={styles.journalSymbol}>{trade.symbol}</Text>
                                                            <Text style={styles.journalMeta}>{trade.lots.toFixed(2)} Lots @ {trade.entryPrice.toFixed(trade.symbol === 'USD/JPY' ? 3 : 5)}</Text>
                                                        </View>
                                                    </View>

                                                    <View style={styles.journalRight}>
                                                        <Text style={[styles.journalPnl, { color: isWin ? ColorTheme.trendingGreen : ColorTheme.trendingRed }]}>
                                                            {isWin ? '+' : ''}${trade.pnl.toFixed(2)}
                                                        </Text>
                                                        <Text style={styles.journalDate}>
                                                            {new Date(trade.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        }
                        contentContainerStyle={{ paddingBottom: 100 }}
                        initialNumToRender={10}
                        windowSize={5}
                        removeClippedSubviews={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={onRefresh}
                                tintColor={ColorTheme.accentYellow}
                            />
                        }
                    />
                </SafeAreaView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: ColorTheme.grey,
        marginTop: 15,
        fontFamily: "Archivo-Regular",
        fontSize: 14,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    supportBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        justifyContent: "center",
        alignItems: "center",
    },
    profileSection: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarBorder: {
        padding: 2,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: ColorTheme.accentYellow,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    profileInfo: {
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    fullName: {
        color: ColorTheme.white,
        fontSize: 15,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
    },
    traderRank: {
        color: ColorTheme.grey,
        fontSize: 12,
        fontFamily: "Archivo-Regular",
        marginTop: 1,
    },
    performanceDashboard: {
        alignItems: "center",
        marginTop: 25,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        marginHorizontal: 16,
        paddingVertical: 24,
        paddingHorizontal: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
    },
    dashboardLabel: {
        color: ColorTheme.grey,
        fontSize: 12,
        fontFamily: "Archivo-Regular",
        letterSpacing: 1.5,
    },
    balanceText: {
        color: ColorTheme.white,
        fontSize: responsiveScreenFontSize(4.8),
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
        marginTop: 6,
    },
    pnlBadgeContainer: {
        marginTop: 8,
    },
    pnlBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
    },
    pnlText: {
        fontSize: 14,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
    },
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 24,
        gap: 10,
    },
    statsCard: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: "center",
    },
    statsCardLabel: {
        color: ColorTheme.grey,
        fontSize: 11,
        fontFamily: "Archivo-Regular",
    },
    statsCardVal: {
        color: ColorTheme.white,
        fontSize: 16,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
        marginTop: 6,
    },
    actionsGrid: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 30,
        paddingHorizontal: 25,
        marginTop: 24,
    },
    actionButtonContainer: {
        alignItems: "center",
    },
    actionButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    actionLabel: {
        color: ColorTheme.grey,
        fontSize: 11,
        marginTop: 6,
        fontFamily: "Archivo-Regular",
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
    searchInner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#0F0C16",
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 48,
        borderWidth: 1,
        borderColor: "#231B2F",
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: ColorTheme.white,
        fontSize: 13,
        fontFamily: "Archivo-Regular",
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginTop: 24,
        marginBottom: 12,
    },
    listTitle: {
        color: ColorTheme.white,
        fontSize: 16,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
    },
    liveIndicator: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 5,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: ColorTheme.trendingGreen,
    },
    liveText: {
        color: ColorTheme.trendingGreen,
        fontSize: 9,
        fontWeight: "bold",
        fontFamily: "Archivo-ExtraBold",
    },
    footerContainer: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    journalHeader: {
        color: ColorTheme.white,
        fontSize: 16,
        fontFamily: "Archivo-ExtraBold",
        fontWeight: "bold",
        marginBottom: 12,
    },
    emptyJournal: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 35,
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderStyle: 'dashed',
    },
    emptyJournalText: {
        color: ColorTheme.white,
        fontFamily: "Archivo-ExtraBold",
        fontSize: 14,
        marginTop: 10,
    },
    emptyJournalSub: {
        color: ColorTheme.grey,
        fontFamily: "Archivo-Regular",
        fontSize: 11,
        marginTop: 4,
        textAlign: "center",
    },
    journalList: {
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    journalItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.05)",
    },
    journalLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignItems: "center",
        minWidth: 46,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
        fontFamily: "Archivo-ExtraBold",
    },
    journalSymbol: {
        color: ColorTheme.white,
        fontFamily: "Archivo-ExtraBold",
        fontSize: 14,
        fontWeight: "bold",
    },
    journalMeta: {
        color: ColorTheme.grey,
        fontFamily: "Archivo-Regular",
        fontSize: 11,
        marginTop: 2,
    },
    journalRight: {
        alignItems: "flex-end",
    },
    journalPnl: {
        fontFamily: "Archivo-ExtraBold",
        fontSize: 14,
        fontWeight: "bold",
    },
    journalDate: {
        color: ColorTheme.grey,
        fontFamily: "Archivo-Regular",
        fontSize: 10,
        marginTop: 4,
    }
});
