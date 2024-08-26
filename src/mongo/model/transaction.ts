import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        account: {
            type: String,
            require: true
        },
        amount: {
            type: Number,
            require: true
        },
        increase_balance: {
            type: Boolean,
            require: true
        },
        buy_price_usd: {
            type: Number,
            require: true
        }
    }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;