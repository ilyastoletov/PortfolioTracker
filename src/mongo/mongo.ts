import mongoose from 'mongoose';
import Account from './model/account';
import Transaction from './model/transaction';

export const connectDb = () => {
    return mongoose.connect(process.env.DATABASE_URI);
}

const models = { Account, Transaction };

export default models;