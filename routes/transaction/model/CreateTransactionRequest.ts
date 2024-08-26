export type CreateTransactionRequest = {
    account: string,
    amount: number,
    increase: boolean
};

export const isCreateTransactionRequest = (body: any): body is CreateTransactionRequest => {
    return typeof body.account === 'string' && typeof body.amount === 'number' && typeof body.increase === 'boolean'
}