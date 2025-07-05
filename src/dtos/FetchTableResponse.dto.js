import HttpStatusCodes from '../enums/httpStatusCodes.enum';

export default class FetchTableResponse {
  constructor(tables) {
    this.statusCode = HttpStatusCodes.OK;
    this.message = 'Tables fetched successfully';
    this.tables = tables || [];
  }
}
