import logger from "../core/logger";
import BadRequestError from "../errors/badRequest.error";
import DbConnectionError from "../errors/dbConnection.error";
import InternalServerError from "../errors/internalServer.error";
import NotFoundError from "../errors/notFound.error";
import QueryExecutionError from "../errors/queryExecution.error";

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  if (err instanceof BadRequestError || err instanceof InternalServerError || err instanceof NotFoundError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message
    })
  }
  if (err instanceof DbConnectionError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message || 'Failed to connect to the database'
    });
  }
  if (err instanceof QueryExecutionError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message || 'Failed to execute the database query'
    });
  }

  logger.error('Something went wrong:', err);
  return res.status(500).json({
    statusCode: 500,
    message: 'Something went wrong.'
  });
};

export default globalErrorHandler;