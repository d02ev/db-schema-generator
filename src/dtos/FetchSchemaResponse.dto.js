import HttpStatusCodes from '../enums/httpStatusCodes.enum';

export default class FetchSchemaResponse {
  constructor(schemas) {
    this.statusCode = HttpStatusCodes.OK;
    this.message = 'Schemas fetched successfully';
    this.schemas = schemas || [];
  }
}
