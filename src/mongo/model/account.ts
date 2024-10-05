import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
    {
        network_name: {
            type: String,
            require: true,
            unique: true,
        },
        ticker: {
            type: String,
            require: true,
            unique: true
        },
        address: {
            type: String,
            require: false,
            unique: false,
        },
        balance: {
            type: Number,
            require: false,
            unique: false,
            default: 0
        }
    }
);

const Account = mongoose.model("Account", accountSchema);

export default Account;