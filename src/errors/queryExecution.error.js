export default class QueryExecutionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QueryExecutionError';
    this.statusCode = 500;
    this.message = message || 'Failed to execute the database query';
  }
}