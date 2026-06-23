import {
    View, TouchableWithoutFeedback, Keyboard, Text, TextInput, FlatList,
    ActivityIndicator, RefreshControl, StyleSheet, Image, TouchableOpacity, ScrollView,
} from "react-native";
import React, { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { responsiveScreenFontSize, responsiveScreenWidth } from "react-native-responsive-dimensions";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import ColorTheme from "../src/config/ColorTheme";
import ListItem from "../src/components/ListItem";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { AntDesign } from "@expo/vector-icons";

const ChartComponent = React.lazy(() => import("../src/components/ChartComponent"));

// --------------------------------------------------------------------
// SAMPLE DATA
// --------------------------------------------------------------------
import { getMarketData } from "../src/api/CryptoService";

const debounce = (func: Function, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

export default function MarketScreen() {
    const router = useRouter();
    const [data, setData] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch Market Data
    const fetchMarketData = async () => {
        setIsLoading(true);
        try {
            const marketData = await getMarketData();
            setData(marketData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketData();
    }, []);

    // Handle Search Query
    const handleSearchQueryChange = useCallback(
        debounce((query: string) => {
            setSearchQuery(query);
            if (query.trim() !== "") {
                const results = data.filter((coin: any) =>
                    coin.name.toLowerCase().includes(query.toLowerCase())
                );
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300),
        [data]
    );

    const navigateToDetails = useCallback((item: any) => {
        router.push({
            pathname: "/details",
            params: {
                id: item.id,
                name: item.name,
                symbol: item.symbol,
                current_price: item.current_price,
                image: item.image,
                price_change_percentage_24h: item.price_change_percentage_24h,
                sparkline: JSON.stringify(item.sparkline_in_7d.price)
            }
        });
    }, [router]);

    const MemoizedListItem = React.memo(ListItem);

    // Refresh function
    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchMarketData();
        setIsRefreshing(false);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ColorTheme.accentYellow} />
            </SafeAreaView>
        );
    }

    const ActionButton = ({ icon, label, onPress }: { icon: string, label: string, onPress?: () => void }) => (
        <View style={styles.actionButtonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={onPress}>
                <SymbolView
                    name={icon as any}
                    size={24}
                    tintColor={ColorTheme.white}
                    fallback={<Text style={{ color: 'white' }}>+</Text>}
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
                        data={(searchQuery !== "" ? searchResults : data).slice(0, 5)}
                        ListHeaderComponent={
                            <>
                                {/* Header: Profile */}
                                <View style={styles.header}>
                                    <View style={styles.profileSection}>
                                        <View style={styles.avatarBorder}>
                                            <Image
                                                source={{ uri: 'https://i.pravatar.cc/150?u=samuel' }}
                                                style={styles.avatar}
                                            />
                                        </View>
                                        <View style={styles.profileInfo}>
                                            <View style={styles.nameRow}>
                                                <Text style={styles.fullName}>Samuel Budiarti</Text>
                                                <SymbolView name="chevron.down" size={12} tintColor={ColorTheme.grey} />
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.supportBtn}>
                                        <AntDesign name="customer-service" size={24} color="white" />
                                    </TouchableOpacity>
                                </View>

                                {/* Balance Section */}
                                <View style={styles.balanceSection}>
                                    <Text style={styles.balanceText}>$58.75</Text>
                                    <View style={styles.pillContainer}>
                                        <View style={[styles.pill, { backgroundColor: '#14532d' }]}>
                                            <Text style={styles.pillText}>+$1.22</Text>
                                        </View>
                                        <View style={[styles.pill, { backgroundColor: '#14532d' }]}>
                                            <Text style={styles.pillText}>+2.12%</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Quick Actions */}
                                <View style={styles.actionsGrid}>
                                    <ActionButton
                                        icon="arrow.down"
                                        label="Deposit"
                                        onPress={() => router.push("/deposit")}
                                    />
                                    <ActionButton icon="arrow.up.right" label="Transfer" />
                                </View>

                                {/* Search Bar */}
                                <View style={styles.searchContainer}>
                                    <View style={styles.searchInner}>
                                        <SymbolView name="magnifyingglass" size={18} tintColor={ColorTheme.grey} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Search tokens or discover new assets"
                                            placeholderTextColor={ColorTheme.grey}
                                            defaultValue={searchQuery}
                                            onChangeText={handleSearchQueryChange}
                                        />
                                    </View>
                                </View>

                                {/* Coin List Section */}
                                <View style={styles.listHeader}>
                                    <Text style={styles.listTitle}>Trending Tokens</Text>
                                    <TouchableOpacity style={styles.dropdownButton}>
                                        <Text style={styles.dropdownText}>Today</Text>
                                        <SymbolView name="chevron.down" size={12} tintColor={ColorTheme.grey} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        }
                        renderItem={({ item }) => (
                            <MemoizedListItem
                                name={item.name}
                                symbol={item.symbol}
                                currentPrice={item.current_price}
                                logoUrl={item.image}
                                priceChangePercentage7d={item.price_change_percentage_7d_in_currency}
                                onPress={() => navigateToDetails(item)}
                            />
                        )}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        initialNumToRender={10}
                        windowSize={5}
                        removeClippedSubviews={true}
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
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    supportBtn: {
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
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    profileInfo: {
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    fullName: {
        color: ColorTheme.white,
        fontSize: 16,
        fontFamily: "Archivo-ExtraBold",
        marginRight: 4,
    },
    balanceSection: {
        alignItems: "center",
        marginTop: 30,
    },
    balanceText: {
        color: ColorTheme.white,
        fontSize: responsiveScreenFontSize(6),
        fontFamily: "Archivo-ExtraBold",
    },
    pillContainer: {
        flexDirection: "row",
        marginTop: 8,
    },
    pill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    pillText: {
        color: ColorTheme.trendingGreen,
        fontSize: 14,
        fontFamily: "Archivo-ExtraBold",
    },
    actionsGrid: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 40,
        paddingHorizontal: 25,
        marginTop: 30,
    },
    actionButtonContainer: {
        alignItems: "center",
    },
    actionButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    actionLabel: {
        color: ColorTheme.grey,
        fontSize: 12,
        marginTop: 8,
        fontFamily: "Archivo-Regular",
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginTop: 25,
    },
    searchInner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#121212",
        borderRadius: 20,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: "#222",
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: ColorTheme.white,
        fontSize: 14,
        fontFamily: "Archivo-Regular",
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginTop: 25,
        marginBottom: 15,
    },
    listTitle: {
        color: ColorTheme.white,
        fontSize: 18,
        fontFamily: "Archivo-ExtraBold",
    },
    dropdownButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    dropdownText: {
        color: ColorTheme.grey,
        fontSize: 12,
        marginRight: 4,
        fontFamily: "Archivo-Regular",
    },
});
