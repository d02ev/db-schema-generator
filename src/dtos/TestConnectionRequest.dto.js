export default class TestConnectionRequest {
  constructor(req) {
    this.dbUrl = req.body.dbUrl;
  }
}
