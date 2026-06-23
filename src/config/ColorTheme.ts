const ColorTheme = {
    eerieBlack: "#1E1E1E",
    FernGreen: "#4B7F52",
    primary: "#4B7F52", // Added primary mapping
    white: "#FBFBFB",
    black: "#000000",
    raisanBlack1: "#2E2532",
    raisanBlack2: "#201A23",
    atomicTangerine: '#F98948',
    red: "#ef233c",
    grey: "#A2A0A0",
    fadedYellow: "#E4E6C3",
    gradientStart: "#1a0b2e",
    gradientEnd: "#000000",
    darkCard: "#121212",
    accentYellow: "#facc15",
    trendingGreen: "#22c55e",
    trendingRed: "#ef4444",
    vibrantPurple: "#8B5CF6",
    darkGrey: "#1A1A1A",
    chartGold: "#FACC15",
} as const;

export default ColorTheme;
export type ColorThemeType = typeof ColorTheme;
