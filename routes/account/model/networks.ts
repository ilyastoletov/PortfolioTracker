export type Network = {
    name: string,
    ticker: string,
};

export const networks: Network[] = [
    { name: 'Bitcoin', ticker: 'BTC' },
    { name: 'Ethereum', ticker: 'ETH' },
    { name: 'Solana', ticker: 'SOL' },
    { name: 'Toncoin', ticker: 'TON' },
    { name: 'Avalanche', ticker: 'AVAX' },
    { name: 'Tether USD', ticker: 'USDT' },
    { name: 'BNB', ticker: 'BNB' },
    { name: 'Ripple', ticker: 'XRP' },
    { name: 'Tron', ticker: 'TRX' },
    { name: 'Monero', ticker: 'XMR' },
    { name: 'Polygon', ticker: 'MATIC' },
];