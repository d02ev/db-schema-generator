import DbService from "../services/db.service";
import asyncHandler from '../utils/asyncHandler';

export default class DbController {
  testConnection = asyncHandler(async (req, res, next) => {
    const dbUrl = req.body.dbUrl;
    const dbService = new DbService(dbUrl);
    const testConnectionResponse = await dbService.testDbConnection();
    res.status(testConnectionResponse.statusCode).json(testConnectionResponse);
  });
};