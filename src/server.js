import app from './app';
import logger from './core/logger';

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`DB Schema Generator API is running on port ${PORT}`);
  });
}