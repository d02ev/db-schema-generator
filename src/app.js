import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import healthRouter from './routes/v1/health.routes';
import dbRouter from './routes/v1/db.routes';
import globalErrorHandler from './middlewares/errorHandler.middleware';

dotenv.config({
  path: [
    'src/config/environments/dev/.env.development',
    'src/config/environments/test/.env.test',
  ]
});

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', healthRouter);
app.use('/api/v1/db', dbRouter);

app.use(globalErrorHandler);

export default app;