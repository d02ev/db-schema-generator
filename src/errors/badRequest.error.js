import HttpStatusCodes from '../enums/httpStatusCodes.enum';

export default class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = HttpStatusCodes.BAD_REQUEST;
    this.message = message;
  }
}
