import moment from 'moment';

export interface SparklinePoint {
    x: number;
    y: number;
}

export interface ForexPair {
    id: string;
    name: string;
    symbol: string;
    current_price: number;
    bid: number;
    ask: number;
    spread: number; // in pips
    image: string;
    price_change_24h: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d_in_currency: number;
    sparkline_in_7d: {
        price: SparklinePoint[];
    };
    high_24h: number;
    low_24h: number;
    pipDecimalPlaces: number; // 4 or 2 (for JPY)
}

// Initial baseline values for Forex Pairs
const INITIAL_PAIRS: Omit<ForexPair, 'bid' | 'ask' | 'price_change_24h' | 'price_change_percentage_24h' | 'price_change_percentage_7d_in_currency' | 'sparkline_in_7d' | 'high_24h' | 'low_24h'>[] = [
    {
        id: "eurusd",
        name: "EUR/USD (Euro / US Dollar)",
        symbol: "EUR/USD",
        current_price: 1.08542,
        spread: 1.2, // pips
        image: "https://flagcdn.com/w160/eu.png",
        pipDecimalPlaces: 5
    },
    {
        id: "gbpusd",
        name: "GBP/USD (Pound / US Dollar)",
        symbol: "GBP/USD",
        current_price: 1.26857,
        spread: 1.5,
        image: "https://flagcdn.com/w160/gb.png",
        pipDecimalPlaces: 5
    },
    {
        id: "usdjpy",
        name: "USD/JPY (US Dollar / Yen)",
        symbol: "USD/JPY",
        current_price: 157.425,
        spread: 1.8,
        image: "https://flagcdn.com/w160/jp.png",
        pipDecimalPlaces: 3
    },
    {
        id: "audusd",
        name: "AUD/USD (Aussie / US Dollar)",
        symbol: "AUD/USD",
        current_price: 0.66482,
        spread: 1.4,
        image: "https://flagcdn.com/w160/au.png",
        pipDecimalPlaces: 5
    },
    {
        id: "usdcad",
        name: "USD/CAD (US Dollar / Loonie)",
        symbol: "USD/CAD",
        current_price: 1.36544,
        spread: 1.6,
        image: "https://flagcdn.com/w160/ca.png",
        pipDecimalPlaces: 5
    },
    {
        id: "eurgbp",
        name: "EUR/GBP (Euro / British Pound)",
        symbol: "EUR/GBP",
        current_price: 0.85561,
        spread: 1.3,
        image: "https://flagcdn.com/w160/eu.png",
        pipDecimalPlaces: 5
    }
];

// Generate synthetic sparkline data based on initial price
const generateSparkline = (basePrice: number, pointsCount = 30): SparklinePoint[] => {
    const timeAgo = moment().subtract(7, 'days').unix();
    const step = (7 * 24 * 3600) / pointsCount;
    const points: SparklinePoint[] = [];
    let currentPrice = basePrice * 0.98; // Start slightly lower

    for (let i = 0; i < pointsCount; i++) {
        // Walk prices in a random brownian motion
        const changePercent = (Math.random() - 0.48) * 0.005; // upward bias slightly
        currentPrice = currentPrice * (1 + changePercent);
        points.push({
            x: timeAgo + i * step,
            y: currentPrice
        });
    }

    return points;
};

// Store current rates in memory so they persist during active session ticks
let currentRates: ForexPair[] = INITIAL_PAIRS.map(pair => {
    const sparkline = generateSparkline(pair.current_price);
    const startPrice = sparkline[0].y;
    const finalPrice = pair.current_price;
    const priceChange = finalPrice - startPrice;
    const pctChange = (priceChange / startPrice) * 100;

    // Spread calculation: 1 pip = 0.0001 (or 0.01 for JPY)
    const pipMultiplier = pair.pipDecimalPlaces === 3 ? 0.01 : 0.0001;
    const spreadOffset = (pair.spread / 2) * pipMultiplier;

    return {
        ...pair,
        current_price: finalPrice,
        bid: finalPrice - spreadOffset,
        ask: finalPrice + spreadOffset,
        price_change_24h: priceChange,
        price_change_percentage_24h: pctChange,
        price_change_percentage_7d_in_currency: pctChange,
        high_24h: finalPrice * 1.012,
        low_24h: finalPrice * 0.991,
        sparkline_in_7d: {
            price: sparkline
        }
    };
});

// Mutate rates slightly to simulate live ticks
export const tickRates = (): ForexPair[] => {
    currentRates = currentRates.map(pair => {
        const pipMultiplier = pair.pipDecimalPlaces === 3 ? 0.01 : 0.0001;
        const tickDirection = Math.random() > 0.5 ? 1 : -1;
        // Move by fraction of a pip (0.1 to 0.8 pip)
        const pipMovement = (Math.random() * 0.7 + 0.1) * tickDirection;
        const priceDiff = pipMovement * pipMultiplier;
        const newPrice = pair.current_price + priceDiff;

        const spreadOffset = (pair.spread / 2) * pipMultiplier;
        const newBid = newPrice - spreadOffset;
        const newAsk = newPrice + spreadOffset;

        // Keep highs and lows updated
        const newHigh = Math.max(pair.high_24h, newPrice);
        const newLow = Math.min(pair.low_24h, newPrice);

        // Update last sparkline point to match current price
        const prices = [...pair.sparkline_in_7d.price];
        if (prices.length > 0) {
            prices[prices.length - 1] = {
                ...prices[prices.length - 1],
                y: newPrice
            };
        }

        return {
            ...pair,
            current_price: newPrice,
            bid: newBid,
            ask: newAsk,
            high_24h: newHigh,
            low_24h: newLow,
            sparkline_in_7d: {
                price: prices
            }
        };
    });

    return currentRates;
};

export const getMarketData = async (): Promise<ForexPair[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...currentRates];
};

export const getForexDetails = async (id: string): Promise<ForexPair | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return currentRates.find(p => p.id === id);
};
