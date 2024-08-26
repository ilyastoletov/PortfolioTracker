import { AvalancheRPC } from "./avax/avalanche";
import { EthereumRPC } from "./eth/ethereum";
import { PolygonRPC } from "./matic/polygon";
import { SolanaRPC } from "./sol/solana";
import { TonRPC } from "./ton/ton";

/*
You can add more RPC-supporting chains:
1. Implement IBlockchainRPC interface
2. Specify key in env.d.ts and .env files
3. Add network to supportedNetworks array
*/

export const supportedNetworks = ['Ethereum', 'Toncoin', 'Avalanche', 'Solana', 'Polygon'];

export default interface IBlockchainRPC {
    getBalance(address: String): Promise<Number>;
    validateAddress(address: String): Promise<Boolean>;
}

export function getRpcInstance(network_name: string): IBlockchainRPC {
    switch (network_name) {
        case "Ethereum":
            return new EthereumRPC();
        case "Toncoin":
            return new TonRPC();
        case "Avalanche":
            return new AvalancheRPC();
        case "Solana":
            return new SolanaRPC();
        case "Polygon":
            return new PolygonRPC();
    }
}