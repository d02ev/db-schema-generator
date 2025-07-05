// Mock pg first due to hoisting and ES6 module imports

// It's crucial that jest.mock is at the top level, before most imports if it's mocking them.
// pg.Client will be available via the mock.

// Define mock functions and spy at the top level
const mockConnect = jest.fn();
const mockQuery = jest.fn();
const mockEnd = jest.fn();
const mockClientConstructorSpy = jest.fn(); // Spy for the constructor itself

jest.mock('pg', () => {
  // Define the Mock Class INSIDE the factory to handle hoisting
  // mockConnect, mockQuery, etc., are accessible from the outer scope via closure.
  class InnerMockPgClient {
    constructor(config) {
      mockClientConstructorSpy(config);
      this.connect = mockConnect;
      this.query = mockQuery;
      this.end = mockEnd;
    }
  }
  return {
    Client: InnerMockPgClient, // Use the class defined within this factory
  };
});


import DbService from '../src/services/db.service.js';
import QueryHelper from '../src/helpers/query.helper.js';
import DbConnectionError from '../src/errors/dbConnection.error.js';
import QueryExecutionError from '../src/errors/queryExecution.error.js';
import TestConnectionResponse from '../src/dtos/TestConnectionResponse.dto.js';
// We don't need to import pg here directly if DbService is the one using it.
// The mock will apply to DbService's import of pg.

// Mock the logger
jest.mock('../src/core/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe('DbService', () => {
  let dbService;
  let mockClient;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    mockClientConstructorSpy.mockClear(); // Clear the constructor spy

    // Clear mock function calls for connect, query, end
    mockConnect.mockClear();
    mockQuery.mockClear();
    mockEnd.mockClear();

    // Set default promise resolutions for the method mocks
    mockConnect.mockResolvedValue(undefined);
    mockQuery.mockResolvedValue({ rows: [] }); // Default to empty rows
    mockEnd.mockResolvedValue(undefined);

    dbService = new DbService('test_db_url');
  });

  describe('constructor', () => {
    it('should initialize a pg.Client with the provided dbUrl', () => {
      // Check if the InnerMockPgClient constructor was called (via the spy)
      expect(mockClientConstructorSpy).toHaveBeenCalledTimes(1);
      expect(mockClientConstructorSpy).toHaveBeenCalledWith({ connectionString: 'test_db_url' });
      // Check if the client has the mocked methods, as InnerMockPgClient is not directly accessible for instanceof
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
      // Reset mock implementations and calls for client methods
      // These are the global mock functions we defined
      mockConnect.mockReset().mockResolvedValue();
      mockQuery.mockReset().mockResolvedValue({ rows: [{ schema_name: 'public' }, { schema_name: 'test_schema' }] });
      mockEnd.mockReset().mockResolvedValue();
    });

    it('should connect to the database, fetch schemas, and close the connection on success', async () => {
      const expectedSchemas = ['public', 'test_schema'];
      const response = await dbService.testDbConnection();

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      // You might want to add more specific checks for the query arguments if QueryHelper is complex
      expect(mockQuery).toHaveBeenCalledWith(dbService.queryHelper.requestFetchAllSchemasQuery());
      expect(mockEnd).toHaveBeenCalledTimes(1);
      expect(response).toBeInstanceOf(TestConnectionResponse);
      expect(response.schemas).toEqual(expectedSchemas);
    });

    it('should throw DbConnectionError if connection fails', async () => {
      const connectionError = new Error('Connection failed');
      mockConnect.mockRejectedValue(connectionError); // Use global mockConnect

      await expect(dbService.testDbConnection()).rejects.toThrow(DbConnectionError);
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockEnd).not.toHaveBeenCalled(); // Should not attempt to end if connect failed
    });

    it('should throw QueryExecutionError if query fails and still attempt to close connection', async () => {
      const queryError = new Error('Query failed');
      mockQuery.mockRejectedValue(queryError); // Use global mockQuery

      await expect(dbService.testDbConnection()).rejects.toThrow(QueryExecutionError);
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(1); // Should attempt to end even if query failed
    });

    it('should return a TestConnectionResponse with an empty array if query returns no schemas', async () => {
      mockQuery.mockResolvedValue({ rows: [] }); // Use global mockQuery
      const response = await dbService.testDbConnection();

      expect(response).toBeInstanceOf(TestConnectionResponse);
      expect(response.schemas).toEqual([]);
      expect(mockConnect).toHaveBeenCalledTimes(1); // Use global mockConnect
      expect(mockQuery).toHaveBeenCalledTimes(1);   // Use global mockQuery
      expect(mockEnd).toHaveBeenCalledTimes(1);     // Use global mockEnd
    });

    it('should call client.end even if fetching schemas throws an error', async () => {
        mockQuery.mockRejectedValue(new Error('Failed to retrieve schemas')); // Use global mockQuery

        try {
            await dbService.testDbConnection();
        } catch (e) {
            // Expected error
        }

        expect(mockEnd).toHaveBeenCalledTimes(1); // Use global mockEnd
    });

    it('should throw DbConnectionError when client.connect throws an error with a specific message', async () => {
        const errorMessage = 'Specific connection error';
        mockConnect.mockRejectedValue(new Error(errorMessage)); // Use global mockConnect

        try {
            await dbService.testDbConnection();
        } catch (e) {
            expect(e).toBeInstanceOf(DbConnectionError);
            expect(e.message).toBe(errorMessage);
        }
        expect(mockConnect).toHaveBeenCalledTimes(1); // Use global mockConnect
    });

    it('should throw QueryExecutionError when client.query throws an error with a specific message', async () => {
        const errorMessage = 'Specific query error';
        mockQuery.mockRejectedValue(new Error(errorMessage)); // Use global mockQuery

        try {
            await dbService.testDbConnection();
        } catch (e) {
            expect(e).toBeInstanceOf(QueryExecutionError);
            expect(e.message).toBe(errorMessage);
        }
        expect(mockQuery).toHaveBeenCalledTimes(1); // Use global mockQuery
        expect(mockEnd).toHaveBeenCalledTimes(1); // Ensure end is called even on query error // Use global mockEnd
    });
  });
});
