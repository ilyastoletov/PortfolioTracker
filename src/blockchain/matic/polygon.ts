import { isAddress } from "web3-validator";
import IBlockchainRPC from "../rpc";
import { rpcMethodCall } from "../model/RpcRequest";
import { fromHexadecimalToDecimal } from "../util/eth_like";
import axios from "axios";
import { GetBalanceResponse } from "../eth/model/GetBalanceResponse";

export class PolygonRPC implements IBlockchainRPC {

    async getBalance(address: String): Promise<Number> {
        const body = rpcMethodCall('eth_getBalance', [address as string, 'latest']);
        const url = 'https://go.getblock.io/'.concat(process.env.MATIC_KEY).concat("/")
        const { data, status } = await axios.post<GetBalanceResponse>(
            url, body,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )
        return fromHexadecimalToDecimal(data.result);
    }

    async validateAddress(address: String): Promise<Boolean> {
        return isAddress(address as string);
    }

}