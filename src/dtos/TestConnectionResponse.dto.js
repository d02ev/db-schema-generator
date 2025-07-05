import HttpStatusCodes from "../enums/httpStatusCodes.enum";

export default class TestConnectionResponse {
  constructor(schemas) {
    this.statusCode = HttpStatusCodes.OK;
    this.message = 'Database connection successful';
    this.schemas = schemas || [];
  }
};