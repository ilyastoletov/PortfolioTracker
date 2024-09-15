import { Router } from "express";
import * as asyncWrapper from 'express-async-handler';
import { Currency, PortfolioResponse } from './model/PortfolioResponse';
import models from "../../src/mongo/mongo";
import geckoClient from "../../src/gecko/coingecko";
import { getRpcInstance } from "../../src/blockchain/rpc";

export const portfolioRouter = Router();

portfolioRouter.get("/portfolio", asyncWrapper(async (req, res) => {
    const prices = await getPricesUsd();
    const currencies = await getCurrencies(prices);
    const netWorthUSD = await calculateNetWorthUSD(prices);
    const netWorthBTC = await calculateNetWorthBTC(netWorthUSD);

    const response: PortfolioResponse = {
        currencies: currencies,
        total_usd: netWorthUSD,
        total_btc: netWorthBTC
    };

    res.status(200).send(response);
}));

async function getPricesUsd(): Promise<Map<String, Number>> {
    const accounts = await models.Account.find({});
    const accountNetworkNames = accounts.map((v) => { return v.network_name });
    const prices = await geckoClient.getMultiplePricesUSD(accountNetworkNames);
    return prices;
}

async function getCurrencies(pricesUSD: Map<String, Number>): Promise<Currency[]> {
    const accounts = await models.Account.find({});
    const currencies: Currency[] = [];
    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const priceUSD = pricesUSD.get(account.network_name);
        const balance = await getAccountBalance(account.network_name, account.balance, account.address);
        const balanceUSD = (balance as number) * (priceUSD as number);
        const roundedBalanceUSD = Number(balanceUSD.toFixed(0));
        currencies.push(
            {
                name: account.network_name,
                cur_price: Number(priceUSD.toFixed(0)),
                balance: balance,
                balance_usd: roundedBalanceUSD
            }
        );
    }
    return currencies;
}

async function getAccountBalance(network_name: string, acc_balance: number, address: string): Promise<Number> {
    let balance: Number;
    if (address == null) {
        balance = acc_balance;
    } else {
        balance = await getBalanceRPC(network_name, address);
    }
    return balance;
}

async function getBalanceRPC(network_name: string, address: string): Promise<Number> {
    const rpcClient = getRpcInstance(network_name);
    const balance = await rpcClient.getBalance(address);
    return balance;
}

async function calculateNetWorthUSD(prices: Map<String, Number>): Promise<Number> {
    const accounts = await models.Account.find({});
    let worth: number = 0;
    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        const priceUSD = prices.get(account.network_name) as number;
        const balance = await getAccountBalance(account.network_name, account.balance, account.address) as number;
        worth += (balance * priceUSD);
    }
    return Number(worth.toFixed(2));
}

async function calculateNetWorthBTC(worthUSD: Number): Promise<Number> {
    const btcPriceUSD = await geckoClient.getCurrentPriceUSD("Bitcoin") as number;
    const worth = (worthUSD as number) / btcPriceUSD
    return Number(worth.toFixed(9));
}
