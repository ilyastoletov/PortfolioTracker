import axios from "axios";
import IBlockchainRPC from "../rpc";
import { SolanaAccountInfoResponse } from "./model/SolanaAccountInfoResponse";
import { RpcRequest } from "../model/RpcRequest";

export class SolanaRPC implements IBlockchainRPC {

    async getBalance(address: String): Promise<Number> {
        const accountInfo = await this.getAccountInfo(address as string);
        const lamportsCount = accountInfo.result.value.lamports;
        return lamportsCount / Math.pow(10, 9);
    }

    async validateAddress(address: String): Promise<Boolean> {
        const accountInfo = await this.getAccountInfo(address as string);
        const isExists = (accountInfo.result !== null && accountInfo.result !== undefined)
        return isExists
    }

    private async getAccountInfo(address: string): Promise<SolanaAccountInfoResponse> {
        const requestBody: RpcRequest = {
            jsonrpc: "2.0",
            method: "getAccountInfo",
            params: [address],
            id: "getblock.io"
        }
        const { data, status } = await axios.post<SolanaAccountInfoResponse>(
            "https://go.getblock.io/".concat(process.env.SOL_KEY).concat("/mainnet"),
            requestBody,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )
        return data
    }

}