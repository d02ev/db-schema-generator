import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockConnect = jest.fn();
const mockQuery = jest.fn();
const mockEnd = jest.fn();
const mockClientConstructorSpy = jest.fn();

jest.mock('pg', () => {
  class InnerMockPgClient {
    constructor(config) {
      mockClientConstructorSpy(config);
      this.connect = mockConnect;
      this.query = mockQuery;
      this.end = mockEnd;
    }
  }
  return {
    Client: InnerMockPgClient,
  };
});


import DbService from '../../src/services/db.service';
import QueryHelper from '../../src/helpers/query.helper';
import DbConnectionError from '../../src/errors/dbConnection.error';
import QueryExecutionError from '../../src/errors/queryExecution.error';
import TestConnectionResponse from '../../src/dtos/TestConnectionResponse.dto';

jest.mock('../../src/core/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe('DbService', () => {
  let dbService;
  let mockClient;

  beforeEach(() => {
    mockClientConstructorSpy.mockClear();

    mockConnect.mockClear();
    mockQuery.mockClear();
    mockEnd.mockClear();

    mockConnect.mockResolvedValue(undefined);
    mockQuery.mockResolvedValue({ rows: [] });
    mockEnd.mockResolvedValue(undefined);

    dbService = new DbService('test_db_url');
  });

  describe('constructor', () => {
    it('should initialize a pg.Client with the provided dbUrl', () => {
      expect(mockClientConstructorSpy).toHaveBeenCalledTimes(1);
      expect(mockClientConstructorSpy).toHaveBeenCalledWith({ connectionString: 'test_db_url' });
      expect(dbService.client).toBeDefined();
      expect(dbService.client.connect).toBe(mockConnect);
      expect(dbService.client.query).toBe(mockQuery);
      expect(dbService.client.end).toBe(mockEnd);
    });

    it('should initialize a QueryHelper', () => {
      expect(dbService.queryHelper).toBeInstanceOf(QueryHelper);
    });
  });

  describe('testDbConnection', () => {
    beforeEach(() => {
      mockConnect.mockReset().mockResolvedValue();
      mockQuery.mockReset().mockResolvedValue({ rows: [{ schema_name: 'public' }, { schema_name: 'test_schema' }] });
      mockEnd.mockReset().mockResolvedValue();
    });

    it('should connect to the database, fetch schemas, and close the connection on success', async () => {
      const expectedSchemas = ['public', 'test_schema'];
      const response = await dbService.testDbConnection();

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(dbService.queryHelper.requestFetchAllSchemasQuery());
      expect(mockEnd).toHaveBeenCalledTimes(1);
      expect(response).toBeInstanceOf(TestConnectionResponse);
      expect(response.schemas).toEqual(expectedSchemas);
    });

    it('should throw DbConnectionError if connection fails', async () => {
      const connectionError = new Error('Connection failed');
      mockConnect.mockRejectedValue(connectionError);

      await expect(dbService.testDbConnection()).rejects.toThrow(DbConnectionError);
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockEnd).not.toHaveBeenCalled();
    });

    it('should throw QueryExecutionError if query fails and still attempt to close connection', async () => {
      const queryError = new Error('Query failed');
      mockQuery.mockRejectedValue(queryError);

      await expect(dbService.testDbConnection()).rejects.toThrow(QueryExecutionError);
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it('should return a TestConnectionResponse with an empty array if query returns no schemas', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const response = await dbService.testDbConnection();

      expect(response).toBeInstanceOf(TestConnectionResponse);
      expect(response.schemas).toEqual([]);
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it('should call client.end even if fetching schemas throws an error', async () => {
        mockQuery.mockRejectedValue(new Error('Failed to retrieve schemas'));

        try {
            await dbService.testDbConnection();
        } catch (e) {
            expect(e).toBeInstanceOf(QueryExecutionError);
            expect(e.message).toBe('Failed to retrieve schemas');
        }

        expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it('should throw DbConnectionError when client.connect throws an error with a specific message', async () => {
        const errorMessage = 'Specific connection error';
        mockConnect.mockRejectedValue(new Error(errorMessage));

        try {
            await dbService.testDbConnection();
        } catch (e) {
            expect(e).toBeInstanceOf(DbConnectionError);
            expect(e.message).toBe(errorMessage);
        }
        expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should throw QueryExecutionError when client.query throws an error with a specific message', async () => {
        const errorMessage = 'Specific query error';
        mockQuery.mockRejectedValue(new Error(errorMessage));

        try {
            await dbService.testDbConnection();
        } catch (e) {
            expect(e).toBeInstanceOf(QueryExecutionError);
            expect(e.message).toBe(errorMessage);
        }
        expect(mockQuery).toHaveBeenCalledTimes(1);
        expect(mockEnd).toHaveBeenCalledTimes(1);
    });
  });
});
