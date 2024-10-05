import { Router, Request, Response } from "express";
import { isCreateAccountRequest } from "./model/CreateAccountRequest";
import models from '../../src/mongo/mongo';
import { supportedNetworks } from "../../src/blockchain/rpc";
import IBlockchainRPC, { getRpcInstance } from "../../src/blockchain/rpc";
import geckoClient from "../../src/gecko/coingecko";
import { networks, Network } from "./model/networks";
import * as asyncWrapper from "express-async-handler";
import { isEditAddressRequest } from "./model/EditAddressRequest";
import { CLIENT_RENEG_LIMIT } from "tls";

export const accountRouter = Router();

accountRouter.post("/account/add", asyncWrapper(async (req: Request, res: Response) => {
    if (!isCreateAccountRequest(req.body)) {
        res.status(400).send({ error: "Invalid request" });
        return;
    }

    if (!await isNetworkSupported(req.body.network_name)) {
        res.status(400).send({ error: "Network is not supported" });
        return;
    }

    if (await isAlreadyExists(req.body.network_name)) {
        res.status(400).send({ error: "Account with this network name already exists" });
        return;
    }

    const address = req.body.address;
    if (address != null) {
        if (!isNetworkSupportedForTracking(req.body.network_name)) {
            res.status(400).send({ error: "Supplied network is not supported for address balance tracking yet." });
            return;
        }
        if (!await isAddressValid(req.body.network_name, req.body.address)) {
            res.status(400).send({ error: "Supplied address is not valid" });
            return;
        }
    }

    const model = {
        network_name: req.body.network_name,
        address: address,
        ticker: getTicker(req.body.network_name),
        balance: req.body.balance
    };

    const account = new models.Account(model);
    account.save();

    if (address == null) {
        await createAndSaveInitialTransaction(req.body.network_name, req.body.balance);
    }

    res.status(201).send(account);
}));

async function isNetworkSupported(name: string): Promise<Boolean> {
    return geckoClient.isNetworkAvailable(name);
}

async function isAlreadyExists(name: string): Promise<Boolean> {
    const foundAccounts = await models.Account.find({ network_name: name });
    return foundAccounts.length > 0
}

function isNetworkSupportedForTracking(name: string): boolean {
    return supportedNetworks.indexOf(name) >= 0;
}

async function isAddressValid(network: string, address: string): Promise<Boolean> { 
    const rpcInstance: IBlockchainRPC = getRpcInstance(network);
    const isAddressValid = await rpcInstance.validateAddress(address);
    return isAddressValid; 
}

function getTicker(name: string): string {
    const names = networks.map(v => v.name);
    const nameIndex = names.indexOf(name);
    return networks[nameIndex].ticker;
}

async function createAndSaveInitialTransaction(network: string, amount: number) {
    const currentBuyPrice = await geckoClient.getCurrentPriceUSD(network);
    const transaction = new models.Transaction({
        account: network,
        amount: amount,
        increase_balance: true,
        buy_price_usd: currentBuyPrice as Number
    });
    transaction.save();
}

accountRouter.get("/account/addressTrackingNetworks", (req, res) => {
    res.status(200).send(supportedNetworks);
});

accountRouter.get("/account/availableNetworks", asyncWrapper(async (req, res) => {
    const allNetworks = networks;
    const availableNetworks = await excludeExistingNetworks(allNetworks);
    res.status(200).send(availableNetworks);
}));

async function excludeExistingNetworks(allNetworks: Network[]): Promise<String[]> {
    const existingNetworkNames = [];
    (await models.Account.find({})).map(
        (v) => { existingNetworkNames.push(v.network_name) }
    );
    const availableNetworks = [];
    for (const network of allNetworks) {
        if (existingNetworkNames.indexOf(network.name) === -1) {
            availableNetworks.push(network);
        }
    }
    return availableNetworks;
}

accountRouter.patch("/account/editAddress", asyncWrapper(async (req, res) => {
    if (!isEditAddressRequest(req.body)) {
        res.status(400).send({ error: "Specify all required query parameters" });
        return;
    }
    const account = await models.Account.findOne({ network_name: req.body.account });
    if (account.address === undefined) {
        res.status(400).send({ error: "This account has no address" });
        return;
    }
    if (!await isAddressValid(req.body.account, req.body.newAddress)) {
        res.status(400).send({ error: "New address is not valid" });
        return;
    }
    await account.updateOne({ address: req.body.newAddress });
    res.status(200).send({});
}));

accountRouter.get("/account/all", asyncWrapper(async (_, res) => {
    const allAccounts = await models.Account.find({});
    res.status(200).send(allAccounts);
}));

accountRouter.get("/account/byName/:name", asyncWrapper(async (req, res) => {
    const account = await models.Account.findOne({ network_name: req.params.name });
    if (account == null) {
        res.status(404).send({ error: "No such account found" });
        return;
    }
    res.status(200).send(account);
}));

accountRouter.delete("/account/:networkName", asyncWrapper(async (req, res) => {
    const account = await models.Account.findOne({ network_name: req.params.networkName });
    await models.Account.deleteOne({ network_name: req.params.networkName });
    await models.Transaction.deleteMany({ account: req.params.networkName });
    res.status(200).send(account);
}));