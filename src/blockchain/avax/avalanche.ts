import { isAddress } from "web3-validator";
import IBlockchainRPC from "../rpc";
import { rpcMethodCall } from "../model/RpcRequest";
import axios from "axios";
import { GetBalanceResponse } from "../eth/model/GetBalanceResponse";
import { fromHexadecimalToDecimal } from "../util/eth_like";

export class AvalancheRPC implements IBlockchainRPC {

    async getBalance(address: String): Promise<Number> {
        const requestBody = rpcMethodCall('eth_getBalance', [address as string, 'latest']);
        const url = 'https://go.getblock.io/'.concat(process.env.AVAX_KEY).concat("/ext/bc/C/rpc")
        const { data, status } = await axios.post<GetBalanceResponse>(
            url, requestBody,
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