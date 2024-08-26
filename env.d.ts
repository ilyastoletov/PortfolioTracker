declare namespace NodeJS {
    interface ProcessEnv {
        DATABASE_URI: string;
        COINGECKO_KEY: string;
        // getblock.io keys
        ETH_KEY: string;
        TON_KEY: string;
        TRON_KEY: string;
        AVAX_KEY: string;
        SOL_KEY: string;
        MATIC_KEY: string;
    }
}