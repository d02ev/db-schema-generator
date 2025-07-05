import HttpStatusCodes from '../enums/httpStatusCodes.enum';

export default class FetchMetadataResponse {
  constructor(metadata) {
    this.statusCode = HttpStatusCodes.OK;
    this.message = 'Metadata fetched successfully';
    this.metadata = metadata;
  }
}
