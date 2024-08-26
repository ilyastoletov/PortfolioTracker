import { isAddress } from "web3-validator";
import IBlockchainRPC from "../rpc";
import axios from "axios";
import { GetBalanceResponse } from "./model/GetBalanceResponse";
import { fromHexadecimalToDecimal } from "../util/eth_like";
import { rpcMethodCall } from "../model/RpcRequest";

export class EthereumRPC implements IBlockchainRPC {

    async getBalance(address: String): Promise<Number> {
        const requestBody = rpcMethodCall('eth_getBalance', [address as string, 'latest']);
        const { data, status } = await axios.post<GetBalanceResponse>(
            "https://go.getblock.io/".concat(process.env.ETH_KEY), JSON.stringify(requestBody),
            {
                headers: {
                    'Content-Type': "application/json"
                }
            }
        )
        return fromHexadecimalToDecimal(data.result);
    }

    async validateAddress(address: String): Promise<Boolean> {
        return isAddress(address as string);
    }

}