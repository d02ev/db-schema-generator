import { Router } from 'express';
import DbController from '../../controllers/db.controller';

const dbRouter = Router();
const dbController = new DbController();

dbRouter
  .get('/get-schemas', dbController.getSchemas)
  .get('/get-tables', dbController.getTables)
  .get('/get-diagram-data', dbController.getDiagramData)
  .post('/test-connection', dbController.testConnection);

export default dbRouter;