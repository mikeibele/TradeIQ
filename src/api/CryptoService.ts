import axios from "axios";
import moment from 'moment';

export interface SparklinePoint {
    x: number;
    y: number;
}

const formatSparkline = (numbers: number[]): SparklinePoint[] => {
    const sevenDaysAgo = moment().subtract(7, 'days').unix();
    return numbers.map((item, index) => {
        return {
            x: sevenDaysAgo + (index + 1) * 3600,
            y: item,
        };
    });
};

const formatMarketData = (data: any[]): any[] => {
    return data.map(item => {
        const formattedSparkline = formatSparkline(item.sparkline_in_7d.price);

        return {
            ...item,
            sparkline_in_7d: {
                price: formattedSparkline
            }
        };
    });
};

export const getMarketData = async (): Promise<any[]> => {
    try {
        const response = await axios.get(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=7d&locale=en"
        );
        const data = response.data;
        return formatMarketData(data);
    } catch (error: any) {
        console.log(error.message);
        return [];
    }
};

export const searchCoins = async (query: string): Promise<any[]> => {
    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${query}&order=market_cap_desc&per_page=10&page=1&sparkline=false`
        );
        const data = response.data;
        return formatMarketData(data);
    } catch (error: any) {
        console.log(error.message);
        return [];
    }
};
