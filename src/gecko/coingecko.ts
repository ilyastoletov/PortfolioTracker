import axios, { AxiosRequestConfig } from "axios";
import { CoinInfoResponse } from "./model/CoinInfoResponse";
import { CoinMarketInfoResponse } from "./model/CoinMarketInfoResponse";

class CoinGeckoClient {

    private baseUrl = "https://api.coingecko.com/api/v3/"

    private getRequestConfig = (): AxiosRequestConfig => {
        return {
            headers: {
                "x-cg-demo-api-key": process.env.COINGECKO_API_KEY
            }
        }
    }

    async getCurrentPriceUSD(network: string): Promise<Number> {
        const formattedNetworkName = this.mapNetworkNameToID(network);
        const { data, status } = await axios.get<CoinMarketInfoResponse>(
            this.baseUrl.concat("simple/price/").concat(`?ids=${formattedNetworkName}&vs_currencies=usd`),
            this.getRequestConfig()
        );
        return data[formattedNetworkName].usd;
    }

    async getMultiplePricesUSD(networks: string[]): Promise<Map<String,Number>> {
        const prices = new Map();
        const currenciesIds = networks.map((v) => { return this.mapNetworkNameToID(v) });
        const currenciesJoined = currenciesIds.join(',');
        const { data, status } = await axios.get<CoinMarketInfoResponse>(
            this.baseUrl.concat("simple/price/").concat(`?ids=${currenciesJoined}&vs_currencies=usd`),
            this.getRequestConfig()
        )
        for (const key in data) {
            const item = data[key].usd;
            prices.set(this.backwardsMap(key), item);
        }
        return prices;
    }

    async isNetworkAvailable(network: string): Promise<Boolean> {
        const { data, status } = await axios.get<CoinInfoResponse[]>(
            this.baseUrl.concat("coins/list"),
            this.getRequestConfig()
        );
        const foundNetwork = data.find((v) => { v.name == network });
        return (typeof foundNetwork != undefined);
    }

    private mapNetworkNameToID(name: string): string {
        switch(name) {
            case "Toncoin":
                return "the-open-network";
            case "Tether USD":
                return "tether";
            case "Avalanche":
                return "avalanche-2";
            case "BNB":
                return "binancecoin"
            case "Polygon":
                return "matic-network"
            default:
                return name.toLowerCase();
        }
    }

    private backwardsMap(id: string): string {
        switch(id) {
            case "the-open-network":
                return "Toncoin";
            case "tether":
                return "Tether USD";
            case "avalanche-2":
                return "Avalanche";
            case "binancecoin":
                return "BNB"
            case "matic-network":
                return "Polygon"
            default:
                return this.capitalize(id);
        }
    }

    private capitalize(str: string): string {
        return str[0].toUpperCase() + str.substring(1, str.length).toLowerCase()
    }

}

const geckoClient = new CoinGeckoClient();

export default geckoClient;
