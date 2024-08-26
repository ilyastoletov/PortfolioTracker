import { Router } from "express";
import { isCreateTransactionRequest } from "./model/CreateTransactionRequest";
import models from "../../src/mongo/mongo";
import { supportedNetworks } from "../../src/blockchain/rpc";
import geckoClient from "../../src/gecko/coingecko";
import * as asyncWrapper from "express-async-handler";

export const transactionRouter = Router();

transactionRouter.post("/transaction/add", asyncWrapper(async (req, res) => {
    if (!isCreateTransactionRequest(req.body)) {
        res.status(400).send({ error: "Invalid request" });
        return;
    }

    if (!await isAccountExists(req.body.account)) {
        res.status(400).send({ error: `Account with network name ${ req.body.account } does not exist` });
        return;
    }

    if (!isAccountSupportTransactions(req.body.account)) {
        res.status(400).send({ error: `Account with network name ${ req.body.account } is address-tracking one and does not support transactions` })
        return;
    }

    const account = await models.Account.findOne({ network_name: req.body.account });

    let newBalance: Number
    try {
        newBalance = performBalanceOperation(account.balance, req.body.amount, !req.body.increase);
    } catch(e) {
        res.status(400).send({ error: "Balance after setting must be greater than 0" });
        return;
    }

    await account.updateOne(
        { balance: newBalance }
    );
    
    const transaction = new models.Transaction({
        account: req.body.account,
        amount: req.body.amount,
        increase_balance: req.body.increase,
        buy_price_usd: await getBuyPriceUSD(req.body.account)
    });
    transaction.save()

    res.status(201).send(transaction);
}));

function isAccountSupportTransactions(networkName: string): boolean {
    return supportedNetworks.indexOf(networkName) === -1
}

async function isAccountExists(networkName: string): Promise<Boolean> {
    const accountsByName = await models.Account.find({ network_name: networkName });
    return accountsByName.length > 0
}

function performBalanceOperation(curBalance: number, amount: number, substract: boolean): number {
    let newBalance = curBalance;
    if (substract) {
        if ((curBalance - amount) > 0) {
            newBalance = curBalance - amount
        } else {
            throw Error;
        }
    } else {
        newBalance = curBalance + amount
    }
    return newBalance;
}

async function getBuyPriceUSD(network: string): Promise<Number> { 
    return geckoClient.getCurrentPriceUSD(network);
}

transactionRouter.get("/transaction/all", asyncWrapper(async (req, res) => {
    const allTransactions = await models.Transaction.find({});
    res.status(200).send(allTransactions);
}));

transactionRouter.get("/transaction/byNetwork/:networkName", asyncWrapper(async (req, res) => {
    if (req.params.networkName.length === 0) {
        res.status(400).send({ error: "Network name parameter is empty" });
        return;
    }
    const filteredTransactions = await models.Transaction.find({ account: req.params.networkName });
    res.status(200).send(filteredTransactions);
}));