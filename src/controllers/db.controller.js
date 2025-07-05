/* eslint-disable no-unused-vars */
import DbService from '../services/db.service';
import asyncHandler from '../utils/asyncHandler';

export default class DbController {
  testConnection = asyncHandler(async (req, res, next) => {
    const dbUrl = req.body.dbUrl;
    const dbService = new DbService(dbUrl);
    const testConnectionResponse = await dbService.testDbConnection();
    res.status(testConnectionResponse.statusCode).json(testConnectionResponse);
  });

  getSchemas = asyncHandler(async (req, res, next) => {
    const dbUrl = req.query.dbUrl;
    const dbService = new DbService(dbUrl);
    const fetchSchemaResponse = await dbService.fetchSchemas();
    res.status(fetchSchemaResponse.statusCode).json(fetchSchemaResponse);
  });

  getTables = asyncHandler(async (req, res, next) => {
    const dbUrl = req.query.dbUrl;
    const tableSchema = req.query.tableSchema;
    const dbService = new DbService(dbUrl);
    const fetchTableResponse = await dbService.fetchTables(tableSchema);
    res.status(fetchTableResponse.statusCode).json(fetchTableResponse);
  });

  getDiagramData = asyncHandler(async (req, res, next) => {
    const dbUrl = req.query.dbUrl;
    const tableSchema = req.query.tableSchema;
    const tablesNames = req.query.tableNames;
    const dbService = new DbService(dbUrl);
    const fetchMetadataResponse = await dbService.fetchMetadata(tableSchema, tablesNames);
    res.status(fetchMetadataResponse.statusCode).json(fetchMetadataResponse);
  });
}
