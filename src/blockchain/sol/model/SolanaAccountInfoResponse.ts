export type SolanaAccountInfoResponse = {
    result: ResultObject
};

type ResultObject = {
    value: ResultValue
};

type ResultValue = {
    lamports: number
}