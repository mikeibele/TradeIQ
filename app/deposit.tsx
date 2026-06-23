import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    FlatList, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import ColorTheme from '../src/config/ColorTheme';
import { getMarketData } from '../src/api/CryptoService';

export default function DepositScreen() {
    const router = useRouter();
    const [coins, setCoins] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCoins = async () => {
            const data = await getMarketData();
            setCoins(data.slice(0, 5));
            setIsLoading(false);
        };
        fetchCoins();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.coinItem} activeOpacity={0.7}>
            <View style={styles.coinLeft}>
                <View style={styles.iconContainer}>
                    <Image source={{ uri: item.image }} style={styles.coinIcon} />
                </View>
                <View style={styles.coinInfo}>
                    <Text style={styles.coinName}>{item.name}</Text>
                    <Text style={styles.coinSymbol}>{item.symbol.toUpperCase()}</Text>
                </View>
            </View>
            <View style={styles.coinRight}>
                <Text style={styles.coinPrice}>${item.current_price.toLocaleString()}</Text>
                <SymbolView name="chevron.right" size={16} tintColor={ColorTheme.grey} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.modalContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                        <SymbolView name="xmark" size={24} tintColor="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Deposit Coin</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.searchSection}>
                    <View style={styles.searchInner}>
                        <SymbolView name="magnifyingglass" size={18} tintColor={ColorTheme.grey} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search"
                            placeholderTextColor={ColorTheme.grey}
                        />
                    </View>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={ColorTheme.vibrantPurple} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={coins}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ColorTheme.black,
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#1E1030', // Darkish purple
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    closeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
    },
    searchSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A1A3D', // Slightly lighter purple
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: 'white',
        fontSize: 16,
        fontFamily: 'Archivo-Regular',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    coinItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2A1A3D',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#3D2D50',
    },
    coinLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1E1030',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coinIcon: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
    coinInfo: {
        marginLeft: 12,
    },
    coinName: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
    },
    coinSymbol: {
        color: ColorTheme.grey,
        fontSize: 14,
        fontFamily: 'Archivo-Regular',
        marginTop: 2,
    },
    coinRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    coinPrice: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Archivo-ExtraBold',
        fontWeight: 'bold',
    },
});
