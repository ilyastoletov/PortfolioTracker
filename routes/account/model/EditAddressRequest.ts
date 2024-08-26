export type EditAddressRequest = {
    account: string,
    newAddress: string
}

export const isEditAddressRequest = (obj: any): obj is EditAddressRequest => {
    return typeof obj.account === 'string' && typeof obj.newAddress === 'string'
}