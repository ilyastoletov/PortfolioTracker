import * as express from 'express';
import * as dotenv from 'dotenv';
import { connectDb } from './src/mongo/mongo';
import { accountRouter } from './routes/account/account';
import { transactionRouter } from './routes/transaction/transaction';
import { portfolioRouter } from './routes/portfolio/portfolio';

dotenv.config();

const app = express();
app.use(express.json());
app.use(accountRouter);
app.use(transactionRouter);
app.use(portfolioRouter);

app.use((error, req, res, next) => {
    console.log(error.stack);
    res.status(500).json(
        {
            error: error.message,
        }
    )
});

connectDb().then(async () => {
    app.listen(3000, () => { console.log("App has started on port 3000") });
});