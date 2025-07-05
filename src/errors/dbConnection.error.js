export default class DbConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DbConnectionError';
    this.statusCode = 500;
    this.message = message || 'Failed to connect to the database';
  }
}
