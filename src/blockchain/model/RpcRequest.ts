export const rpcMethodCall = (methodName: string, params: string[]): RpcRequest => {
    return {
        jsonrpc: "2.0",
        method: methodName,
        params: params,
        id: "getblock.io"
    }
}

export type RpcRequest = {
    jsonrpc: string,
    method: string,
    params: string[],
    id: string
}