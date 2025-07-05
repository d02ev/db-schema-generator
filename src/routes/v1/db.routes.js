import { Router } from 'express';
import DbController from '../../controllers/db.controller';

const dbRouter = Router();
const dbController = new DbController();

dbRouter.post('/test-connection', dbController.testConnection);

export default dbRouter;