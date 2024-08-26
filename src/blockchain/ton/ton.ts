import IBlockchainRPC from "../rpc";
import axios from "axios";
import { TonAddressInfo } from "./model/TonAddressInfo";

export class TonRPC implements IBlockchainRPC {
    
    private baseUrl = 'https://go.getblock.io/';

    async getBalance(address: string): Promise<Number> {
        const data = await this.getAddressInformation(address);
        return data.result.balance / Math.pow(10, 9);
    }

    async validateAddress(address: string): Promise<Boolean> {
        const addressInfo = await this.getAddressInformation(address);
        return addressInfo.ok
    }

    private async getAddressInformation(address: string): Promise<TonAddressInfo> {
        const { data, status } = await axios.get<TonAddressInfo>(
            this.baseUrl.concat(process.env.TON_KEY).concat("/getAddressInformation?address=").concat(address),
        );
        if (data.result.state === "uninitialized") {
            throw Error("Address is not initialized")
        };
        return data
    }

}
