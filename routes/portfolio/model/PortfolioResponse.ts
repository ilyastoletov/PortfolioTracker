export type PortfolioResponse = {
    currencies: Currency[],
    total_usd: Number,
    total_btc: Number
};

export type Currency = {
    name: String,
    cur_price: Number,
    balance: Number,
    balance_usd: Number
};