import { Router } from 'express';
import HttpStatusCodes from '../../enums/httpStatusCodes.enum'

const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.status(HttpStatusCodes.OK).json({
    statusCode: HttpStatusCodes.OK,
    message: 'API is running'
  });
});

// fail endpoint for testing only
healthRouter.get('/fail', (req, res, next) => {
  const error = new Error('This is a simulated failure for testing purposes.');
  next(error);
});

export default healthRouter;