export default class FetchTableRequest {
  constructor(req) {
    this.dbUrl = req.body.dbUrl;
    this.tableSchema = req.body.tableSchema;
  }
}
