export type TonAddressInfo = {
    ok: boolean,
    result: AddressResult
};

type AddressResult = {
    balance: number,
    state: string
};