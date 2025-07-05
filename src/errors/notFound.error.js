import HttpStatusCodes from '../enums/httpStatusCodes.enum';

export default class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = HttpStatusCodes.NOT_FOUND;
    this.message = message;
  }
}
