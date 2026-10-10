import * as SecureStore from 'expo-secure-store';
import { Platform, DeviceEventEmitter } from 'react-native';

export interface Trade {
    id: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    lots: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number; // in USD
    timestamp: number;
    status: 'WIN' | 'LOSS';
}

export interface TraderStats {
    balance: number;
    netPnl: number;
    netPnlPercent: number;
    winRate: number;
    totalTrades: number;
    drawdown: number;
}

const INITIAL_BALANCE = 10000; // $10,000 baseline account

const DEFAULT_TRADES: Trade[] = [
    {
        id: '1',
        symbol: 'EUR/USD',
        type: 'BUY',
        lots: 0.5,
        entryPrice: 1.08200,
        exitPrice: 1.08440,
        pnl: 120.00,
        timestamp: Date.now() - 3600000 * 24 * 3, // 3 days ago
        status: 'WIN'
    },
    {
        id: '2',
        symbol: 'GBP/USD',
        type: 'SELL',
        lots: 1.0,
        entryPrice: 1.27200,
        exitPrice: 1.27280,
        pnl: -80.00,
        timestamp: Date.now() - 3600000 * 24 * 2.5,
        status: 'LOSS'
    },
    {
        id: '3',
        symbol: 'USD/JPY',
        type: 'BUY',
        lots: 0.8,
        entryPrice: 156.200,
        exitPrice: 156.700,
        pnl: 350.00,
        timestamp: Date.now() - 3600000 * 24 * 2,
        status: 'WIN'
    },
    {
        id: '4',
        symbol: 'AUD/USD',
        type: 'BUY',
        lots: 0.4,
        entryPrice: 0.66100,
        exitPrice: 0.66338,
        pnl: 95.20,
        timestamp: Date.now() - 3600000 * 24 * 1.5,
        status: 'WIN'
    },
    {
        id: '5',
        symbol: 'USD/CAD',
        type: 'SELL',
        lots: 0.5,
        entryPrice: 1.36200,
        exitPrice: 1.36330,
        pnl: -65.00,
        timestamp: Date.now() - 3600000 * 24 * 1,
        status: 'LOSS'
    },
    {
        id: '6',
        symbol: 'EUR/GBP',
        type: 'BUY',
        lots: 0.6,
        entryPrice: 0.85200,
        exitPrice: 0.85420,
        pnl: 220.00,
        timestamp: Date.now() - 3600000 * 12, // 12 hrs ago
        status: 'WIN'
    }
];

// In-memory fallback
let inMemoryTrades: Trade[] = [...DEFAULT_TRADES];
const STORAGE_KEY = 'tradeiq_journal_trades';

export const getTrades = async (): Promise<Trade[]> => {
    try {
        if (Platform.OS === 'web') {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                return JSON.parse(raw);
            }
        } else {
            const raw = await SecureStore.getItemAsync(STORAGE_KEY);
            if (raw) {
                return JSON.parse(raw);
            }
        }
    } catch (e) {
        console.error('Failed to load trades from storage, using memory', e);
    }
    return inMemoryTrades;
};

export const saveTrades = async (trades: Trade[]): Promise<void> => {
    inMemoryTrades = trades;
    try {
        const dataStr = JSON.stringify(trades);
        if (Platform.OS === 'web') {
            localStorage.setItem(STORAGE_KEY, dataStr);
        } else {
            await SecureStore.setItemAsync(STORAGE_KEY, dataStr);
        }
    } catch (e) {
        console.error('Failed to save trades to storage', e);
    }
};

export const addTrade = async (trade: Omit<Trade, 'id' | 'timestamp'>): Promise<Trade> => {
    const trades = await getTrades();
    const newTrade: Trade = {
        ...trade,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now()
    };
    const updated = [newTrade, ...trades]; // Newest first
    await saveTrades(updated);
    // Dispatch custom event to notify components if they are listening
    DeviceEventEmitter.emit('journal_updated');
    return newTrade;
};

export const deleteTrade = async (id: string): Promise<void> => {
    const trades = await getTrades();
    const filtered = trades.filter(t => t.id !== id);
    await saveTrades(filtered);
    DeviceEventEmitter.emit('journal_updated');
};

export const resetTrades = async (): Promise<void> => {
    await saveTrades([...DEFAULT_TRADES]);
    DeviceEventEmitter.emit('journal_updated');
};

export const clearAllTrades = async (): Promise<void> => {
    await saveTrades([]);
    DeviceEventEmitter.emit('journal_updated');
};

export const getStats = (trades: Trade[]): TraderStats => {
    const netPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
    const balance = INITIAL_BALANCE + netPnl;
    const netPnlPercent = (netPnl / INITIAL_BALANCE) * 100;

    // Win Rate: Wins / Total
    const winTrades = trades.filter(t => t.status === 'WIN').length;
    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;

    // Drawdown Calculation: simple peak-to-trough estimation for simulation balance
    let peak = INITIAL_BALANCE;
    let maxDd = 0;
    let currBalance = INITIAL_BALANCE;

    // Sort trades chronologically (oldest to newest) to trace equity curve
    const chronTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);
    for (const t of chronTrades) {
        currBalance += t.pnl;
        if (currBalance > peak) {
            peak = currBalance;
        }
        const dd = peak > 0 ? ((peak - currBalance) / peak) * 100 : 0;
        if (dd > maxDd) {
            maxDd = dd;
        }
    }

    return {
        balance,
        netPnl,
        netPnlPercent,
        winRate,
        totalTrades,
        drawdown: maxDd
    };
};
