export type CreateAccountRequest = {
    network_name: string,
    address: string | null,
    balance: number
};

export const isCreateAccountRequest = (body: any): body is CreateAccountRequest => {
    return typeof body.network_name === 'string'
}