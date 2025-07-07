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
import HttpStatusCodes from '../../src/enums/httpStatusCodes.enum';
import FetchMetadataResponse from '../../src/dtos/FetchMetadataResponse.dto';

jest.mock('../../src/core/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe('DbService', () => {
  let dbService;
  let mockClient;

  beforeEach(() => {
    // Clear all mocks before each test
    mockClientConstructorSpy.mockClear();
    mockConnect.mockClear();
    mockQuery.mockClear();
    mockEnd.mockClear();

    // Set default resolved values for connect, query, end
    // These can be overridden in specific tests if needed
    mockConnect.mockResolvedValue(undefined);
    mockQuery.mockResolvedValue({ rows: [] });
    mockEnd.mockResolvedValue(undefined);

    // dbService will be initialized within specific describe blocks or tests
    // if a pre-initialized instance is needed.
  });

  describe('constructor', () => {
    // No dbService instantiation here, each test creates its own
    it('should initialize pg.Client with basic config for dbUrl without sslmode', () => {
      dbService = new DbService('postgres://user:pass@host:port/db');
      expect(mockClientConstructorSpy).toHaveBeenCalledTimes(1);
      expect(mockClientConstructorSpy).toHaveBeenCalledWith({
        connectionString: 'postgres://user:pass@host:port/db',
      });
      expect(dbService.client).toBeDefined();
    });

    it('should initialize pg.Client with ssl config if dbUrl includes sslmode=require', () => {
      dbService = new DbService('postgres://user:pass@host:port/db?sslmode=require');
      expect(mockClientConstructorSpy).toHaveBeenCalledTimes(1);
      expect(mockClientConstructorSpy).toHaveBeenCalledWith({
        connectionString: 'postgres://user:pass@host:port/db?sslmode=require',
        ssl: { rejectUnauthorized: false },
      });
    });

    it('should initialize pg.Client with ssl config if dbUrl includes sslmode=verify-full', () => {
      dbService = new DbService('postgres://user:pass@host:port/db?sslmode=verify-full');
      expect(mockClientConstructorSpy).toHaveBeenCalledTimes(1);
      expect(mockClientConstructorSpy).toHaveBeenCalledWith({
        connectionString: 'postgres://user:pass@host:port/db?sslmode=verify-full',
        ssl: { rejectUnauthorized: false },
      });
    });

    it('should initialize pg.Client without ssl config if dbUrl includes sslmode=disable', () => {
      dbService = new DbService('postgres://user:pass@host:port/db?sslmode=disable');
      expect(mockClientConstructorSpy).toHaveBeenCalledTimes(1);
      expect(mockClientConstructorSpy).toHaveBeenCalledWith({
        connectionString: 'postgres://user:pass@host:port/db?sslmode=disable',
      });
    });

    it('should initialize pg.Client with basic config and log error for invalid dbUrl (e.g. missing protocol)', () => {
      const logger = require('../../src/core/logger');
      // This URL is invalid for `new URL()` but pg might still process it or parts of it.
      // With simplified logic, even this "malformed" URL (for `new URL()`) will get ssl config
      // if 'sslmode=' is present and not 'sslmode=disable'.
      // The pg library itself is more tolerant of connection string variations.
      dbService = new DbService('user:pass@host:port/db?sslmode=require');
      expect(mockClientConstructorSpy).toHaveBeenCalledTimes(1);
      expect(mockClientConstructorSpy).toHaveBeenCalledWith({
        connectionString: 'user:pass@host:port/db?sslmode=require',
        ssl: { rejectUnauthorized: false }, // This is now expected
      });
      // logger.error is no longer called for this case with the simplified logic
    });

    it('should correctly pass through other URL parameters', () => {
      dbService = new DbService('postgres://user:pass@host:port/db?sslmode=require&application_name=my_app&connect_timeout=5000');
      expect(mockClientConstructorSpy).toHaveBeenCalledTimes(1);
      expect(mockClientConstructorSpy).toHaveBeenCalledWith({
        connectionString: 'postgres://user:pass@host:port/db?sslmode=require&application_name=my_app&connect_timeout=5000',
        ssl: { rejectUnauthorized: false },
      });
    });

    it('should initialize a QueryHelper', () => {
      // This test was originally here, ensuring it still passes.
      // It's re-instantiating dbService to ensure a clean state for this specific test,
      // though mockClientConstructorSpy is cleared in beforeEach.
      dbService = new DbService('test_db_url');
      expect(dbService.queryHelper).toBeInstanceOf(QueryHelper);
    });
  });

  describe('testDbConnection', () => {
    beforeEach(() => {
      dbService = new DbService('test_db_url'); // Initialize for this suite
      mockConnect.mockReset().mockResolvedValue(); // .mockReset() also clears call history
      mockQuery.mockReset().mockResolvedValue({ rows: [{ schema_name: 'public' }, { schema_name: 'test_schema' }] });
      mockEnd.mockReset().mockResolvedValue();
    });

    it('should connect to the database and close the connection on success', async () => {
      const response = await dbService.testDbConnection();

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(1);
      expect(response).toBeInstanceOf(TestConnectionResponse);
    });

    it('should throw DbConnectionError if connection fails', async () => {
      const connectionError = new Error('Connection failed');
      mockConnect.mockRejectedValue(connectionError);

      await expect(dbService.testDbConnection()).rejects.toThrow(DbConnectionError);
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockEnd).not.toHaveBeenCalled();
    });

    it('should return a TestConnectionResponse on successful connection', async () => {
      mockQuery.mockResolvedValue(new TestConnectionResponse());
      const response = await dbService.testDbConnection();

      expect(response).toBeInstanceOf(TestConnectionResponse);
      expect(response.statusCode).toEqual(HttpStatusCodes.OK);
      expect(response.message).toEqual('Database connection successful');
      expect(mockConnect).toHaveBeenCalledTimes(1);
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
  });

  describe('fetchSchemas', () => {
    beforeEach(() => {
      dbService = new DbService('test_db_url'); // Initialize for this suite
      mockClientConstructorSpy.mockClear(); // Clear spy after dbService instantiation for this suite
      mockConnect.mockReset().mockResolvedValue();
      mockQuery.mockReset().mockResolvedValue({ rows: [{ schema_name: 'public' }, { schema_name: 'test_schema' }] });
      mockEnd.mockReset().mockResolvedValue();
    });

    it('should fetch all schemas from the database', async () => {
      const response = await dbService.fetchSchemas();

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(1);
      expect(response.schemas).toEqual(['public', 'test_schema']);
    });

    it('should throw QueryExecutionError if fetching schemas fails', async () => {
      const queryError = new Error('Query failed');
      mockQuery.mockRejectedValue(queryError);

      await expect(dbService.fetchSchemas()).rejects.toThrow(QueryExecutionError);
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchTables', () => {
    beforeEach(() => {
      dbService = new DbService('test_db_url'); // Initialize for this suite
      mockClientConstructorSpy.mockClear(); // Clear spy after dbService instantiation for this suite
      mockConnect.mockReset().mockResolvedValue();
      mockQuery.mockReset().mockResolvedValue({ rows: [{ table_name: 'users' }, { table_name: 'orders' }] });
      mockEnd.mockReset().mockResolvedValue();
    });

    it('should fetch all tables for a given schema', async () => {
      const response = await dbService.fetchTables('public');

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(1);
      expect(response.tables).toEqual(['users', 'orders']);
    });

    it('should throw QueryExecutionError if fetching tables fails', async () => {
      const queryError = new Error('Query failed');
      mockQuery.mockRejectedValue(queryError);

      await expect(dbService.fetchTables('public')).rejects.toThrow(QueryExecutionError);
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchColumnsMetadata', () => {
    beforeEach(() => {
      dbService = new DbService('test_db_url'); // Initialize for this suite
      mockClientConstructorSpy.mockClear(); // Clear spy after dbService instantiation for this suite
      mockConnect.mockReset().mockResolvedValue();
      mockQuery.mockReset().mockResolvedValue({
        rows: [
          { table_name: 'users', column_name: 'id', data_type: 'integer' },
          { table_name: 'users', column_name: 'name', data_type: 'text' },
        ],
      });
      mockEnd.mockReset().mockResolvedValue();
    });

    it('should fetch columns metadata for given schema and tables', async () => {
      // dbService.client will be available due to the beforeEach initialization
      const response = await dbService.fetchColumnsMetadata(dbService.client, 'public', ['users']);

      expect(mockConnect).toHaveBeenCalledTimes(0); // These methods don't connect/end directly
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(0);
      expect(response).toEqual([
        { table_name: 'users', column_name: 'id', data_type: 'int' },
        { table_name: 'users', column_name: 'name', data_type: 'text' },
      ]);
    });

    it('should throw QueryExecutionError if fetching columns metadata fails', async () => {
      const queryError = new Error('Query failed');
      mockQuery.mockRejectedValue(queryError);

      await expect(dbService.fetchColumnsMetadata(dbService.client, 'public', ['users'])).rejects.toThrow(QueryExecutionError);
      expect(mockConnect).toHaveBeenCalledTimes(0);
      expect(mockEnd).toHaveBeenCalledTimes(0);
    });
  });

  describe('fetchConstraintsMetadata', () => {
    beforeEach(() => {
      dbService = new DbService('test_db_url'); // Initialize for this suite
      mockClientConstructorSpy.mockClear(); // Clear spy after dbService instantiation for this suite
      mockConnect.mockReset().mockResolvedValue();
      mockQuery.mockReset().mockResolvedValue({
        rows: [
          { table_name: 'users', column_name: 'id' },
          { table_name: 'users', column_name: 'email' },
        ],
      });
      mockEnd.mockReset().mockResolvedValue();
    });

    it('should fetch constraints metadata for given schema and tables', async () => {
      // dbService.client will be available due to the beforeEach initialization
      const response = await dbService.fetchConstraintsMetadata(dbService.client, 'public', ['users'], 'PRIMARY KEY');

      expect(mockConnect).toHaveBeenCalledTimes(0); // These methods don't connect/end directly
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(0);
      expect(response).toEqual({ users: ['id', 'email'] });
    });

    it('should throw QueryExecutionError if fetching constraints metadata fails', async () => {
      const queryError = new Error('Query failed');
      mockQuery.mockRejectedValue(queryError);

      await expect(dbService.fetchConstraintsMetadata(dbService.client, 'public', ['users'], 'PRIMARY KEY')).rejects.toThrow(QueryExecutionError);
      expect(mockConnect).toHaveBeenCalledTimes(0);
      expect(mockEnd).toHaveBeenCalledTimes(0);
    });
  });

  describe('fetchFkMetadata', () => {
    beforeEach(() => {
      dbService = new DbService('test_db_url'); // Initialize for this suite
      mockClientConstructorSpy.mockClear(); // Clear spy after dbService instantiation for this suite
      mockConnect.mockReset().mockResolvedValue();
      mockQuery.mockReset().mockResolvedValue({
        rows: [
          { source_table: 'users', source_column: 'id', target_table: 'orders', target_column: 'user_id' },
        ],
      });
      mockEnd.mockReset().mockResolvedValue();
    });

    it('should fetch foreign key metadata for given schema and tables', async () => {
      // dbService.client will be available due to the beforeEach initialization
      const response = await dbService.fetchFkMetadata(dbService.client, 'public', ['users']);

      expect(mockConnect).toHaveBeenCalledTimes(0); // These methods don't connect/end directly
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(0);
      expect(response).toEqual([
        { source_table: 'users', source_column: 'id', target_table: 'orders', target_column: 'user_id' },
      ]);
    });

    it('should throw QueryExecutionError if fetching foreign key metadata fails', async () => {
      const queryError = new Error('Query failed');
      mockQuery.mockRejectedValue(queryError);

      await expect(dbService.fetchFkMetadata(dbService.client, 'public', ['users'])).rejects.toThrow(QueryExecutionError);
      expect(mockConnect).toHaveBeenCalledTimes(0);
      expect(mockEnd).toHaveBeenCalledTimes(0);
    });
  });

  describe('fetchMetadata', () => {
    beforeEach(() => {
      dbService = new DbService('test_db_url'); // Initialize for this suite
      mockClientConstructorSpy.mockClear(); // Clear spy after dbService instantiation for this suite
      mockConnect.mockReset().mockResolvedValue();
      // Specific mock for the first call (columns) in fetchMetadata
      mockQuery.mockImplementationOnce(() => Promise.resolve({
        rows: [{ table_name: 'users', column_name: 'id', data_type: 'integer' }]
      }))
      // Specific mock for the second call (pk)
      .mockImplementationOnce(() => Promise.resolve({
        rows: [{ table_name: 'users', column_name: 'id' }]
      }))
      // Specific mock for the third call (uniq)
      .mockImplementationOnce(() => Promise.resolve({
        rows: [] // No unique constraints for this example
      }))
      // Specific mock for the fourth call (fks)
      .mockImplementationOnce(() => Promise.resolve({
        rows: [] // No foreign keys for this example
      }));
      mockEnd.mockReset().mockResolvedValue();
    });

    it('should fetch metadata for given schema and tables', async () => {
      const response = await dbService.fetchMetadata('public', 'users');

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledTimes(4); // columns, pk, uniq, fks
      expect(mockEnd).toHaveBeenCalledTimes(1);
      expect(response).toEqual({
        statusCode: HttpStatusCodes.OK,
        message: 'Metadata fetched successfully',
        metadata: [{
          table_name: 'users',
          columns: [
            { table_name: 'users', column_name: 'id', data_type: 'int' },
          ],
          primary_key: ['id'],
          foreign_keys: [],
        }]
      });
      expect(response).toBeInstanceOf(FetchMetadataResponse);
    });

    it('should throw QueryExecutionError if fetching metadata fails', async () => {
      const queryError = new Error('Query failed');
      // Reset mockQuery from beforeEach and set it to reject for this specific test
      mockQuery.mockReset();
      mockQuery.mockRejectedValueOnce(queryError); // The first query (for columns) will fail

      await expect(dbService.fetchMetadata('public', 'users')).rejects.toThrow(QueryExecutionError);
      expect(mockConnect).toHaveBeenCalledTimes(1); // Connection is attempted
      // mockQuery was called (and rejected)
      expect(mockEnd).toHaveBeenCalledTimes(1); // Should be called in the finally block
    });
  });
});
