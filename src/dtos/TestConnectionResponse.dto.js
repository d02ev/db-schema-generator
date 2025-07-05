import HttpStatusCodes from '../enums/httpStatusCodes.enum';

export default class TestConnectionResponse {
  constructor() {
    this.statusCode = HttpStatusCodes.OK;
    this.message = 'Database connection successful';
  }
}
